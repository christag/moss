# ============================================================================
# M.O.S.S. Production Dockerfile
# Multi-stage build for Next.js application
# ============================================================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
# Install system dependencies needed for native npm packages
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    postgresql-dev
WORKDIR /app

# Copy package files (package-lock.json is required for npm ci)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for build)
# Set HUSKY=0 to skip git hooks installation in Docker
RUN HUSKY=0 npm ci && \
    npm cache clean --force

# ============================================================================
# Stage 2: Builder
FROM node:22-alpine AS builder
# Install system dependencies for build stage
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    postgresql-dev
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build Next.js application
RUN npm run build

# ============================================================================
# Stage 3: Runner (Production)
FROM node:22-alpine AS runner
# Install runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    libpq
WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create uploads directory for local storage
RUN mkdir -p /app/uploads && \
    chown -R nextjs:nodejs /app/uploads

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
