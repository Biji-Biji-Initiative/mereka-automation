# Use the official Playwright image as base
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Set environment variables
ENV CI=true
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy project files
COPY . .

# Create directories for test artifacts
RUN mkdir -p test-results playwright-report

# Install Playwright browsers (they should already be in the base image)
RUN npx playwright install --with-deps

# Set permissions
RUN chmod +x scripts/*.sh 2>/dev/null || true
RUN chmod +x scripts/*.ps1 2>/dev/null || true

# Expose port for HTML report
EXPOSE 9323

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node --version || exit 1

# Default command
CMD ["npm", "run", "test"]

# Alternative entry points for different test suites
LABEL description="Playwright test automation container"
LABEL version="1.0"
LABEL maintainer="QA Team"

# Environment-specific configurations
ARG TEST_ENV=dev
ARG BROWSER=chromium
ARG WORKERS=5

ENV TEST_ENV=${TEST_ENV}
ENV BROWSER=${BROWSER}
ENV WORKERS=${WORKERS} 