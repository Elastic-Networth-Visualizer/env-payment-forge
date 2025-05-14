/**
 * @module PaymentProcessor
 *
 * The main payment processing class that coordinates payment operations using
 * configured providers and services.
 */

import {
  CreateCustomerRequest,
  CreatePaymentMethodRequest,
  Customer,
  CustomerSearchFilters,
  PaginationOptions,
  PaymentConfiguration,
  PaymentMethodType,
  PaymentRequest,
  RefundRequest,
  Result,
  Transaction,
  TransactionRefund,
  TransactionSearchFilters,
  UpdateCustomerRequest,
} from "../types/index.ts";

import { TransactionManager } from "./TransactionManager.ts";
import { PaymentMethodManager } from "./PaymentMethodManager.ts";
import { RecurringBillingManager } from "./RecurringBillingManager.ts";
import { RefundProcessor } from "./RefundProcessor.ts";
import { DisputeManager } from "./DisputeManager.ts";
import { FraudDetector } from "../fraud/FraudDetector.ts";
import { RiskAssessment } from "../types/payment.ts";
import { PaymentProvider, Provider } from "../types/provider.ts";
import { validatePaymentRequest } from "../utils/validation.ts";
import { Logger } from "../utils/logger.ts";
import { ConfigurationError, PaymentError, toPaymentError } from "../errors/payment.ts";
import { ProviderRegistry } from "../providers/ProviderRegistry.ts";

/**
 * Main payment processor class for handling all payment operations
 */
export class PaymentProcessor {
  private readonly config: PaymentConfiguration;
  private readonly transactionManager: TransactionManager;
  private readonly paymentMethodManager: PaymentMethodManager;
  private readonly recurringBillingManager: RecurringBillingManager;
  private readonly refundProcessor: RefundProcessor;
  private readonly disputeManager: DisputeManager;
  private readonly fraudDetector: FraudDetector;
  private readonly logger: Logger;
  private readonly providerRegistry: ProviderRegistry;
  private initialized = false;

  /**
   * Create a new PaymentProcessor instance
   *
   * @param config The configuration for the payment processor
   */
  constructor(config: PaymentConfiguration) {
    this.config = this.validateConfig(config);
    this.logger = new Logger(config.logging || { level: "info", redactSensitiveData: true });
    this.providerRegistry = new ProviderRegistry();
    this.transactionManager = new TransactionManager(this.config, this.logger);
    this.paymentMethodManager = new PaymentMethodManager(
      this.config,
      this.providerRegistry,
      this.logger,
    );
    this.recurringBillingManager = new RecurringBillingManager(
      this.config,
      this.providerRegistry,
      this.logger,
    );
    this.refundProcessor = new RefundProcessor(this.config, this.providerRegistry, this.logger);
    this.disputeManager = new DisputeManager(this.config, this.logger);
    this.fraudDetector = new FraudDetector(this.config.fraudDetection, this.logger);

    this.logger.info("PaymentProcessor instance created");
  }

