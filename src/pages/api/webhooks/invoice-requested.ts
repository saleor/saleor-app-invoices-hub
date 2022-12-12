import { NextWebhookApiHandler, SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { gql } from "urql";
import { saleorApp } from "../../../../saleor-app";

/**
 * Next.js body parser has to be turned off for us to be able to access the raw request body
 * which is required to validate incoming requests
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

const Q = gql`
  subscription {
    event {
      version
    }
  }
`;

/**
 * The SaleorWebhook class will help us define the webhook and provide handlers for API and manifest
 * ProductUpdatedWebhookPayloadFragment is a fragment object generated by the codegen. We are using it to
 * provide webhook payload types.
 *
 * If you do not generate the `subscriptionQueryAst`, please provide the subscription query as string in
 * the `query` argument.
 */
export const invoiceRequestedWebhook = new SaleorAsyncWebhook<unknown>({
  name: "Invoice requested",
  webhookPath: "api/webhooks/invoice-requested",
  asyncEvent: "ANY_EVENTS",
  apl: saleorApp.apl,
  subscriptionQueryAst: Q
});

export const handler: NextWebhookApiHandler<unknown> = async (req, res, context) => {
  const { event, authData, payload } = context;

  console.log(event);
  console.log(payload);

  res.status(200).end();
};

/**
 * Before productUpdatedWebhook.handler will execute your handler, wrapper will reject:
 * - requests with missing or invalid headers
 * - requests from Saleor instances which didn't installed this app
 * - requests which could have been tampered with. Checking their checksum gives us
 *   confidence that request source was secure Saleor instance
 */
export default invoiceRequestedWebhook.createHandler(handler);
