/**
 * env-payment-forge
 * A robust payment processing library for Deno applications
 * 
 * This library provides a comprehensive solution for handling payment processing,
 * including direct bank integration via ACH/SEPA, card tokenization and processing,
 * recurring payment handling, and fraud detection.
 *
 * @module env-payment-forge
 */

// Export core functionality
export * from "./src/core/PaymentProcessor.ts";
export * from "./src/core/TransactionManager.ts";
export * from "./src/core/RecurringBillingManager.ts";
export * from "./src/core/PaymentMethodManager.ts";
export * from "./src/core/RefundProcessor.ts";
export * from "./src/core/DisputeManager.ts";

// Export provider interfaces and implementations
export * from "./src/providers/Provider.ts";
export * from "./src/providers/card/CardProvider.ts";
export * from "./src/providers/bank/BankTransferProvider.ts";
export * from "./src/providers/wallet/DigitalWalletProvider.ts";

// Export specific provider implementations
export * from "./src/providers/bank/ACHProvider.ts";
export * from "./src/providers/bank/SEPAProvider.ts";
export * from "./src/providers/card/StripeCardAdapter.ts";
export * from "./src/providers/card/GenericCardProvider.ts";
export * from "./src/providers/bank/PlaidBankAdapter.ts";

// Export utility functions
export * from "./src/utils/validation.ts";
export * from "./src/utils/currency.ts";
export * from "./src/utils/encryption.ts";
export * from "./src/utils/logger.ts";
export * from "./src/utils/retry.ts";

// Export fraud detection tools
export * from "./src/fraud/FraudDetector.ts";
export * from "./src/fraud/RiskScorer.ts";
export * from "./src/fraud/RuleEngine.ts";

// Export error types
export * from "./src/errors/PaymentErrors.ts";

// Export shared types
export * from "./src/types/index.ts";

// Export crypto utilities
export * from "./src/crypto/tokenizer.ts";
export * from "./src/crypto/hasher.ts";

// Quick start factory method
import { PaymentProcessor } from "./src/core/PaymentProcessor.ts";
import { PaymentConfiguration } from "./src/types/common.ts";

/**
 * Creates and configures a new PaymentProcessor instance with the provided configuration.
 * This is the recommended entry point for most applications.
 * 
 * @param config The configuration for the payment processor
 * @returns A fully configured PaymentProcessor instance
 * 
 * @example
 * ```ts
 * import { createPaymentProcessor } from "env-payment-forge";
 * 
 * const processor = createPaymentProcessor({
 *   apiKeys: {
 *     plaidClientId: "your-plaid-client-id",
 *     plaidSecret: "your-plaid-secret",
 *   },
 *   environment: "sandbox",
 *   defaultCurrency: "USD",
 *   webhookUrl: "https://your-domain.com/payment-webhooks",
 *   fraudDetection: {
 *     enabled: true,
 *     thresholds: {
 *       highRisk: 0.8,
 *       mediumRisk: 0.5,
 *     }
 *   }
 * });
 * 
 * // The processor is now ready to use
 * const transaction = await processor.processPayment({
 *   amount: 1999,
 *   currency: "USD",
 *   paymentMethod: "card",
 *   paymentMethodId: "card_token_123456",
 *   customerId: "cust_987654",
 *   description: "Premium subscription - Annual plan"
 * });
 * ```
 */
export function createPaymentProcessor(config: PaymentConfiguration): PaymentProcessor {
  return new PaymentProcessor(config);
}

// Default configuration factory
export { getDefaultConfiguration } from "./src/utils/config.ts";
