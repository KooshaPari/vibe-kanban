#!/bin/bash

# Setup script for Task Agent containers
# This script ensures the container has full environment access

set -e

echo "Setting up Task Agent container environment..."

# Create necessary directories
mkdir -p /workspace
mkdir -p /root/.config/gh
mkdir -p /root/.ssh
mkdir -p /root/.npm

# Set permissions for SSH directory
chmod 700 /root/.ssh

# Verify installed tools
echo "Verifying installed tools..."

# Check Node.js and npm
node --version || echo "Warning: Node.js not found"
npm --version || echo "Warning: npm not found"

# Check Git
git --version || echo "Warning: Git not found"

# Check GitHub CLI
gh --version || echo "Warning: GitHub CLI not found"

# Check Claude CLI
npx @anthropic-ai/claude-code --version || echo "Warning: Claude CLI not found"

# Check Playwright
npx playwright --version || echo "Warning: Playwright not found"

# Check Docker (in case we need to run containers within containers)
docker --version || echo "Warning: Docker not found (this is expected if not using Docker-in-Docker)"

# Verify authentication configurations if they exist
echo "Checking authentication configurations..."

if [ -f "/root/.claude.json" ]; then
    echo "✓ Claude configuration found"
else
    echo "⚠ Claude configuration not found at /root/.claude.json"
fi

if [ -d "/root/.config/gh" ]; then
    echo "✓ GitHub CLI configuration directory found"
else
    echo "⚠ GitHub CLI configuration not found at /root/.config/gh"
fi

if [ -f "/root/.gitconfig" ]; then
    echo "✓ Git configuration found"
else
    echo "⚠ Git configuration not found at /root/.gitconfig"
fi

# Check environment variables
echo "Checking environment variables..."
env_vars=("GITHUB_TOKEN" "ANTHROPIC_API_KEY" "GEMINI_API_KEY" "AMP_API_KEY")

for var in "${env_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✓ $var is set"
    else
        echo "⚠ $var is not set"
    fi
done

# Install Playwright browsers if not already installed
echo "Installing Playwright browsers..."
npx playwright install --with-deps || echo "Warning: Failed to install Playwright browsers"

echo "Container environment setup complete!"
echo "Working directory: $(pwd)"
echo "Available disk space:"
df -h /workspace

# Start background services if needed
echo "Starting background services..."

# Start Xvfb for GUI applications
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
export DISPLAY=:99

echo "Background services started."
echo "Container is ready for task execution!"