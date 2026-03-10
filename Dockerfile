# Multi-stage Docker build for vibe-kanban
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm@10.8.1

# Copy package files
COPY frontend/package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY frontend/ ./

# Build frontend
RUN pnpm build

# Stage 2: Build backend
FROM rust:1.75-slim AS backend-builder

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Ensure backend builds with workspace root context
WORKDIR /app

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./
COPY backend/Cargo.toml backend/

# Create dummy main.rs to cache dependencies
RUN mkdir -p backend/src && echo "fn main() {}" > backend/src/main.rs

# Build dependencies (this will be cached)
RUN cd backend && cargo generate-lockfile --manifest-path Cargo.toml
RUN cd backend && cargo build --release

# Copy source code
COPY backend/ ./

# Build the actual application
RUN cd backend && touch src/main.rs && cargo build --release

# Stage 3: Runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 vibe-kanban

WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend
COPY --from=backend-builder /app/backend/target/release/vibe-kanban ./vibe-kanban

# Set ownership
RUN chown -R vibe-kanban:vibe-kanban /app

# Switch to non-root user
USER vibe-kanban

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["./vibe-kanban"]
