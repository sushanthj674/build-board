# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application using a lightweight image
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
# Next.js standalone listens on 0.0.0.0 by default, but we'll be explicit
ENV HOSTNAME "0.0.0.0"
# Render assigns a PORT, we'll default to 3000 if not provided
ENV PORT 3000

# Copy necessary files from the builder stage
# In standalone mode, we copy the contents of the standalone folder to the root
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Start the application using the standalone server
CMD ["node", "server.js"]
