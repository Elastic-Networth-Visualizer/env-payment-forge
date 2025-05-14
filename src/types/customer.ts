import { Address, ISODateTime, MetadataMap } from "./common.ts";

/**
 * Customer information
 */
export interface Customer {
  /** Unique identifier for the customer */
  id: string;
  /** When the customer was created */
  createdAt: ISODateTime;
  /** When the customer was last updated */
  updatedAt: ISODateTime;
  /** Customer email */
  email: string;
  /** Customer full name */
  name?: string;
  /** Customer phone number (E.164 format) */
  phone?: string;
  /** Description of the customer */
  description?: string;
  /** Default payment method ID */
  defaultPaymentMethodId?: string;
  /** Associated payment method IDs */
  paymentMethodIds: string[];
  /** Default billing address */
  billingAddress?: Address;
  /** Default shipping address */
  shippingAddress?: Address;
  /** Tax ID number */
  taxId?: {
    /** Type of tax ID */
    type:
      | "eu_vat"
      | "br_cnpj"
      | "br_cpf"
      | "ca_bn"
      | "ca_qst"
      | "ch_vat"
      | "cl_tin"
      | "es_cif"
      | "eu_oss_vat"
      | "gb_vat"
      | "hk_br"
      | "id_npwp"
      | "il_vat"
      | "in_gst"
      | "jp_cn"
      | "jp_rn"
      | "kr_brn"
      | "li_uid"
      | "mx_rfc"
      | "my_frp"
      | "my_itn"
      | "my_sst"
      | "no_vat"
      | "nz_gst"
      | "ru_inn"
      | "ru_kpp"
      | "sa_vat"
      | "sg_gst"
      | "sg_uen"
      | "th_vat"
      | "tw_vat"
      | "ua_vat"
      | "us_ein"
      | "za_vat"
      | "unknown";
    /** Tax ID value */
    value: string;
  };
  /** Optional metadata attached to the customer */
  metadata?: MetadataMap;
  /** Whether the customer has been verified */
  isVerified: boolean;
  /** Status of the customer account */
  status: "active" | "inactive" | "blocked";
  /** Customer's preferred currency */
  preferredCurrency?: string;
  /** Customer's preferred locale */
  preferredLocale?: string;
  /** Notes about the customer (internal use) */
  notes?: string;
}

/**
 * Customer creation request
 */
export interface CreateCustomerRequest {
  /** Customer email */
  email: string;
  /** Customer full name */
  name?: string;
  /** Customer phone number (E.164 format) */
  phone?: string;
  /** Description of the customer */
  description?: string;
  /** Default billing address */
  billingAddress?: Address;
  /** Default shipping address */
  shippingAddress?: Address;
  /** Tax ID information */
  taxId?: {
    /** Type of tax ID */
    type: string;
    /** Tax ID value */
    value: string;
  };
  /** Optional metadata to attach to the customer */
  metadata?: MetadataMap;
  /** Customer's preferred currency */
  preferredCurrency?: string;
  /** Customer's preferred locale */
  preferredLocale?: string;
  /** Notes about the customer (internal use) */
  notes?: string;
}

/**
 * Customer update request
 */
export interface UpdateCustomerRequest {
  /** Customer email */
  email?: string;
  /** Customer full name */
  name?: string;
  /** Customer phone number (E.164 format) */
  phone?: string;
  /** Description of the customer */
  description?: string;
  /** Default payment method ID */
  defaultPaymentMethodId?: string;
  /** Default billing address */
  billingAddress?: Address;
  /** Default shipping address */
  shippingAddress?: Address;
  /** Tax ID information */
  taxId?: {
    /** Type of tax ID */
    type: string;
    /** Tax ID value */
    value: string;
  };
  /** Optional metadata to attach to the customer */
  metadata?: MetadataMap;
  /** Status of the customer account */
  status?: "active" | "inactive" | "blocked";
  /** Customer's preferred currency */
  preferredCurrency?: string;
  /** Customer's preferred locale */
  preferredLocale?: string;
  /** Notes about the customer (internal use) */
  notes?: string;
}

/**
 * Customer search filter options
 */
export interface CustomerSearchFilters {
  /** Email to search for (exact match or pattern) */
  email?: string;
  /** Name to search for (partial match) */
  name?: string;
  /** Phone to search for (exact match or pattern) */
  phone?: string;
  /** Creation date range start */
  createdAfter?: ISODateTime;
  /** Creation date range end */
  createdBefore?: ISODateTime;
  /** Status to filter by */
  status?: "active" | "inactive" | "blocked" | ("active" | "inactive" | "blocked")[];
  /** Whether to filter for verified customers only */
  isVerified?: boolean;
  /** Filter by metadata key-value pairs */
  metadata?: Record<string, string | number | boolean>;
  /** Filter by having payment method */
  hasPaymentMethod?: boolean;
  /** Filter by country code */
  country?: string | string[];
}
