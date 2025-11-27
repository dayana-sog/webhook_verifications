import { faker } from "@faker-js/faker"
import { db } from "./index"
import { webhooks } from "./schema"

type StripeEventType =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.canceled"
  | "charge.succeeded"
  | "charge.refunded"
  | "charge.failed"
  | "charge.dispute.created"
  | "charge.dispute.closed"
  | "customer.created"
  | "customer.deleted"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.created"
  | "invoice.finalized"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed"
  | "invoice.upcoming"
  | "invoice.voided"
  | "payout.paid"
  | "payout.failed"
  | "refund.created"
  | "refund.updated"
  | "product.created"
  | "price.created"
  | "checkout.session.completed"
  | "checkout.session.expired"
  | "payment_method.attached"
  | "transfer.created"
  | "balance.available"
  | "account.updated"

const EVENT_TYPES: StripeEventType[] = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "charge.succeeded",
  "charge.refunded",
  "charge.failed",
  "charge.dispute.created",
  "charge.dispute.closed",
  "customer.created",
  "customer.deleted",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.created",
  "invoice.finalized",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "invoice.upcoming",
  "invoice.voided",
  "payout.paid",
  "payout.failed",
  "refund.created",
  "refund.updated",
  "product.created",
  "price.created",
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_method.attached",
  "transfer.created",
  "balance.available",
  "account.updated",
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function cents(min: number, max: number) {
  return faker.number.int({ min, max })
}

function stripeId(prefix: string): string {
  return `${prefix}_${faker.string.alphanumeric({ length: 24, casing: "lower" })}`
}

function buildStripeEvent(type: StripeEventType) {
  const currency = pick(["usd", "eur", "gbp", "brl"])
  const amount = cents(500, 125_000)
  const customerId = stripeId("cus")
  const paymentIntentId = stripeId("pi")
  const chargeId = stripeId("ch")
  const invoiceId = stripeId("in")
  const subscriptionId = stripeId("sub")

  const now = Math.floor(Date.now() / 1000)

  const base = {
    id: stripeId("evt"),
    object: "event",
    api_version: "2024-09-30",
    created: now,
    livemode: faker.datatype.boolean(),
    pending_webhooks: faker.number.int({ min: 0, max: 2 }),
    request: { id: stripeId("req"), idempotency_key: faker.string.uuid() },
    type,
  }

  const objectByType: Record<StripeEventType, any> = {
    "payment_intent.succeeded": {
      id: paymentIntentId,
      object: "payment_intent",
      amount,
      currency,
      customer: customerId,
      status: "succeeded",
      charges: { data: [{ id: chargeId, amount, currency, paid: true, status: "succeeded" }] },
    },
    "payment_intent.payment_failed": {
      id: paymentIntentId,
      object: "payment_intent",
      amount,
      currency,
      customer: customerId,
      status: "requires_payment_method",
      last_payment_error: { code: "card_declined", doc_url: "https://stripe.com/docs/error-codes" },
    },
    "payment_intent.canceled": {
      id: paymentIntentId,
      object: "payment_intent",
      amount,
      currency,
      customer: customerId,
      status: "canceled",
      cancellation_reason: pick(["abandoned", "requested_by_customer", "duplicate"]),
    },
    "charge.succeeded": {
      id: chargeId,
      object: "charge",
      amount,
      currency,
      paid: true,
      status: "succeeded",
      customer: customerId,
      payment_intent: paymentIntentId,
    },
    "charge.refunded": {
      id: chargeId,
      object: "charge",
      amount,
      currency,
      refunded: true,
      amount_refunded: faker.number.int({ min: Math.floor(amount / 2), max: amount }),
      customer: customerId,
      payment_intent: paymentIntentId,
    },
    "charge.failed": {
      id: chargeId,
      object: "charge",
      amount,
      currency,
      paid: false,
      status: "failed",
      failure_code: "card_declined",
      customer: customerId,
      payment_intent: paymentIntentId,
    },
    "charge.dispute.created": {
      id: stripeId("dp"),
      object: "dispute",
      amount,
      currency,
      charge: chargeId,
      reason: pick(["fraudulent", "duplicate", "product_not_received"]),
      status: "warning_needs_response",
    },
    "charge.dispute.closed": {
      id: stripeId("dp"),
      object: "dispute",
      amount,
      currency,
      charge: chargeId,
      reason: "fraudulent",
      status: pick(["won", "lost"]),
    },
    "customer.created": {
      id: customerId,
      object: "customer",
      email: faker.internet.email(),
      name: faker.person.fullName(),
    },
    "customer.deleted": {
      id: customerId,
      object: "customer",
      deleted: true,
    },
    "customer.subscription.created": {
      id: subscriptionId,
      object: "subscription",
      customer: customerId,
      status: "active",
      items: { data: [{ id: stripeId("si"), price: { id: stripeId("price"), unit_amount: amount, currency } }] },
    },
    "customer.subscription.updated": {
      id: subscriptionId,
      object: "subscription",
      customer: customerId,
      status: pick(["active", "past_due", "unpaid"]),
      items: { data: [{ id: stripeId("si"), price: { id: stripeId("price"), unit_amount: amount, currency } }] },
    },
    "customer.subscription.deleted": {
      id: subscriptionId,
      object: "subscription",
      customer: customerId,
      status: "canceled",
      cancel_at_period_end: faker.datatype.boolean(),
    },
    "invoice.created": {
      id: invoiceId,
      object: "invoice",
      customer: customerId,
      amount_due: amount,
      currency,
      status: "draft",
    },
    "invoice.finalized": {
      id: invoiceId,
      object: "invoice",
      customer: customerId,
      amount_due: amount,
      currency,
      status: "open",
      finalized_at: now,
    },
    "invoice.payment_succeeded": {
      id: invoiceId,
      object: "invoice",
      customer: customerId,
      amount_due: amount,
      amount_paid: amount,
      currency,
      status: "paid",
      payment_intent: paymentIntentId,
      charge: chargeId,
    },
    "invoice.payment_failed": {
      id: invoiceId,
      object: "invoice",
      customer: customerId,
      amount_due: amount,
      amount_paid: 0,
      currency,
      status: "open",
      payment_intent: paymentIntentId,
      charge: chargeId,
    },
    "invoice.upcoming": {
      id: invoiceId,
      object: "invoice",
      customer: customerId,
      amount_due: amount,
      currency,
      status: "draft",
      next_payment_attempt: now + 3600 * 24,
    },
    "invoice.voided": {
      id: invoiceId,
      object: "invoice",
      customer: customerId,
      amount_due: amount,
      currency,
      status: "void",
    },
    "payout.paid": {
      id: stripeId("po"),
      object: "payout",
      amount,
      currency,
      status: "paid",
    },
    "payout.failed": {
      id: stripeId("po"),
      object: "payout",
      amount,
      currency,
      status: "failed",
      failure_code: "insufficient_funds",
    },
    "refund.created": {
      id: stripeId("re"),
      object: "refund",
      amount: faker.number.int({ min: Math.floor(amount / 3), max: amount }),
      currency,
      charge: chargeId,
      status: "succeeded",
    },
    "refund.updated": {
      id: stripeId("re"),
      object: "refund",
      amount: faker.number.int({ min: Math.floor(amount / 3), max: amount }),
      currency,
      charge: chargeId,
      status: pick(["succeeded", "failed", "canceled"]),
    },
    "product.created": {
      id: stripeId("prod"),
      object: "product",
      name: faker.commerce.productName(),
      active: true,
    },
    "price.created": {
      id: stripeId("price"),
      object: "price",
      unit_amount: amount,
      currency,
      recurring: { interval: pick(["month", "year"]) },
      product: stripeId("prod"),
    },
    "checkout.session.completed": {
      id: stripeId("cs"),
      object: "checkout.session",
      mode: pick(["payment", "subscription"]),
      amount_total: amount,
      currency,
      payment_intent: paymentIntentId,
    },
    "checkout.session.expired": {
      id: stripeId("cs"),
      object: "checkout.session",
      mode: pick(["payment", "subscription"]),
      amount_total: amount,
      currency,
      expired: true,
    },
    "payment_method.attached": {
      id: stripeId("pm"),
      object: "payment_method",
      customer: customerId,
      type: pick(["card", "boleto", "pix", "bank_transfer"]),
      card: { brand: pick(["visa", "mastercard", "amex"]), last4: faker.string.numeric(4) },
    },
    "transfer.created": {
      id: stripeId("tr"),
      object: "transfer",
      amount,
      currency,
      destination: stripeId("acct"),
    },
    "balance.available": {
      object: "balance",
      available: [{ currency, amount }],
      pending: [{ currency, amount: cents(0, 50_000) }],
    },
    "account.updated": {
      id: stripeId("acct"),
      object: "account",
      business_profile: { name: faker.company.name() },
      charges_enabled: faker.datatype.boolean(),
    },
  }

  return {
    ...base,
    data: { object: objectByType[type] },
  }
}