  /**
   * Initialize the payment processor and all its components
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.info("Initializing PaymentProcessor...");

    try {
      // Register and initialize all providers based on configuration
      await this.registerProviders();

      // Initialize all components
      await this.transactionManager.initialize();
      await this.paymentMethodManager.initialize();
      await this.recurringBillingManager.initialize();
      await this.refundProcessor.initialize();
      await this.disputeManager.initialize();
      await this.fraudDetector.initialize();

      this.initialized = true;
      this.logger.info("PaymentProcessor initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize PaymentProcessor", error);
      throw toPaymentError(error, "Failed to initialize PaymentProcessor");
    }
  }

  /**
   * Process a payment using the configured providers
   *
   * @param request Payment request details
   * @returns Result containing the transaction or error information
   */
  public async processPayment(request: PaymentRequest): Promise<Result<Transaction>> {
    this.ensureInitialized();
    this.logger.info("Processing payment", {
      amount: request.amount,
      currency: request.currency,
      customerId: request.customerId,
    });

    try {
      // Validate the payment request
      validatePaymentRequest(request);

      // Determine the payment method type
      const paymentMethod = await this.paymentMethodManager.getPaymentMethod(
        request.paymentMethodId,
      );
      if (!paymentMethod.success || !paymentMethod.data) {
        return {
          success: false,
          errorCode: "payment_method_error",
          errorMessage: "Invalid payment method ID or payment method not found",
        };
      }

      const paymentMethodType = paymentMethod.data.type;

      // Perform fraud detection if enabled
      if (this.config.fraudDetection?.enabled) {
        const riskAssessment = await this.assessRisk(request);
        if (!riskAssessment.success) {
          return {
            success: false,
            errorCode: "fraud_detection_error",
            errorMessage: riskAssessment.errorMessage || "Could not complete fraud assessment",
          };
        }

        // Block high-risk transactions
        if (
          riskAssessment.data &&
          riskAssessment.data.level === "high" &&
          this.config.fraudDetection.thresholds?.highRisk
        ) {
          return {
            success: false,
            errorCode: "high_risk_payment",
            errorMessage: "Payment flagged as high risk",
            data: {
              riskAssessment: riskAssessment.data,
            } as unknown as Transaction,
          };
        }
      }

      // Get the appropriate payment provider for this payment method
      const provider = this.getProviderForPaymentMethod(paymentMethodType);
      if (!provider) {
        return {
          success: false,
          errorCode: "provider_not_found",
          errorMessage: `No provider available for payment method type: ${paymentMethodType}`,
        };
      }

      // Process the payment using the provider
      const result = request.authorizeOnly
        ? await provider.authorizePayment(request)
        : await provider.processPayment(request);

      // Store the transaction
      if (result.success && result.data) {
        await this.transactionManager.saveTransaction(result.data);
      }

      return result;
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error("Payment processing failed", paymentError);
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Authorize a payment without capturing the funds
   *
   * @param request Payment request details
   * @returns Result containing the transaction or error information
   */
  public async authorizePayment(request: PaymentRequest): Promise<Result<Transaction>> {
    return this.processPayment({
      ...request,
      authorizeOnly: true,
    });
  }

  /**
   * Capture a previously authorized payment
   *
   * @param transactionId ID of the previously authorized transaction
   * @param amount Optional amount to capture (defaults to the full authorized amount)
   * @returns Result containing the updated transaction or error information
   */
  public async capturePayment(
    transactionId: string,
    amount?: number,
  ): Promise<Result<Transaction>> {
    this.ensureInitialized();
    this.logger.info(`Capturing payment for transaction: ${transactionId}`);

    try {
      // Get the transaction
      const transactionResult = await this.transactionManager.getTransaction(transactionId);
      if (!transactionResult.success || !transactionResult.data) {
        return {
          success: false,
          errorCode: "transaction_not_found",
          errorMessage: `Transaction with ID ${transactionId} not found`,
        };
      }

      const transaction = transactionResult.data;

      // Verify transaction is in a state that can be captured
      if (transaction.status !== "authorized") {
        return {
          success: false,
          errorCode: "invalid_transaction_state",
          errorMessage:
            `Transaction with ID ${transactionId} cannot be captured (status: ${transaction.status})`,
        };
      }

      // Get the provider for this payment method
      const provider = this.getProviderForPaymentMethod(transaction.paymentMethodType);
      if (!provider) {
        return {
          success: false,
          errorCode: "provider_not_found",
          errorMessage:
            `No provider available for payment method type: ${transaction.paymentMethodType}`,
        };
      }

      // Capture the payment
      const result = await provider.capturePayment(transactionId, amount);

      // Update the transaction
      if (result.success && result.data) {
        await this.transactionManager.updateTransaction(result.data);
      }

      return result;
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error(
        `Failed to capture payment for transaction: ${transactionId}`,
        paymentError,
      );
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Cancel a payment that has not been settled
   *
   * @param transactionId ID of the transaction to cancel
   * @returns Result containing the updated transaction or error information
   */
  public async cancelPayment(transactionId: string): Promise<Result<Transaction>> {
    this.ensureInitialized();
    this.logger.info(`Canceling payment for transaction: ${transactionId}`);

    try {
      // Get the transaction
      const transactionResult = await this.transactionManager.getTransaction(transactionId);
      if (!transactionResult.success || !transactionResult.data) {
        return {
          success: false,
          errorCode: "transaction_not_found",
          errorMessage: `Transaction with ID ${transactionId} not found`,
        };
      }

      const transaction = transactionResult.data;

      // Verify transaction is in a state that can be canceled
      if (
        transaction.status !== "initialized" && transaction.status !== "authorized" &&
        transaction.status !== "pending"
      ) {
        return {
          success: false,
          errorCode: "invalid_transaction_state",
          errorMessage:
            `Transaction with ID ${transactionId} cannot be canceled (status: ${transaction.status})`,
        };
      }

      // Get the provider for this payment method
      const provider = this.getProviderForPaymentMethod(transaction.paymentMethodType);
      if (!provider) {
        return {
          success: false,
          errorCode: "provider_not_found",
          errorMessage:
            `No provider available for payment method type: ${transaction.paymentMethodType}`,
        };
      }

      // Cancel the payment
      const result = await provider.cancelPayment(transactionId);

      // Update the transaction
      if (result.success && result.data) {
        await this.transactionManager.updateTransaction(result.data);
      }

      return result;
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error(`Failed to cancel payment for transaction: ${transactionId}`, paymentError);
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Process a refund for a payment
   *
   * @param request Refund request details
   * @returns Result containing the refund transaction or error information
   */
  public async refundPayment(request: RefundRequest): Promise<Result<TransactionRefund>> {
    this.ensureInitialized();
    this.logger.info(`Processing refund for transaction: ${request.transactionId}`);

    try {
      return await this.refundProcessor.processRefund(request);
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error(
        `Failed to process refund for transaction: ${request.transactionId}`,
        paymentError,
      );
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Create a new customer
   *
   * @param request Customer creation request
   * @returns Result containing the customer ID or error information
   */
  public async createCustomer(request: CreateCustomerRequest): Promise<Result<Customer>> {
    this.ensureInitialized();
    this.logger.info("Creating new customer", { email: request.email });

    try {
      return await this.paymentMethodManager.createCustomer(request);
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error("Failed to create customer", paymentError);
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Update an existing customer
   *
   * @param customerId ID of the customer to update
   * @param request Customer update request
   * @returns Result containing the updated customer or error information
   */
  public async updateCustomer(
    customerId: string,
    request: UpdateCustomerRequest,
  ): Promise<Result<Customer>> {
    this.ensureInitialized();
    this.logger.info(`Updating customer: ${customerId}`);

    try {
      return await this.paymentMethodManager.updateCustomer(customerId, request);
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error(`Failed to update customer: ${customerId}`, paymentError);
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Get a customer by ID
   *
   * @param customerId ID of the customer to retrieve
   * @returns Result containing the customer or error information
   */
  public async getCustomer(customerId: string): Promise<Result<Customer>> {
    this.ensureInitialized();
    this.logger.info(`Retrieving customer: ${customerId}`);

    try {
      return await this.paymentMethodManager.getCustomer(customerId);
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error(`Failed to retrieve customer: ${customerId}`, paymentError);
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Search for customers based on filters
   *
   * @param filters Search filters
   * @param options Pagination options
   * @returns Result containing the list of customers or error information
   */
  public async searchCustomers(
    filters: CustomerSearchFilters,
    options?: PaginationOptions,
  ): Promise<Result<{ customers: Customer[]; total: number; page: number; pageSize: number }>> {
    this.ensureInitialized();
    this.logger.info("Searching customers", filters);

    try {
      return await this.paymentMethodManager.searchCustomers(filters, options);
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error("Failed to search customers", paymentError);
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Create a new payment method for a customer
   *
   * @param request Payment method creation request
   * @returns Result containing the payment method ID or error information
   */
  public async createPaymentMethod(request: CreatePaymentMethodRequest): Promise<Result<string>> {
    this.ensureInitialized();
    this.logger.info(`Creating payment method for customer: ${request.customerId}`);

    try {
      return await this.paymentMethodManager.createPaymentMethod(request);
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error(
        `Failed to create payment method for customer: ${request.customerId}`,
        paymentError,
      );
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Get a transaction by ID
   *
   * @param transactionId ID of the transaction to retrieve
   * @returns Result containing the transaction or error information
   */
  public async getTransaction(transactionId: string): Promise<Result<Transaction>> {
    this.ensureInitialized();
    this.logger.info(`Retrieving transaction: ${transactionId}`);

    try {
      return await this.transactionManager.getTransaction(transactionId);
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error(`Failed to retrieve transaction: ${transactionId}`, paymentError);
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Search for transactions based on filters
   *
   * @param filters Search filters
   * @param options Pagination options
   * @returns Result containing the list of transactions or error information
   */
  public async searchTransactions(
    filters: TransactionSearchFilters,
    options?: PaginationOptions,
  ): Promise<
    Result<{ transactions: Transaction[]; total: number; page: number; pageSize: number }>
  > {
    this.ensureInitialized();
    this.logger.info("Searching transactions", filters);

    try {
      return await this.transactionManager.searchTransactions(filters, options);
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error("Failed to search transactions", paymentError);
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Assess the risk of a payment request
   *
   * @param request Payment request to assess
   * @returns Result containing the risk assessment or error information
   */
  public async assessRisk(request: PaymentRequest): Promise<Result<RiskAssessment>> {
    this.ensureInitialized();

    if (!this.config.fraudDetection?.enabled) {
      return {
        success: true,
        data: {
          score: 0,
          level: "low",
          factors: [],
          recommendations: [{ type: "allow", description: "Fraud detection disabled" }],
          triggeredRules: [],
        },
      };
    }

    try {
      // Check if provider has its own risk assessment
      const paymentMethod = await this.paymentMethodManager.getPaymentMethod(
        request.paymentMethodId,
      );
      if (paymentMethod.success && paymentMethod.data) {
        const provider = this.getProviderForPaymentMethod(paymentMethod.data.type);

        if (provider && "assessRisk" in provider && typeof provider.assessRisk === "function") {
          const providerRiskResult = await provider.assessRisk(request);
          if (providerRiskResult.success && providerRiskResult.data) {
            // Combine provider risk with our own risk assessment
            const ownRiskResult = await this.fraudDetector.assessRisk(request);

            if (ownRiskResult.success && ownRiskResult.data) {
              // Use the higher risk score between the two
              const combinedScore = Math.max(
                providerRiskResult.data.score,
                ownRiskResult.data.score,
              );

              // Determine combined risk level
              let combinedLevel: "low" | "medium" | "high" = "low";
              if (combinedScore >= (this.config.fraudDetection.thresholds?.highRisk ?? 0.8)) {
                combinedLevel = "high";
              } else if (
                combinedScore >= (this.config.fraudDetection.thresholds?.mediumRisk ?? 0.5)
              ) {
                combinedLevel = "medium";
              }

              // Combine factors and recommendations
              const combinedFactors = [
                ...providerRiskResult.data.factors,
                ...ownRiskResult.data.factors,
              ];

              const combinedRecommendations = [
                ...providerRiskResult.data.recommendations,
                ...ownRiskResult.data.recommendations,
              ];

              const combinedRules = [
                ...providerRiskResult.data.triggeredRules,
                ...ownRiskResult.data.triggeredRules,
              ];

              return {
                success: true,
                data: {
                  score: combinedScore,
                  level: combinedLevel,
                  factors: combinedFactors,
                  recommendations: combinedRecommendations,
                  triggeredRules: combinedRules,
                },
              };
            }
          }
        }
      }

      // Fall back to our own risk assessment
      return await this.fraudDetector.assessRisk(request);
    } catch (error) {
      const paymentError = toPaymentError(error);
      this.logger.error("Failed to assess risk", paymentError);
      return {
        success: false,
        error: paymentError,
        errorCode: paymentError.code,
        errorMessage: paymentError.message,
      };
    }
  }

  /**
   * Validate the payment processor configuration
   *
   * @param config Configuration to validate
   * @returns The validated configuration
   * @throws ConfigurationError if the configuration is invalid
   */
  private validateConfig(config: PaymentConfiguration): PaymentConfiguration {
    if (!config) {
      throw new ConfigurationError("Payment configuration is required");
    }

    if (!config.environment) {
      throw new ConfigurationError("Environment is required in payment configuration");
    }

    if (!config.defaultCurrency) {
      throw new ConfigurationError("Default currency is required in payment configuration");
    }

    if (!config.apiKeys) {
      throw new ConfigurationError("API keys are required in payment configuration");
    }

    // Ensure logging configuration has defaults
    if (!config.logging) {
      config.logging = {
        level: "info",
        redactSensitiveData: true,
      };
    }

    // Ensure fraud detection has defaults if enabled
    if (config.fraudDetection?.enabled && !config.fraudDetection.thresholds) {
      config.fraudDetection.thresholds = {
        highRisk: 0.8,
        mediumRisk: 0.5,
      };
    }

    return config;
  }

  /**
   * Register and initialize providers based on configuration
   */
  private async registerProviders(): Promise<void> {
    // Register card providers if configured
    if (this.config.apiKeys.stripeKey) {
      const { StripeCardAdapter } = await import("../providers/card/StripeCardAdapter.ts");
      this.providerRegistry.registerProvider(
        "card",
        new StripeCardAdapter({
          apiKey: this.config.apiKeys.stripeKey,
          environment: this.config.environment,
        }),
      );
    } else {
      const { GenericCardProvider } = await import("../providers/card/GenericCardProvider.ts");
      this.providerRegistry.registerProvider(
        "card",
        new GenericCardProvider({
          environment: this.config.environment,
        }),
      );
    }

    // Register ACH provider if configured
    if (this.config.apiKeys.plaidClientId && this.config.apiKeys.plaidSecret) {
      const { PlaidBankAdapter } = await import("../providers/bank/PlaidBankAdapter.ts");
      this.providerRegistry.registerProvider(
        "ach",
        new PlaidBankAdapter({
          clientId: this.config.apiKeys.plaidClientId,
          secret: this.config.apiKeys.plaidSecret,
          environment: this.config.environment,
        }),
      );
    }

    // Register SEPA provider if configured
    if (this.config.apiKeys.stripeKey) {
      const { SEPAProvider } = await import("../providers/bank/SEPAProvider.ts");
      this.providerRegistry.registerProvider(
        "sepa",
        new SEPAProvider({
          apiKey: this.config.apiKeys.stripeKey,
          environment: this.config.environment,
        }),
      );
    }
  }

  /**
   * Get the appropriate payment provider for a payment method type
   *
   * @param paymentMethodType The payment method type
   * @returns The payment provider or undefined if not found
   */
  private getProviderForPaymentMethod(
    paymentMethodType: PaymentMethodType,
  ): PaymentProvider | undefined {
    const provider = this.providerRegistry.getProvider(paymentMethodType);

    if (!provider) {
      return undefined;
    }

    return provider as PaymentProvider;
  }

  /**
   * Ensure the payment processor has been initialized
   *
   * @throws PaymentError if the processor has not been initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new PaymentError(
        "Payment processor has not been initialized. Call initialize() first.",
      );
    }
  }
}
