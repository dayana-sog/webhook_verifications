import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { webhooks } from '../db/schema'
import { db } from '../db'
import { inArray } from 'drizzle-orm'
import { generateText } from 'ai'

import { google} from '@ai-sdk/google'

export const generateHandler: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/api/generate", 
    {
      schema: {
        summary: 'Generate a TypeScript handler',
        tags: ['Webhooks'],
        body: z.object({
          webhookIds: z.array(z.string()),
        }),
        response: {
          201: z.object({
            code: z.string(),
          }),
        }
      }
    }, 
    async (request, reply) => {
      const { webhookIds } = request.body

      const result = await db
        .select({
          body: webhooks.body,
        })
        .from(webhooks)
        .where(inArray(webhooks.id, webhookIds))

      const webhooksBodies = result.map((webhook) => webhook.body).join('\n\n')

      const { text } = await generateText({
        model: google('gemini-2.5-flash-lite'),
        prompt: `
          I will provide you with several example **JSON request bodies** for different events from various webhooks.

          Your task is to generate a complete, working **TypeScript handler function** that can process these webhooks.

          This solution must include:

          1.  A **Zod schema** for each unique webhook request body structure provided, ensuring all fields are correctly typed and optional fields are marked as such.
          2.  A **Discriminated Union Zod schema** (or an equivalent structure using z.union() with a differentiating field like event_type or type) to validate the incoming webhook request against all possible event types.
          3.  A main **asynchronous TypeScript function** (e.g., handleWebhook) that accepts the raw request body as a JSON object (unknown or any type).
          4.  Inside the handler function, use the Zod schema to **safely parse and validate** the incoming request body.
          5.  Implement a **switch statement** (or equivalent if/else if) based on the event type field (e.g., event_type) to correctly **route the payload** to a specific internal handler function for that event (e.g., handleNewUser, handlePaymentSucceeded).
          6.  Include **placeholder internal handler functions** (e.g., async function handleEventName(payload: z.infer<typeof EventNameSchema>)) for each event type. These functions should log the event name and the payload to show they were successfully called.
          7.  Add appropriate **error handling** for parsing failures and unhandled event types.
          
          ${webhooksBodies}
    
          Return only the code and do not return \`\`\`typescript or any other language markers, symbols or any other text before or after the code.

        `.trim(),
      })

      return reply.status(201).send({ code: text })
    }
  )
}