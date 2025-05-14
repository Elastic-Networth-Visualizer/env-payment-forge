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

export * from "./src/core/index.ts";
export * from "./src/providers/index.ts";
export * from './src/utils/index.ts';
export * from "./src/fraud/index.ts";
export * from "./src/errors/index.ts";
export * from "./src/types/index.ts";
export * from "./src/crypto/index.ts";;

import { PaymentProcessor } from './src/core/payment_processor.ts';
import { PaymentConfiguration } from './src/types/common.ts';

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

