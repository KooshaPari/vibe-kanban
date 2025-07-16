use rmcp::{
    model::{
        CallToolResult, Content, Implementation, ProtocolVersion, ServerCapabilities, ServerInfo,
    },
    schemars, tool, Error as RmcpError, ServerHandler,
};
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::{
    app_state::AppState,
    models::{
        project::Project,
        project_manager_session::{
            CreateProjectManagerSession, MessageRole, ProjectManagerMessage, ProjectManagerSession,
            SendMessageRequest,
        },
        task::{CreateTask, CreateTaskAndStart, Task, TaskStatus},
    },
    services::ProjectManagerService,
};

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CreateProjectManagerSessionRequest {
    #[schemars(description = "The ID of the project to create a manager session for")]
    pub project_id: String,
    #[schemars(description = "Title for the manager session")]
    pub title: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct SendManagerMessageRequest {
    #[schemars(description = "The project ID")]
    pub project_id: String,
    #[schemars(description = "The session ID")]
    pub session_id: String,
    #[schemars(description = "The message content")]
    pub content: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CreateTasksFromRequirementsRequest {
    #[schemars(description = "The ID of the project")]
    pub project_id: String,
    #[schemars(description = "Requirements or description to create tasks from")]
    pub requirements: String,
    #[schemars(description = "Optional prefix for generated task titles")]
    pub task_prefix: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct AnalyzeProjectHealthRequest {
    #[schemars(description = "The ID of the project to analyze")]
    pub project_id: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct SuggestNextActionsRequest {
    #[schemars(description = "The ID of the project")]
    pub project_id: String,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct ProjectManagerSessionResponse {
    pub success: bool,
    pub session_id: String,
    pub message: String,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct SendMessageResponse {
    pub success: bool,
    pub assistant_response: String,
    pub message: String,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct CreateTasksResponse {
    pub success: bool,
    pub tasks_created: usize,
    pub task_ids: Vec<String>,
    pub message: String,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct ProjectHealthResponse {
    pub success: bool,
    pub health_analysis: String,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct NextActionsResponse {
    pub success: bool,
    pub suggested_actions: Vec<String>,
    pub message: String,
}

pub struct ProjectManagerServer {
    pool: SqlitePool,
    app_state: AppState,
}

impl ProjectManagerServer {
    pub fn new(pool: SqlitePool, app_state: AppState) -> Self {
        Self { pool, app_state }
    }
}

#[tool(tool_box)]
impl ProjectManagerServer {
    #[tool(description = "Create a new project manager session for coordinating project work")]
    async fn create_project_manager_session(
        &self,
        CreateProjectManagerSessionRequest { project_id, title }: CreateProjectManagerSessionRequest,
    ) -> Result<CallToolResult, RmcpError> {
        let project_uuid = Uuid::parse_str(&project_id).map_err(|e| {
            RmcpError::InvalidRequest(format!("Invalid project_id format: {}", e))
        })?;

        // Verify project exists
        let _project = Project::find_by_id(&self.pool, project_uuid)
            .await
            .map_err(|e| RmcpError::InternalError(format!("Database error: {}", e)))?
            .ok_or_else(|| RmcpError::InvalidRequest("Project not found".to_string()))?;

        let session = ProjectManagerSession::create(&self.pool, project_uuid, title)
            .await
            .map_err(|e| RmcpError::InternalError(format!("Failed to create session: {}", e)))?;

        let response = ProjectManagerSessionResponse {
            success: true,
            session_id: session.id.to_string(),
            message: "Project manager session created successfully".to_string(),
        };

        Ok(CallToolResult {
            content: vec![Content::Text {
                text: serde_json::to_string_pretty(&response)
                    .map_err(|e| RmcpError::InternalError(format!("JSON error: {}", e)))?,
            }],
            is_error: Some(false),
        })
    }

    #[tool(description = "Send a message to the project manager and get AI-powered project management assistance")]
    async fn send_manager_message(
        &self,
        SendManagerMessageRequest {
            project_id,
            session_id,
            content,
        }: SendManagerMessageRequest,
    ) -> Result<CallToolResult, RmcpError> {
        let project_uuid = Uuid::parse_str(&project_id).map_err(|e| {
            RmcpError::InvalidRequest(format!("Invalid project_id format: {}", e))
        })?;

        let session_uuid = Uuid::parse_str(&session_id).map_err(|e| {
            RmcpError::InvalidRequest(format!("Invalid session_id format: {}", e))
        })?;

        // Verify session exists and belongs to project
        let session = ProjectManagerSession::find_by_id(&self.pool, session_uuid)
            .await
            .map_err(|e| RmcpError::InternalError(format!("Database error: {}", e)))?
            .ok_or_else(|| RmcpError::InvalidRequest("Session not found".to_string()))?;

        if session.project_id != project_uuid {
            return Err(RmcpError::InvalidRequest(
                "Session does not belong to specified project".to_string(),
            ));
        }

        // Store user message
        ProjectManagerMessage::create(&self.pool, session_uuid, MessageRole::User, content.clone(), None)
            .await
            .map_err(|e| RmcpError::InternalError(format!("Failed to store user message: {}", e)))?;

        // Process message and get AI response
        let assistant_response = ProjectManagerService::process_message(
            &self.app_state,
            project_uuid,
            session_uuid,
            &content,
        )
        .await
        .map_err(|e| RmcpError::InternalError(format!("Failed to process message: {}", e)))?;

        // Store assistant message
        ProjectManagerMessage::create(
            &self.pool,
            session_uuid,
            MessageRole::Assistant,
            assistant_response.clone(),
            None,
        )
        .await
        .map_err(|e| RmcpError::InternalError(format!("Failed to store assistant message: {}", e)))?;

        let response = SendMessageResponse {
            success: true,
            assistant_response,
            message: "Message processed successfully".to_string(),
        };

        Ok(CallToolResult {
            content: vec![Content::Text {
                text: serde_json::to_string_pretty(&response)
                    .map_err(|e| RmcpError::InternalError(format!("JSON error: {}", e)))?,
            }],
            is_error: Some(false),
        })
    }

    #[tool(description = "Create multiple tasks from requirements or descriptions using AI analysis")]
    async fn create_tasks_from_requirements(
        &self,
        CreateTasksFromRequirementsRequest {
            project_id,
            requirements,
            task_prefix,
        }: CreateTasksFromRequirementsRequest,
    ) -> Result<CallToolResult, RmcpError> {
        let project_uuid = Uuid::parse_str(&project_id).map_err(|e| {
            RmcpError::InvalidRequest(format!("Invalid project_id format: {}", e))
        })?;

        let tasks = ProjectManagerService::create_tasks_from_requirements(
            &self.app_state,
            project_uuid,
            &requirements,
            task_prefix,
        )
        .await
        .map_err(|e| RmcpError::InternalError(format!("Failed to create tasks: {}", e)))?;

        let task_ids: Vec<String> = tasks.iter().map(|t| t.id.to_string()).collect();

        let response = CreateTasksResponse {
            success: true,
            tasks_created: tasks.len(),
            task_ids,
            message: format!("Successfully created {} tasks from requirements", tasks.len()),
        };

        Ok(CallToolResult {
            content: vec![Content::Text {
                text: serde_json::to_string_pretty(&response)
                    .map_err(|e| RmcpError::InternalError(format!("JSON error: {}", e)))?,
            }],
            is_error: Some(false),
        })
    }

    #[tool(description = "Analyze project health, progress, and get recommendations")]
    async fn analyze_project_health(
        &self,
        AnalyzeProjectHealthRequest { project_id }: AnalyzeProjectHealthRequest,
    ) -> Result<CallToolResult, RmcpError> {
        let project_uuid = Uuid::parse_str(&project_id).map_err(|e| {
            RmcpError::InvalidRequest(format!("Invalid project_id format: {}", e))
        })?;

        let health_analysis = ProjectManagerService::analyze_project_health(&self.app_state, project_uuid)
            .await
            .map_err(|e| RmcpError::InternalError(format!("Failed to analyze project health: {}", e)))?;

        let recommendations = ProjectManagerService::suggest_next_actions(&self.app_state, project_uuid)
            .await
            .map_err(|e| RmcpError::InternalError(format!("Failed to get recommendations: {}", e)))?;

        let response = ProjectHealthResponse {
            success: true,
            health_analysis,
            recommendations,
        };

        Ok(CallToolResult {
            content: vec![Content::Text {
                text: serde_json::to_string_pretty(&response)
                    .map_err(|e| RmcpError::InternalError(format!("JSON error: {}", e)))?,
            }],
            is_error: Some(false),
        })
    }

    #[tool(description = "Get AI-powered suggestions for next actions and priorities")]
    async fn suggest_next_actions(
        &self,
        SuggestNextActionsRequest { project_id }: SuggestNextActionsRequest,
    ) -> Result<CallToolResult, RmcpError> {
        let project_uuid = Uuid::parse_str(&project_id).map_err(|e| {
            RmcpError::InvalidRequest(format!("Invalid project_id format: {}", e))
        })?;

        let suggested_actions = ProjectManagerService::suggest_next_actions(&self.app_state, project_uuid)
            .await
            .map_err(|e| RmcpError::InternalError(format!("Failed to get suggestions: {}", e)))?;

        let response = NextActionsResponse {
            success: true,
            suggested_actions,
            message: "Successfully generated action suggestions".to_string(),
        };

        Ok(CallToolResult {
            content: vec![Content::Text {
                text: serde_json::to_string_pretty(&response)
                    .map_err(|e| RmcpError::InternalError(format!("JSON error: {}", e)))?,
            }],
            is_error: Some(false),
        })
    }
}

impl ServerHandler for ProjectManagerServer {
    async fn server_info(&self) -> Result<ServerInfo, RmcpError> {
        Ok(ServerInfo {
            name: "project-manager-server".to_string(),
            version: "1.0.0".to_string(),
        })
    }

    async fn server_capabilities(&self) -> Result<ServerCapabilities, RmcpError> {
        Ok(ServerCapabilities {
            tools: Some(true),
            resources: Some(false),
            prompts: Some(false),
        })
    }

    async fn implementation(&self) -> Result<Implementation, RmcpError> {
        Ok(Implementation {
            protocol_version: ProtocolVersion::V0_1_0,
        })
    }
}