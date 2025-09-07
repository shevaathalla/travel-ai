import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8000'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(['openai', 'gemini', 'openrouter', 'mock']).default('openai'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  parseResult.error.errors.forEach((error) => {
    console.error(`  ${error.path.join('.')}: ${error.message}`);
  });
  process.exit(1);
}

export const env = parseResult.data;

// Validate AI provider configuration
if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required when AI_PROVIDER is set to "openai"');
  process.exit(1);
}

if (env.AI_PROVIDER === 'gemini' && !env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is required when AI_PROVIDER is set to "gemini"');
  process.exit(1);
}

if (env.AI_PROVIDER === 'openrouter' && !env.OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY is required when AI_PROVIDER is set to "openrouter"');
  process.exit(1);
}

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
