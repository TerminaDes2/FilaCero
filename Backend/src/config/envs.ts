import 'dotenv/config';
import {z} from 'zod';

export const envSchema = z.object({
    PORT: z.string().min(1, "PORT is required"). transform(Number),
    REDIS_HOST: z.string() .min(1, "REDIS_HOST is required"),
    REDIS_PORT: z.string().min(1, "REDIS_PORT is required") .transform(Number),
    REDIS_USER: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    MAIL_USE_HTTP: z.string().optional().transform(val => val === 'true'),
    ZOHO_CLIENT_ID: z.string().min(1).optional(),
    ZOHO_CLIENT_SECRET: z.string().min(1).optional(),
    ZOHO_REDIRECT_URI: z.string().min(1).optional(),
    ZOHO_REFRESH_TOKEN: z.string().min(1).optional(),
    ZOHO_API_DOMAIN: z.string().min(1).optional(),
    MAIL_FROM: z.string().optional(),
    MAIL_NOREPLY_FROM: z.string().optional(),
    MAIL_CONTACT_FROM: z.string().optional(),
    MAIL_PRIVACY_FROM: z.string().optional(),
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
    redisUser: envParsed.data.REDIS_USER,
    redisPassword: envParsed.data.REDIS_PASSWORD,
    mailUseHttp: envParsed.data.MAIL_USE_HTTP || false,
    zohoClientId: envParsed.data.ZOHO_CLIENT_ID,
    zohoClientSecret: envParsed.data.ZOHO_CLIENT_SECRET,
    zohoRedirectUri: envParsed.data.ZOHO_REDIRECT_URI,
    zohoRefreshToken: envParsed.data.ZOHO_REFRESH_TOKEN,
    zohoApiDomain: envParsed.data.ZOHO_API_DOMAIN,
    mailFrom: envParsed.data.MAIL_FROM,
    mailNoreplyFrom: envParsed.data.MAIL_NOREPLY_FROM,
    mailContactFrom: envParsed.data.MAIL_CONTACT_FROM,
    mailPrivacyFrom: envParsed.data.MAIL_PRIVACY_FROM,
}