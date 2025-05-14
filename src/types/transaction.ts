import { 
    CurrencyCode,
    ISODateTime,
    MetadataMap,
    TransactionStatus,
    PaymentMethodType,
    RiskLevel
} from "./common.ts";
  
import { RiskAssessment } from "./payment.ts";

/**
 * Base transaction interface
 */
export interface Transaction {
    /** Unique identifier for the transaction */
    id: string;
    /** When the transaction was created */
    createdAt: ISODateTime;
    /** When the transaction was last updated */
    updatedAt: ISODateTime;
    /** Current status of the transaction */
    status: TransactionStatus;
    /** Amount in smallest currency unit (cents, etc.) */
    amount: number;
    /** Original requested amount before any adjustments */
    originalAmount: number;
    /** Currency code (ISO 4217) */
    currency: CurrencyCode;
    /** ID of the payment method used */
    paymentMethodId: string;
    /** Type of payment method used */
    paymentMethodType: PaymentMethodType;
    /** ID of the customer making the payment */
    customerId: string;
    /** Description of the transaction */
    description?: string;
    /** Whether this transaction was only authorized and not captured */
    isAuthorizedOnly: boolean;
    /** Unique idempotency key to prevent duplicate transactions */
    idempotencyKey?: string;
    /** Statement descriptor that will appear on the customer's statement */
    statementDescriptor?: string;
    /** Optional metadata attached to the transaction */
    metadata?: MetadataMap;
    /** Receipt email address */
    receiptEmail?: string;
    /** Risk assessment results */
    riskAssessment?: RiskAssessment;
    /** Overall risk level for this transaction */
    riskLevel?: RiskLevel;
    /** Error code if the transaction failed */
    errorCode?: string;
    /** Error message if the transaction failed */
    errorMessage?: string;
    /** Provider-specific reference IDs */
    providerReferences: {
        /** ID used by the payment provider */
        providerId?: string;
        /** Authorization code */
        authorizationCode?: string;
        /** Reference number */
        referenceNumber?: string;
        /** Other provider-specific references */
        [key: string]: string | undefined;
    };
    /** Timeline of status changes and events for this transaction */
    timeline: TransactionEvent[];
    /** Fee amount in smallest currency unit */
    feeAmount?: number;
    /** Net amount (amount - fees) in smallest currency unit */
    netAmount?: number;
    /** Associated refunds, if any */
    refunds?: TransactionRefund[];
    /** ID of recurring billing profile, if this was a recurring payment */
    recurringBillingId?: string;
}

/**
 * Event in a transaction's lifecycle
 */
export interface TransactionEvent {
    /** Type of event */
    type: string;
    /** When the event occurred */
    timestamp: ISODateTime;
    /** Status after this event */
    status: TransactionStatus;
    /** Additional information about the event */
    data?: Record<string, unknown>;
}

/**
 * Inforrmation about a refund
 */
export interface TransactionRefund {
    /** Unique identifier for the refund */
    id: string;
    /** When the refund was created */
    createdAt: ISODateTime;
    /** When the refund was last updated */
    updatedAt: ISODateTime;
    /** Current status of the refund */
    status: "pending" | "succeeded" | "failed";
    /** Amount refunded in smallest currency unit */
    amount: number;
    /** Reason for the refund */
    reason?: "requested_by_customer" | "fraudulent" | "duplicate" | "other";
    /** Further explanation if reason is "other" */
    description?: string;
    /** Provider-specific reference for the refund */
    providerRefundId?: string;
    /** Metadata attached to the refund */
    metadata?: MetadataMap;
}

/**
 * Information about a dispute/chargeback
 */
