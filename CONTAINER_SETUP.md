# Task Agent Container Setup

This document explains how to set up and use containerized Task agents with full environment access.

## Overview

The Task agent containers provide a fully isolated environment with access to:
- **Authentication**: GitHub CLI, Claude CLI with your existing authentication
- **Development tools**: Node.js, npm, Git, Rust, Python
- **Browser automation**: Playwright with all browsers installed
- **Security**: Isolated execution with resource limits

## Quick Start

### 1. Build the Task Agent Image

```bash
docker build -f Dockerfile.task-agent -t task-agent:latest .
```

### 2. Set Up Authentication

Ensure you have the following authenticated on your host system:

```bash
# Authenticate with Claude CLI
npx @anthropic-ai/claude-code auth

# Authenticate with GitHub CLI
gh auth login

# Verify authentications
claude --version
gh auth status
```

### 3. Run with Docker Compose

```bash
# Start a Task agent container
docker-compose -f docker-compose.task-agents.yml up task-agent

# Or run in detached mode
docker-compose -f docker-compose.task-agents.yml up -d task-agent
```

### 4. Manual Container Run

For more control, run the container manually:

```bash
docker run -it --rm \
  -v $(pwd):/workspace:rw \
  -v ~/.claude.json:/root/.claude.json:ro \
  -v ~/.config/gh:/root/.config/gh:ro \
  -v ~/.gitconfig:/root/.gitconfig:ro \
  -v ~/.ssh:/root/.ssh:ro \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  --memory=4g \
  --cpus=2.0 \
  --security-opt no-new-privileges:true \
  --network host \
  task-agent:latest
```

## Configuration Files Mounted

The container automatically mounts these configuration files from your host:

| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `~/.claude.json` | `/root/.claude.json` | Claude CLI authentication |
| `~/.config/gh` | `/root/.config/gh` | GitHub CLI configuration |
| `~/.gitconfig` | `/root/.gitconfig` | Git configuration |
| `~/.ssh` | `/root/.ssh` | SSH keys for Git operations |
| `~/.opencode.json` | `/root/.opencode.json` | Charm Opencode configuration |
| `~/.config/amp` | `/root/.config/amp` | Amp configuration |
| `~/.gemini` | `/root/.gemini` | Gemini configuration |

## Environment Variables

The following environment variables are passed through to the container:

- `GITHUB_TOKEN` - GitHub Personal Access Token
- `ANTHROPIC_API_KEY` - Claude API key (if using direct API)
- `GEMINI_API_KEY` - Google Gemini API key
- `AMP_API_KEY` - Amp API key
- `POSTHOG_API_KEY` - PostHog analytics key
- `POSTHOG_API_ENDPOINT` - PostHog endpoint

## Using in Vibe Kanban

### 1. Add Docker Executor to Project

In your project settings, you can now select "Docker" as an executor type:

```json
{
  "type": "docker",
  "image": "task-agent:latest",
  "command": "bash"
}
```

### 2. Task Execution

When a task is executed with the Docker executor:

1. The container is started with full environment access
2. Your project workspace is mounted at `/workspace`
3. All authentication configs are available
4. The task runs with access to all development tools

### 3. Example Task

Create a task that requires browser automation:

```bash
# This will run inside the container with Playwright available
npx playwright test --headed
```

Or a task that needs GitHub access:

```bash
# This will use your authenticated GitHub CLI
gh pr create --title "Automated PR" --body "Created by Task agent"
```

## Security Considerations

The containers run with several security measures:

- **Resource limits**: 4GB memory, 2 CPU cores
- **No new privileges**: Prevents privilege escalation
- **Read-only configs**: Authentication files are mounted read-only
- **Isolated network**: Containers use host network but are isolated from each other

## Troubleshooting

### Authentication Issues

If authentication doesn't work in the container:

1. Verify host authentication:
   ```bash
   claude --version
   gh auth status
   ```

2. Check file permissions:
   ```bash
   ls -la ~/.claude.json
   ls -la ~/.config/gh/
   ```

3. Ensure files exist before starting container

### Performance Issues

If containers are slow:

1. Increase resource limits in `docker-compose.task-agents.yml`
2. Use local Docker registry for faster image pulls
3. Mount npm cache volume for faster installs

### Browser Issues

If Playwright fails:

1. Ensure Xvfb is running (handled automatically)
2. Check DISPLAY environment variable
3. Install additional browser dependencies if needed

## Advanced Configuration

### Custom Docker Images

Create specialized images for specific tasks:

```dockerfile
FROM task-agent:latest
RUN npm install -g your-specific-tools
```

### Docker-in-Docker

For tasks that need to build containers:

```yaml
services:
  task-agent:
    # ... other config
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    group_add:
      - docker
```

### Network Isolation

For enhanced security, use custom networks:

```yaml
networks:
  task-network:
    driver: bridge
    
services:
  task-agent:
    networks:
      - task-network
```

## Integration with MCP

The Docker executor supports MCP (Model Context Protocol) servers. Configure them in your executor settings:

```json
{
  "type": "docker",
  "image": "task-agent:latest", 
  "command": "bash",
  "mcpServers": {
    "your-mcp-server": {
      "command": "your-mcp-command",
      "args": ["--config", "/workspace/config.json"]
    }
  }
}
```

## Development

To modify the container setup:

1. Edit `Dockerfile.task-agent`
2. Rebuild: `docker build -f Dockerfile.task-agent -t task-agent:latest .`
3. Test with a simple task
4. Update `docker-compose.task-agents.yml` if needed

## Support

For issues with containerized Task agents:

1. Check container logs: `docker logs <container-id>`
2. Verify authentication setup on host
3. Test with a simple echo task first
4. Check resource usage: `docker stats`