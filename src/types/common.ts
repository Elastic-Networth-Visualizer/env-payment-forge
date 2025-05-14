/**
 * Supported payment processing environments.
 */
export type Environment = "development" | "sandbox" | "production";

/**
 * Three-letter ISO currency codes.
 */
export type CurrencyCode =
    | "USD" | "EUR" | "GBP" | "CAD" | "AUD"
    | "JPY" | "CNY" | "INR" | "BRL" | "MXN"
    | "CHF" | "SEK" | "NZD" | "SGD" | "HKD"
    | "NOK" | "DKK" | "PLN" | "ZAR" | "AED"
    | string; // Allow other currencies as well

/**
 * Supported payment method types.
 */
export type PaymentMethodType = "card" | "bank_account" | "ach" | "sepa" | "digital_wallet" | "crypto";

/**
 * Status of a payment transaction.
 */
export type TransactionStatus =
    | "initialized"     // Payment has been initialized but not processed
    | "pending"         // Payment is being processed
    | "authorized"      // Payment has been authorized but not captured
    | "captured"        // Payment has been captured/settled
    | "failed"          // Payment has failed
    | "declined"        // Payment was declined
    | "refunded"        // Payment has been refunded
    | "partially_refunded" // Payment has been partially refunded
    | "disputed"        // Payment is under dispute
    | "canceled"        // Payment was canceled before processing
    | "expired";        // Payment authorization has expired

/**
 * Risk levels for fraud detection.
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * Date in ISO 8601 format (YYYY-MM-DD).
 */
export type ISODate = string;

/**
 * Datetime in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ).
 */
export type ISODateTime = string;

/**
 * Result of a payment operation.
 */
export interface Result<T> {
    success: boolean;
    data?: T;
    error?: Error;
    errorCode?: string;
    errorMessage?: string;
}

/**
 * Pagination options for list operations.
 */
export interface PaginationOptions {
    page?: number;
    pageSize?: number;
    startDate?: ISODate;
    endDate?: ISODate;
    startingAfter?: string;
    endingBefore?: string;
}

/**
 * Common metadata type that can be attached to various objects.
 */
export type MetadataMap = Record<string, string | number | boolean | null>;

/**
 * Webhook event types.
 */
export type WebhookEventType =
    | "payment.created"
    | "payment.succeeded"
    | "payment.failed" 
    | "payment.refunded"
    | "payment.disputed"
    | "customer.created"
    | "customer.updated"
    | "payment_method.created"
    | "payment_method.updated"
    | "payment_method.removed";

/**
 * Configuration for the payment processor.
 */
export interface PaymentConfiguration {
    /** Environment to run in */
    environment: Environment;
    /** Default currency to use for payments */
    defaultCurrency: CurrencyCode;
    /** URL for receiving webhooks */
    webhookUrl?: string;
    /** Webhook secret for validating incoming webhooks */
    webhookSecret?: string;
    /** API keys for various providers */
    apiKeys: {
        /** Plaid client ID for ACH payment */
        plaidClientId?: string;
        /** Plaid secret key */
        plaidSecret?: string;
        /** Stripe API key */
        stripeKey?: string;
        /** Other provider keys */
        [key: string]: string | undefined;
    };
    /** Fraud detection settings */
    fraudDetection?: {
        /** Whether fraud detection is enabled */
        enabled: boolean;
        /** Risk score thresholds */
        thresholds?: {
            /** Transactions with risk score above this are considered high risk */
            highRisk: number;
            /** Transactions with risk score above this are considered medium risk */
            mediumRisk: number;
        };
        /** List of countries considered high risk */
        highRiskCountries?: string[];
        /** Maximum transaction amount before requiring additional verification */
        maxAmountWithoutVerification?: number;
    };
    /** Customizations for payment flows */
    customization?: {
        /** Whether to require CVV for card payments */
        requireCvv?: boolean;
        /** Whether to require address verification for card payments */
        requireAddressVerification?: boolean;
        /** Whether to require 3D Secure for card payments */
        require3DS?: boolean;
    };
    /** Logger configuration */
    logging?: {
        /** Log level */
        level: "debug" | "info" | "warn" | "error";
        /** Whether to redact sensitive information in logs */
        redactSensitiveData: boolean;
    }
}

/**
 * Address for billing or shipping.
 */
export interface Address {
    /** First line of address */
    line1: string;
    /** Second line of address (optional) */
    line2?: string;
    /** City */
    city: string;
    /** State or province */
    state?: string;
    /** Postal or ZIP code */
    postalCode: string;
    /** Country code (ISO 3166-1 alpha-2) */
    country: string;
}
