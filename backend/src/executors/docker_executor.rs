use std::env;

use async_trait::async_trait;
use command_group::{AsyncCommandGroup, AsyncGroupChild};
use tokio::process::Command;
use uuid::Uuid;

use crate::{
    executor::{Executor, ExecutorError, NormalizedConversation, NormalizedEntry, NormalizedEntryType, SpawnContext},
    models::task::Task,
};

/// Docker executor for running tasks in containerized environments
#[derive(Debug)]
pub struct DockerExecutor {
    pub image: String,
    pub command: String,
}

impl DockerExecutor {
    pub fn new(image: String, command: String) -> Self {
        Self { image, command }
    }

    /// Build the docker command with all necessary volume mounts and environment variables
    fn build_docker_command(&self, _task_id: Uuid, working_dir: &str) -> Command {
        let mut cmd = Command::new("docker");
        
        // Basic docker run configuration
        cmd.args(&[
            "run",
            "--rm", // Remove container when it exits
            "-i",   // Interactive
            "-t",   // Allocate a TTY
        ]);

        // Mount the project workspace
        cmd.args(&["-v", &format!("{}:/workspace:rw", working_dir)]);
        
        // Mount authentication configs if they exist
        if let Some(home) = dirs::home_dir() {
            // Claude CLI config
            let claude_config = home.join(".claude.json");
            if claude_config.exists() {
                cmd.args(&["-v", &format!("{}:/root/.claude.json:ro", claude_config.display())]);
            }
            
            // GitHub CLI config
            let gh_config = home.join(".config/gh");
            if gh_config.exists() {
                cmd.args(&["-v", &format!("{}:/root/.config/gh:ro", gh_config.display())]);
            }
            
            // Git config
            let git_config = home.join(".gitconfig");
            if git_config.exists() {
                cmd.args(&["-v", &format!("{}:/root/.gitconfig:ro", git_config.display())]);
            }
            
            // SSH keys for git operations
            let ssh_dir = home.join(".ssh");
            if ssh_dir.exists() {
                cmd.args(&["-v", &format!("{}:/root/.ssh:ro", ssh_dir.display())]);
            }
            
            // Other AI service configs
            let opencode_config = home.join(".opencode.json");
            if opencode_config.exists() {
                cmd.args(&["-v", &format!("{}:/root/.opencode.json:ro", opencode_config.display())]);
            }
            
            let amp_config = home.join(".config/amp");
            if amp_config.exists() {
                cmd.args(&["-v", &format!("{}:/root/.config/amp:ro", amp_config.display())]);
            }
            
            let gemini_config = home.join(".gemini");
            if gemini_config.exists() {
                cmd.args(&["-v", &format!("{}:/root/.gemini:ro", gemini_config.display())]);
            }
        }

        // Pass through environment variables
        let env_vars = [
            "GITHUB_TOKEN",
            "ANTHROPIC_API_KEY", 
            "GEMINI_API_KEY",
            "AMP_API_KEY",
            "POSTHOG_API_KEY",
            "POSTHOG_API_ENDPOINT",
        ];
        
        for env_var in &env_vars {
            if let Ok(value) = env::var(env_var) {
                cmd.args(&["-e", &format!("{}={}", env_var, value)]);
            }
        }

        // Set resource limits
        cmd.args(&["--memory=4g", "--cpus=2.0"]);
        
        // Security options
        cmd.args(&["--security-opt", "no-new-privileges:true"]);
        
        // Network access (host mode for simplicity, could be restricted)
        cmd.args(&["--network", "host"]);
        
        // Set working directory in container
        cmd.args(&["-w", "/workspace"]);
        
        // Specify the image and command
        cmd.arg(&self.image);
        cmd.arg(&self.command);
        
        cmd
    }
}

#[async_trait]
impl Executor for DockerExecutor {
    async fn spawn(
        &self,
        pool: &sqlx::SqlitePool,
        task_id: Uuid,
        worktree_path: &str,
    ) -> Result<AsyncGroupChild, ExecutorError> {
        // Get the task to fetch its details
        let _task = Task::find_by_id(pool, task_id)
            .await?
            .ok_or(ExecutorError::TaskNotFound)?;

        // Build the docker command
        let mut cmd = self.build_docker_command(task_id, worktree_path);
        
        // Use AsyncCommandGroup for proper process group management  
        let child = cmd
            .group_spawn()
            .map_err(|e| {
                let spawn_context = SpawnContext {
                    executor_type: "Docker".to_string(),
                    command: "docker".to_string(),
                    args: vec!["run".to_string(), "--rm".to_string(), self.image.clone()],
                    working_dir: worktree_path.to_string(),
                    task_id: Some(task_id),
                    task_title: None,
                    additional_context: Some(format!("Docker image: {}", self.image)),
                };
                ExecutorError::spawn_failed(e, spawn_context)
            })?;

        Ok(child)
    }

    fn normalize_logs(
        &self,
        logs: &str,
        _worktree_path: &str,
    ) -> Result<NormalizedConversation, String> {
        // Docker executor doesn't have a specific conversation format
        // This would depend on what's running inside the container
        let entry = NormalizedEntry {
            timestamp: None,
            entry_type: NormalizedEntryType::SystemMessage,
            content: logs.to_string(),
            metadata: None,
        };

        Ok(NormalizedConversation {
            entries: vec![entry],
            session_id: None,
            executor_type: "Docker".to_string(),
            prompt: None,
            summary: Some("Docker container execution".to_string()),
        })
    }
}