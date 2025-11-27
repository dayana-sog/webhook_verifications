import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3333),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
    DATABASE_URL: z.string(),
})

export const env = envSchema.parse(process.env)