import {
    Address,
    CurrencyCode,
    MetadataMap,
    PaymentMethodType,
    RiskLevel,
    ISODateTime
} from './common.ts';

/**
 * Payment method interface that all payment methods implement.
 */
export interface PaymentMethod {
    /** Unique identifier for this payment method */
    id: string;
    /** Type of payment method */
    type: PaymentMethodType;
    /** When the payment method was created */
    createdAt: ISODateTime;
    /** When the payment method was last updated */
    updatedAt: ISODateTime;
    /** ID of the customer this payment method belongs to */
    customerId: string;
    /** Whether this is the default payment method for the customer */
    isDefault: boolean;
    /** Whether the payment method has been validated */
    isValidated: boolean;
    /** Billing address associated with this payment method */
    billingAddress?: Address;
    /** Metadata associated with this payment method */
    metadata?: MetadataMap;
}

/**
 * Payment method details for card payments.
 */
export interface CardPaymentMethod extends PaymentMethod {
    type: "card";
    /** Card network (Visa, Mastercard, etc.) */
    network: "visa" | "mastercard" | "amex" | "discover" | "jcb" | "diners" | "unionpay" | string;
    /** Last 4 digits of the card number */
    last4: string;
    /** Two-digit expiration month */
    expiryMonth: number;
    /** Four-digit expiration year */
    expiryYear: number;
    /** Cardholder name */
    cardholderName?: string;
    /** Card funding type */
    funding?: "credit" | "debit" | "prepaid" | "unknown";
    /** Whether this card supports 3D Secure */
    supports3DS?: boolean;
    /** Whether address verification passed */
    addressVerificationResult?: "passed" | "failed" | "not_checked";
    /** Whether CVV verification passed */
    cvvVerificationResult?: "passed" | "failed" | "not_checked";
    /** Tokenized card data for secure storage */
    token: string;
}

/**
 * Payment method details for bank account payments.
 */
export interface BankAccountPaymentMethod extends PaymentMethod {
    type: "bank_account" | "ach" | "sepa";
    /** Bank name */
    bankName: string;
    /** Account type */
    accountType?: "checking" | "savings" | "business" | "personal";
    /** Last 4 digits of account number */
    last4: string;
    /** Routing number (for US accounts) */
    routingNumber?: string;
    /** IBAN (for European accounts) */
    iban?: string;
    /** BIC/SWIFT code (for international transfers) */
    bic?: string;
    /** Account holder name */
    accountHolderName: string;
    /** Account holder type */
    accountHolderType?: "individual" | "company";
    /** Currency of the account */
    currency: CurrencyCode;
    /** Whether this account has been verified with micro-deposits */
    isMicroDepositVerified?: boolean;
    /** Tokenized account data for secure storage */
    token: string;
}

/**
 * Payment method details for digital wallet payments.
 */
export interface DigitalWalletPaymentMethod extends PaymentMethod {
    type: "digital_wallet";
    /** Digital wallet provider */
    provider: "apple_pay" | "google_pay" | "paypal" | "venmo" | string;
    /** Email associated with the wallet */
    email?: string;
    /** Display name for the wallet */
    displayName?: string;
    /** Tokenized wallet data for secure storage */
    token: string;
}

/**
 * Union type of all payment method types.
 */
export type AnyPaymentMethod =
    | CardPaymentMethod
    | BankAccountPaymentMethod
    | DigitalWalletPaymentMethod;

/**
 * Payment request payload.
 */
export interface PaymentRequest {
    /** Amount in smallest currency unit (cents, etc.) */
    amount: number;
    /** Currency code */
    currency: CurrencyCode;
    /** ID of the payment method to use */
    paymentMethodId: string;
    /** ID of the customer making the payment */
    customerId: string;
    /** Description of the payment */
    description?: string;
    /** Whether to only authorize and not capture the payment */
    authorizeOnly?: boolean;
    /** Unique idempotency key to prevent duplicate payments */
    idempotencyKey?: string;
    /** Whether to save the payment method for future use */
    savePaymentMethod?: boolean;
    /** Statement descriptor that will appear on the customer's statement */
    statementDescriptor?: string;
    /** Optional metadata to attach to the payment */
    metadata?: MetadataMap;
    /** Optional shipping address for the order */
    shippingAddress?: Address;
    /** Receipt email address */
    receiptEmail?: string;
    /** Return URL for redirect-based flows */
    returnUrl?: string;
    /** Webhook URL for this specific payment */
    webhookUrl?: string;
}

/**
 * Refund request payload.
 */
export interface RefundRequest {
    /** ID of the transaction to refund */
    transactionId: string;
    /** Amount to refund, if not specified, full amount is refunded */
    amount?: number;
    /** Reason for the refund */
    reason?: "requested_by_customer" | "fraudulent" | "duplicate" | "other";
    /** Further explanation if reason is "other" */
    description?: string;
    /** Unique idempotency key to prevent duplicate refunds */
    idempotencyKey?: string;
    /** Metadata to attach to the refund */
    metadata?: MetadataMap;
}

/**
 * Payment method creation request
 */
export interface CreatePaymentMethodRequest {
    /** Type of payment method */
    type: PaymentMethodType;
    /** ID of the customer this payment method belongs to */
    customerId: string;
    /** Whether this should be the default payment method */
    setAsDefault?: boolean;
    /** Billing address for the payment method */
    billingAddress?: Address;
    /** Optional metadata to attach to the payment method */
    metadata?: MetadataMap;
    
    // Card-specific fields
    /** Card number (will be tokenized and not stored directly) */
    cardNumber?: string;
    /** Expiry month (1-12) */
    expiryMonth?: string;
    /** Expiry year (4-digit) */
    expiryYear?: string;
    /** Card verification value */
    cvv?: string;
    /** Cardholder name */
    cardholderName?: string;
    
    // Bank account specific fields
    /** Account number (will be tokenized and not stored directly) */
    accountNumber?: string;
    /** Routing number for ACH */
    routingNumber?: string;
    /** IBAN for SEPA */
    iban?: string;
    /** BIC/SWIFT code */
    bic?: string;
    /** Account holder name */
    accountHolderName?: string;
    /** Account type */
    accountType?: "checking" | "savings" | "business" | "personal";
    /** Account holder type */
    accountHolderType?: "individual" | "company";
    
    // Token-based fields (when already tokenized by frontend)
    /** Pre-tokenized payment details */
    token?: string;
    /** Token provider (if using a third-party tokenization service) */
    tokenProvider?: string;
}

/**
 * Risk assessment result
 */
export interface RiskAssessment {
    /** Overall risk score from 0 (low) to 1 (high) */
    score: number;
    /** Risk level based on the score */
    level: RiskLevel;
    /** Factors that contributed to the risk assessment */
    factors: {
      /** Factor name */
      name: string;
      /** Factor description */
      description: string;
      /** Factor score impact */
      impact: number;
    }[];
    /** Recommendations based on the risk assessment */
    recommendations: {
      /** Recommendation type */
      type: "block" | "review" | "additional_verification" | "allow";
      /** Recommendation description */
      description: string;
    }[];
    /** Triggered rules */
    triggeredRules: string[];
}