export interface TransactionDispute {
    /** Unique identifier for the dispute */
    id: string;
    /** When the dispute was created */
    createdAt: ISODateTime;
    /** When the dispute was last updated */
    updatedAt: ISODateTime;
    /** Current status of the dispute */
    status: "needs_response" | "under_review" | "won" | "lost" | "withdrawn";
    /** Reason for the dispute */
    reason: 
      | "general" 
      | "fraudulent" 
      | "duplicate" 
      | "subscription_canceled" 
      | "product_not_received" 
      | "product_unacceptable" 
      | "unrecognized" 
      | "credit_not_processed" 
      | "incorrect_account_details" 
      | "insufficient_funds" 
      | "bank_cannot_process" 
      | "check_returned" 
      | "customer_initiated";
    /** Amount disputed in smallest currency unit */
    amount: number;
    /** Currency code */
    currency: CurrencyCode;
    /** Due date for evidence submission */
    evidenceDueBy?: ISODateTime;
    /** When the dispute was resolved */
    resolvedAt?: ISODateTime;
    /** Provider-specific reference for the dispute */
    providerDisputeId?: string;
    /** Optional metadata attached to the dispute */
    metadata?: MetadataMap;
    /** Evidence submitted for the dispute */
    evidence?: {
      /** Product description */
      productDescription?: string;
      /** Customer name */
      customerName?: string;
      /** Customer email */
      customerEmail?: string;
      /** Customer signature */
      customerSignature?: string;
      /** Billing address */
      billingAddress?: string;
      /** Receipt */
      receipt?: string;
      /** Customer service communication */
      customerCommunication?: string;
      /** Service date */
      serviceDate?: string;
      /** Shipping documentation */
      shippingDocumentation?: string;
      /** Shipping address */
      shippingAddress?: string;
      /** Shipping carrier */
      shippingCarrier?: string;
      /** Shipping tracking number */
      shippingTrackingNumber?: string;
      /** Shipping date */
      shippingDate?: string;
      /** Delivery date */
      deliveryDate?: string;
      /** Refund policy */
      refundPolicy?: string;
      /** Refund policy disclosure */
      refundPolicyDisclosure?: string;
      /** Cancellation policy */
      cancellationPolicy?: string;
      /** Cancellation policy disclosure */
      cancellationPolicyDisclosure?: string;
      /** Access activity logs */
      accessActivityLogs?: string;
      /** Subscription cancellation date */
      subscriptionCancellationDate?: string;
      /** Customer service contact */
      customerServiceContact?: string;
      /** Additional evidence */
      additionalEvidence?: string;
    };
}

/**
 * Information about recurring billing profile
 */
export interface RecurringBillingProfile {
    /** Unique identifier for the recurring billing profile */
    id: string;
    /** When the profile was created */
    createdAt: ISODateTime;
    /** When the profile was last updated */
    updatedAt: ISODateTime;
    /** Status of the recurring billing profile */
    status: "active" | "canceled" | "completed" | "past_due" | "pending" | "suspended";
    /** Name of the recurring billing profile */
    name: string;
    /** Description of what the recurring payments are for */
    description?: string;
    /** ID of the customer */
    customerId: string;
    /** ID of the payment method to use */
    paymentMethodId: string;
    /** Amount to charge in smallest currency unit (cents, etc.) */
    amount: number;
    /** Currency code */
    currency: CurrencyCode;
    /** Billing interval */
    interval: "day" | "week" | "month" | "year";
    /** Number of interval units between billings */
    intervalCount: number;
    /** Dates when billing should occur */
    billingDates: {
      /** Date of the first billing */
      startDate: ISODateTime;
      /** Date of the trial end, if applicable */
      trialEndDate?: ISODateTime;
      /** Date of the next scheduled billing */
      nextBillingDate?: ISODateTime;
      /** Date when the billing will end automatically */
      endDate?: ISODateTime;
    };
    /** Maximum number of payments to collect */
    maxPayments?: number;
    /** Number of payments collected so far */
    paymentsMade: number;
    /** Amount to charge during trial period */
    trialAmount?: number;
    /** Total amount collected so far */
    totalAmountCollected: number;
    /** IDs of transactions associated with this profile */
    transactionIds: string[];
    /** Provider-specific reference */
    providerSubscriptionId?: string;
    /** Optional metadata attached to the recurring billing profile */
    metadata?: MetadataMap;
}

/**
 * Transaction search filter options
 */
export interface TransactionSearchFilters {
    /** Status to filter by */
    status?: TransactionStatus | TransactionStatus[];
    /** Customer ID to filter by */
    customerId?: string;
    /** Payment method ID to filter by */
    paymentMethodId?: string;
    /** Payment method type to filter by */
    paymentMethodType?: PaymentMethodType | PaymentMethodType[];
    /** Minimum amount */
    minAmount?: number;
    /** Maximum amount */
    maxAmount?: number;
    /** Currency to filter by */
    currency?: CurrencyCode;
    /** Date range start */
    startDate?: ISODateTime;
    /** Date range end */
    endDate?: ISODateTime;
    /** Risk level to filter by */
    riskLevel?: RiskLevel | RiskLevel[];
    /** Text to search for in description or metadata */
    searchText?: string;
    /** Whether to include refunded transactions */
    includeRefunded?: boolean;
    /** Whether to include disputed transactions */
    includeDisputed?: boolean;
    /** Filter by recurring billing profile ID */
    recurringBillingId?: string;
    /** Filter by specific metadata key-value pairs */
    metadata?: Record<string, string | number | boolean>;
}
