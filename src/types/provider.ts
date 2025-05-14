import {
    PaymentRequest,
    RefundRequest,
    RiskAssessment,
    CreatePaymentMethodRequest
} from './payment.ts';

import {
    Transaction,
    TransactionRefund
} from './transaction.ts';

import { PaymentMethodType, Result } from "./common.ts";

/**
 * Base provider interface for payment processors.
 */
export interface Provider {
    /** Unique identifier for the provider */
    readonly id: string;
    /** Display name of the provider */
    readonly displayName: string;
    /** Payment method types supported by this provider */
    readonly supportedPaymentMethods: PaymentMethodType[];
    /** Features supported by this provider */
    readonly features: ProviderFeatures;
    /** Whether the provider is properly configured and ready to use */
    readonly isConfigured: boolean;
    /** Initialize the provider with configuration */
    initialize(config: unknown): Promise<void>;
}

/**
 * Provider features
 */
export interface ProviderFeatures {
    /** Whether the provider supports payment processing */
    processPayments: boolean;
    /** Whether the provider supports recurring billing */
    recurringBilling: boolean;
    /** Whether the provider supports refunds */
    refunds: boolean;
    /** Whether the provider supports partial refunds */
    partialRefunds: boolean;
    /** Whether the provider supports payment cancelation */
    cancelPayments: boolean;
    /** Whether the provider supports payment capturing */
    capturePayments: boolean;
    /** Whether the provider supports payment method tokenization */
    tokenization: boolean;
    /** Whether the provider supports payouts */
    payouts: boolean;
    /** Whether the provider support 3D Secure */
    threeDSecure: boolean;
    /** Whether the provider supports address verification */
    addressVerification: boolean;
}

/**
 * Payment provider interface for processing payments.
 */
export interface PaymentProvider extends Provider {
    /** Process a payment */
    processPayment(request: PaymentRequest): Promise<Result<Transaction>>;
    /** Authorize a payment without capturing */
    authorizePayment(request: PaymentRequest): Promise<Result<Transaction>>;
    /** Capture a previously authorized payment */
    capturePayment(transactionId: string, amount?: number): Promise<Result<Transaction>>;
    /** Cancel a payment */
    cancelPayment(transactionId: string): Promise<Result<Transaction>>;
    /** Process a refund */
    refundPayment(request: RefundRequest): Promise<Result<TransactionRefund>>;
    /** Assess risk for a payment request */
    assessRisk?(request: PaymentRequest): Promise<Result<RiskAssessment>>;
}

/**
 * Payment provider interface for managing payment methods.
 */
export interface PaymentMethodProvider extends Provider {
    /** Create a new payment method */
    createPaymentMethod(request: CreatePaymentMethodRequest): Promise<Result<string>>;
    /** Update an existing payment method */
    updatePaymentMethod(paymentMethodId: string, updates: Record<string, unknown>): Promise<Result<boolean>>;
    /** Delete a payment method */
    deletePaymentMethod(paymentMethodId: string): Promise<Result<boolean>>;
    /** Validate a payment method */
    validatePaymentMethod(paymentMethodId: string): Promise<Result<boolean>>;
    /** Tokenize payment method data */
    tokenize(paymentData: Record<string, unknown>): Promise<Result<string>>;
    /** Detokenize payment method data */
    detokenize(token: string): Promise<Result<Record<string, unknown>>>;
}

/**
 * Recurring billing provider interface.
 */
export interface RecurringBillingProvider extends Provider {
    /** Create a new recurring billing profile */
    createProfile(request: Record<string, unknown>): Promise<Result<string>>;
    /** Update an existing recurring billing profile */
    updateProfile(profileId: string, updates: Record<string, unknown>): Promise<Result<boolean>>;
    /** Cancel a recurring billing profile */
    cancelProfile(profileId: string): Promise<Result<boolean>>;
    /** Pause a recurring billing profile */
    pauseProfile(profileId: string): Promise<Result<boolean>>;
    /** Resume a paused recurring billing profile */
    resumeProfile(profileId: string): Promise<Result<boolean>>;
}

/**
 * Provider factory function type.
 */
export type ProviderFactory<T extends Provider> = (config: unknown) => T;

/**
 * Provider initialization options.
 */
export interface ProviderOptions {
    /** API key for the provider */
    apiKey?: string;
    /** Secret key for the provider */
    secretKey?: string;
    /** Client ID for the provider */
    clientId?: string;
    /** Environment for the provider */
    environment?: "sandbox" | "production";
    /** Webhook URL for the provider */
    webhookUrl?: string;
    /** Webhook secret for the provider */
    webhookSecret?: string;
    /** Additional provider-specific options */
    [key: string]: unknown;
}
