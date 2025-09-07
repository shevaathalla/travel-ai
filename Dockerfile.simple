# Simple single-stage Dockerfile to avoid permission issues
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl libc6-compat dumb-init

# Copy all files
COPY . .

# Install dependencies and build
RUN npm ci && \
    npx prisma generate && \
    npm run build && \
    npm prune --production

# Create a simple start script
RUN echo '#!/bin/sh\nset -e\necho "Starting server..."\nexec node dist/server.js' > start-simple.sh && \
    chmod +x start-simple.sh

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
