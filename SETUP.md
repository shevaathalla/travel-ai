# Database Migration & Setup Guide

## Prerequisites

1. **Node.js 20+** (✅ Already installed)
2. **MySQL 8.0+** (Choose one option below)
3. **OpenAI API Key** (Required for AI features)

## Database Setup Options

### Option A: Local MySQL Installation

1. **Download and Install MySQL 8.0**
   - Download from: https://dev.mysql.com/downloads/mysql/
   - During installation, set root password as: `password`

2. **Create Database and User**
   ```sql
   -- Connect to MySQL as root
   mysql -u root -p
   
   -- Create database
   CREATE DATABASE ai_wrapper;
   
   -- Create application user
   CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'app_password';
   GRANT ALL PRIVILEGES ON ai_wrapper.* TO 'app_user'@'localhost';
   FLUSH PRIVILEGES;
   
   -- Exit MySQL
   EXIT;
   ```

3. **Update .env file**
   ```env
   DATABASE_URL="mysql://app_user:app_password@localhost:3306/ai_wrapper"
   ```

### Option B: Docker MySQL (if Docker is installed)

1. **Start MySQL Container**
   ```bash
   docker run --name ai-backend-mysql \
     -e MYSQL_ROOT_PASSWORD=password \
     -e MYSQL_DATABASE=ai_wrapper \
     -e MYSQL_USER=app_user \
     -e MYSQL_PASSWORD=app_password \
     -p 3306:3306 \
     -d mysql:8.0
   ```

2. **Update .env file**
   ```env
   DATABASE_URL="mysql://app_user:app_password@localhost:3306/ai_wrapper"
   ```

### Option C: Cloud Database (Recommended for Production)

Use services like:
- **PlanetScale** (MySQL-compatible)
- **AWS RDS**
- **Google Cloud SQL**
- **Azure Database for MySQL**

## Migration Commands

Once MySQL is set up, run these commands in order:

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Run Initial Migration
```bash
npx prisma migrate dev --name init
```

### 3. Seed Database (Optional)
```bash
npm run prisma:seed
```

## Environment Variables Setup

Update your `.env` file with all required variables:

```env
# Environment
NODE_ENV=development
PORT=4000

# Database - UPDATE THIS
DATABASE_URL="mysql://app_user:app_password@localhost:3306/ai_wrapper"

# JWT - CHANGE IN PRODUCTION
JWT_SECRET="superlongrandomsecretfordevelopmentonly123456789"
JWT_EXPIRES_IN="1d"

# OpenAI - ADD YOUR KEY
OPENAI_API_KEY="sk-your-openai-api-key-here"

# CORS
FRONTEND_URL="http://localhost:3000"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Start Development Server

After database is set up and migrated:

```bash
npm run dev
```

The server will start on http://localhost:4000

## Testing the Setup

### 1. Health Check
```bash
curl http://localhost:4000/api/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "John Doe",
    "city": "Jakarta",
    "age": 28
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Common Migration Commands

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

### Deploy Migrations (Production)
```bash
npx prisma migrate deploy
```

### Check Migration Status
```bash
npx prisma migrate status
```

### Generate Migration Without Applying
```bash
npx prisma migrate diff --preview-feature
```

## Database Schema Overview

The current schema includes:

- **Users** - Authentication and profile
- **Chats** - Conversation threads
- **Messages** - Chat messages (user/assistant)
- **Plans** - Travel plans with AI suggestions

## Troubleshooting

### Connection Issues
1. Verify MySQL is running: `mysqladmin ping`
2. Check database exists: `SHOW DATABASES;`
3. Verify user permissions: `SHOW GRANTS FOR 'app_user'@'localhost';`

### Migration Errors
1. Check DATABASE_URL format
2. Ensure database exists
3. Verify user has proper permissions

### Prisma Issues
1. Regenerate client: `npx prisma generate`
2. Clear Prisma cache: `npx prisma generate --schema=prisma/schema.prisma`

## Next Steps

1. Set up MySQL database
2. Update .env with your database URL
3. Get OpenAI API key
4. Run migrations
5. Start development server
6. Test API endpoints

The backend is now ready for development!
