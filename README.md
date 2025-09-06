# Travel AI Backend

A comprehensive Express + TypeScript API server with MySQL, JWT authentication, and OpenAI integration for travel planning.

## Features

- 🚀 **Express 5** with TypeScript
- 🔐 **JWT Authentication** with bcrypt password hashing
- 🗄️ **MySQL Database** with Prisma ORM
- 🤖 **OpenAI Integration** for travel plan suggestions and chat
- ✅ **Input Validation** with Zod schemas
- 📝 **Comprehensive Logging** with Pino
- 🛡️ **Security** with Helmet, CORS, and rate limiting
- 🐳 **Docker** ready with multi-stage builds
- 📊 **Health Checks** and graceful shutdown

## Project Structure

```
src/
├── app.ts                    # Express app configuration
├── server.ts                 # Server entry point
├── config/
│   ├── env.ts               # Environment configuration
│   └── logger.ts            # Logger setup
├── middlewares/
│   ├── auth.ts              # JWT authentication middleware
│   ├── error.ts             # Global error handling
│   └── validate.ts          # Request validation middleware
├── utils/
│   ├── jwt.ts               # JWT utilities
│   └── openai.ts            # OpenAI integration
├── routes/
│   ├── index.ts             # Main router
│   ├── auth.routes.ts       # Authentication routes
│   ├── user.routes.ts       # User profile routes
│   ├── ai.routes.ts         # AI suggestion routes
│   ├── plan.routes.ts       # Travel plan routes
│   └── chat.routes.ts       # Chat routes
├── controllers/
│   ├── auth.controller.ts   # Auth logic
│   ├── user.controller.ts   # User profile logic
│   ├── ai.controller.ts     # AI suggestions logic
│   ├── plan.controller.ts   # Plan management logic
│   └── chat.controller.ts   # Chat logic
├── services/
│   ├── auth.service.ts      # Auth business logic
│   ├── user.service.ts      # User service
│   ├── ai.service.ts        # AI integration service
│   ├── plan.service.ts      # Plan management service
│   └── chat.service.ts      # Chat service
└── schemas/
    ├── auth.schema.ts       # Auth validation schemas
    ├── user.schema.ts       # User validation schemas
    ├── ai.schema.ts         # AI request schemas
    ├── plan.schema.ts       # Plan validation schemas
    └── chat.schema.ts       # Chat validation schemas
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### User Profile
- `GET /api/me` - Get user profile
- `PATCH /api/me` - Update user profile

### AI Travel Suggestions
- `POST /api/ai/plan/suggest` - Generate travel plan suggestions

### Travel Plans
- `GET /api/plans` - Get user's travel plans
- `GET /api/plans/:id` - Get plan details
- `POST /api/plans/:id/choose` - Choose a plan option
- `DELETE /api/plans/:id` - Delete a plan

### Chat
- `POST /api/chats` - Create new chat
- `GET /api/chats` - Get user's chats
- `GET /api/chats/:id` - Get chat messages
- `POST /api/chats/:id/messages` - Add message to chat

### Health Check
- `GET /api/health` - Service health status

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8.0+
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/ai_wrapper"
   JWT_SECRET="your-super-long-random-secret"
   JWT_EXPIRES_IN="1d"
   OPENAI_API_KEY="sk-your-openai-api-key"
   PORT=4000
   NODE_ENV=development
   FRONTEND_URL="http://localhost:3000"
   ```

3. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed with test data (optional)
   npm run prisma:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Using Docker Compose (recommended):**
   ```bash
   # Set environment variables in .env
   export OPENAI_API_KEY="sk-your-key"
   export JWT_SECRET="your-production-secret"
   
   # Start services
   docker-compose up -d
   
   # Run migrations
   docker-compose exec app npx prisma migrate deploy
   
   # Seed database (optional)
   docker-compose exec app npm run prisma:seed
   ```

2. **Using Docker only:**
   ```bash
   # Build image
   docker build -t travel-ai-backend .
   
   # Run container
   docker run -p 4000:4000 -e DATABASE_URL="..." -e OPENAI_API_KEY="..." travel-ai-backend
   ```

## API Usage Examples

### User Registration
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "city": "Jakarta",
    "age": 28
  }'
```

### Generate Travel Plans
```bash
curl -X POST http://localhost:4000/api/ai/plan/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "days": 5,
    "budget": 5000000,
    "feeling": "adventurous",
    "originCity": "Jakarta"
  }'
```

### Chat with AI
```bash
curl -X POST http://localhost:4000/api/chats/CHAT_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "I want to visit Bali for 3 days. Any suggestions?"
  }'
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with test data

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | MySQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `1d` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## Database Schema

### Users
- User authentication and profile information
- Relationships to chats and plans

### Plans
- Travel plan requests and AI-generated options
- Support for multiple options and user selection

### Chats
- Conversation threads with AI
- Message history with roles (user/assistant)

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS configuration
- ✅ Security headers with Helmet
- ✅ Input validation and sanitization
- ✅ Error handling without sensitive data exposure

## Error Handling

The API returns consistent error responses:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { /* Additional error details */ }
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `USER_NOT_FOUND` - User doesn't exist
- `PLAN_NOT_FOUND` - Plan doesn't exist
- `AI_SERVICE_ERROR` - OpenAI service unavailable
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and formatting
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
