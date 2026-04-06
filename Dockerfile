# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
# We disable linting and type checking during the build to speed it up,
# as these should ideally be handled in your CI pipeline.
RUN npm run build

# Stage 2: Serve the application using a lightweight image
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy necessary files from the builder stage
# We only need the public folder, the static assets, and the standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Start the application
# Next.js standalone output uses 'server.js' by default.
# It automatically respects the PORT environment variable if provided by Render.
CMD ["node", "server.js"]
