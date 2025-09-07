# Railway Deployment Guide

## Pre-deployment Checklist

1. **Database**: Ensure you have a MySQL database provisioned on Railway
2. **Environment Variables**: Set these in Railway dashboard:
   - `DATABASE_URL` (automatically provided by Railway MySQL)
   - `JWT_SECRET` (at least 32 characters)
   - `NODE_ENV=production`
   - `AI_PROVIDER` (openai, gemini, openrouter, or mock)
   - API keys for your chosen AI provider:
     - `OPENAI_API_KEY` (if using OpenAI)
     - `GEMINI_API_KEY` (if using Gemini)
     - `OPENROUTER_API_KEY` (if using OpenRouter)
   - `FRONTEND_URL` (your frontend domain)

## Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Configure Build**: Railway will automatically detect the Dockerfile
3. **Set Environment Variables**: Add all required environment variables in Railway dashboard
4. **Deploy**: Railway will build and deploy automatically

## Important Notes

- The application runs on port 8000 (Railway will handle port mapping)
- Database migrations run automatically on startup
- Health check endpoint available at `/api/health`
- The app supports multi-language responses based on user country (ID, ZH, EN)

## Troubleshooting

If deployment fails:
1. Check Railway build logs for specific errors
2. Verify all environment variables are set
3. Ensure DATABASE_URL is correctly configured
4. Check that your chosen AI provider API key is valid

## Features
- JWT Authentication with country field
- Multi-language AI responses (Indonesian, Chinese, English)
- Travel plan suggestions
- Real-time chat with AI travel assistant
- Country-specific cultural context
