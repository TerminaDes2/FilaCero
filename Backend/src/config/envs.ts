import 'dotenv/config';
import {z} from 'zod';

export const envSchema = z.object({
    PORT: z.string().min(1, "PORT is required"). transform(Number),
    REDIS_HOST: z.string() .min(1, "REDIS_HOST is required"),
    REDIS_PORT: z.string().min(1, "REDIS_PORT is required") .transform(Number),
    REDIS_PASSWORD: z.string().optional(),
}).passthrough();

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
    console.error('❌ Config validation error:', envParsed.error.format());
    throw new Error('Invalid environment variables');
}  

export const envs = {
    port: envParsed.data.PORT,
    redisHost: envParsed.data.REDIS_HOST,
    redisPort: envParsed.data.REDIS_PORT,
    redisPassword: envParsed.data.REDIS_PASSWORD,
}