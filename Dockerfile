# IC Verity Proxy Server Dockerfile
# Multi-stage build for optimal production image

# Build stage
FROM oven/bun:1.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY api/ ./api/
COPY config.env.example ./

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.0-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bun -u 1001

# Copy built application
COPY --from=builder --chown=bun:nodejs /app/dist ./dist
COPY --from=builder --chown=bun:nodejs /app/package.json ./
COPY --from=builder --chown=bun:nodejs /app/config.env.example ./

# Install only production dependencies
RUN bun install --production --frozen-lockfile

# Switch to non-root user
USER bun

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e "fetch('http://localhost:8080/health').then(r => r.ok ? 0 : 1)"

# Start the application
CMD ["bun", "run", "dist/index.js"]
