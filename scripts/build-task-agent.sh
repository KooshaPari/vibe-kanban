#!/bin/bash

# Build script for Task Agent containers
# This script builds the Docker image and sets up the environment

set -e

echo "Building Task Agent container..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Warning: docker-compose is not installed. You'll need to run containers manually."
fi

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Project root: $PROJECT_ROOT"

# Build the Docker image
echo "Building task-agent:latest..."
cd "$PROJECT_ROOT"
docker build -f Dockerfile.task-agent -t task-agent:latest .

echo "✓ Docker image built successfully!"

# Verify the image
echo "Verifying image..."
docker images task-agent:latest

# Check authentication setup on host
echo ""
echo "Checking host authentication setup..."

# Check Claude CLI
if command -v npx &> /dev/null; then
    echo "✓ npx is available"
    if npx @anthropic-ai/claude-code --version &> /dev/null; then
        echo "✓ Claude CLI is available"
    else
        echo "⚠ Claude CLI not found - install with: npm install -g @anthropic-ai/claude-code"
    fi
else
    echo "⚠ npx not found - install Node.js first"
fi

# Check GitHub CLI
if command -v gh &> /dev/null; then
    echo "✓ GitHub CLI is available"
    if gh auth status &> /dev/null; then
        echo "✓ GitHub CLI is authenticated"
    else
        echo "⚠ GitHub CLI not authenticated - run: gh auth login"
    fi
else
    echo "⚠ GitHub CLI not found - install from: https://cli.github.com/"
fi

# Check configuration files
echo ""
echo "Checking configuration files..."

if [ -f "$HOME/.claude.json" ]; then
    echo "✓ Claude configuration found at $HOME/.claude.json"
else
    echo "⚠ Claude configuration not found - authenticate first: npx @anthropic-ai/claude-code auth"
fi

if [ -d "$HOME/.config/gh" ]; then
    echo "✓ GitHub CLI configuration found at $HOME/.config/gh"
else
    echo "⚠ GitHub CLI configuration not found - authenticate first: gh auth login"
fi

if [ -f "$HOME/.gitconfig" ]; then
    echo "✓ Git configuration found at $HOME/.gitconfig"
else
    echo "⚠ Git configuration not found - set up with: git config --global user.name/user.email"
fi

echo ""
echo "Build complete! Next steps:"
echo ""
echo "1. Test the container:"
echo "   docker run -it --rm task-agent:latest"
echo ""
echo "2. Use with docker-compose:"
echo "   docker-compose -f docker-compose.task-agents.yml up task-agent"
echo ""
echo "3. Configure in Vibe Kanban:"
echo "   Add 'Docker' executor with image 'task-agent:latest'"
echo ""
echo "For more information, see CONTAINER_SETUP.md"