function buildHeaders(body: string) {
  const signature = `t=${Math.floor(Date.now() / 1000)},v1=${faker.string.hexadecimal({ length: 64, casing: "lower" }).slice(2)}`
  return {
    "user-agent": faker.internet.userAgent(),
    "content-type": "application/json",
    "content-length": String(Buffer.byteLength(body, "utf8")),
    "stripe-signature": signature,
    "stripe-account": stripeId("acct"),
    "accept-encoding": "gzip,compress,br",
  } as Record<string, string>
}

async function main() {
  const total = 80 // at least 60
  const pathnames = [
    "/stripe/webhook",
    "/webhooks/stripe",
    "/stripe",
    "/integrations/stripe/webhook",
  ]

  const rows = Array.from({ length: total }).map(() => {
    const type = pick(EVENT_TYPES)
    const event = buildStripeEvent(type)
    const body = JSON.stringify(event, null, 2)

    const headers = buildHeaders(body)

    return {
      method: "POST" as const,
      pathname: pick(pathnames),
      ip: faker.internet.ip(),
      statusCode: pick([200, 200, 200, 400, 401, 404, 500]),
      contentType: "application/json",
      contentLength: Buffer.byteLength(body, "utf8"),
      queryParams: { livemode: String(event.livemode), attempt: String(faker.number.int({ min: 1, max: 3 })) },
      headers,
      body,
      createdAt: faker.date.recent({ days: 30 }),
    }
  })

  const inserted = await db.insert(webhooks).values(rows).returning({ id: webhooks.id })
  console.log(`Seeded ${inserted.length} webhook(s).`)
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})

