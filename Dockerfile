# Multi-stage Docker build for vibe-kanban
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.8.1

# Copy workspace-level package configuration required for lockfile overrides
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package*.json frontend/

# Install dependencies
RUN cd frontend && pnpm install --frozen-lockfile

# Copy source code
COPY frontend/ frontend/
COPY shared/ shared/

# Build frontend
RUN cd frontend && pnpm build

# Stage 2: Build backend
FROM rust:1.89.0-slim AS backend-builder

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    perl \
    pkg-config \
    libssl-dev \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Ensure backend builds with workspace root context
WORKDIR /app

# Copy workspace-level Rust manifest files
COPY Cargo.toml ./
COPY .cargo ./
# Copy backend source and build from the workspace root so workspace deps resolve
COPY backend/ backend/
RUN cargo build --release --manifest-path backend/Cargo.toml

# Stage 3: Runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    libssl3 \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 vibe-kanban

WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend
COPY --from=backend-builder /app/target/release/vibe-kanban ./vibe-kanban

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
