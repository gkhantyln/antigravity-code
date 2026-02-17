# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/README.md ./

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Set environment variables
ENV NODE_ENV=production

# Entry point
ENTRYPOINT ["node", "src/cli/index.js"]
CMD ["/help"]
