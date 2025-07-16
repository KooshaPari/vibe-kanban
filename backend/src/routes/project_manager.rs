use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json as ResponseJson,
    routing::{delete, get, post},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    app_state::AppState,
    models::{
        project::Project,
        project_manager_session::{
            CreateProjectManagerSession, MessageRole, ProjectManagerMessage,
            ProjectManagerSession, ProjectManagerSessionWithMessages, SendMessageRequest,
            SendMessageResponse,
        },
        ApiResponse,
    },
    services::project_manager_service::ProjectManagerService,
};

pub fn project_manager_router() -> Router<AppState> {
    Router::new()
        .route("/projects/:project_id/manager/sessions", get(get_sessions))
        .route("/projects/:project_id/manager/sessions", post(create_session))
        .route(
            "/projects/:project_id/manager/sessions/:session_id",
            get(get_session),
        )
        .route(
            "/projects/:project_id/manager/sessions/:session_id",
            delete(delete_session),
        )
        .route(
            "/projects/:project_id/manager/sessions/:session_id/messages",
            post(send_message),
        )
}

pub async fn get_sessions(
    Path(project_id): Path<Uuid>,
    State(app_state): State<AppState>,
) -> Result<ResponseJson<ApiResponse<Vec<ProjectManagerSession>>>, StatusCode> {
    // Verify project exists
    match Project::find_by_id(&app_state.db_pool, project_id).await {
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to find project {}: {}", project_id, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
        _ => {}
    }

    match ProjectManagerSession::find_by_project_id(&app_state.db_pool, project_id).await {
        Ok(sessions) => Ok(ResponseJson(ApiResponse {
            success: true,
            data: Some(sessions),
            message: None,
        })),
        Err(e) => {
            tracing::error!(
                "Failed to fetch project manager sessions for project {}: {}",
                project_id,
                e
            );
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn create_session(
    Path(project_id): Path<Uuid>,
    State(app_state): State<AppState>,
    Json(request): Json<CreateProjectManagerSession>,
) -> Result<ResponseJson<ApiResponse<ProjectManagerSession>>, StatusCode> {
    // Verify project exists
    match Project::find_by_id(&app_state.db_pool, project_id).await {
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to find project {}: {}", project_id, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
        _ => {}
    }

    // Validate request
    if request.project_id != project_id {
        return Err(StatusCode::BAD_REQUEST);
    }

    match ProjectManagerSession::create(&app_state.db_pool, project_id, request.title).await {
        Ok(session) => {
            // Create initial welcome message
            let welcome_content = format!(
                "Hello! I'm your project manager agent for this project. I can help you:\n\n\
                - **Create and manage tasks**: Break down work into manageable tasks\n\
                - **Analyze requirements**: Review PRDs and technical specifications\n\
                - **Coordinate team members**: Assign work and track progress\n\
                - **Plan features**: Help design implementation approaches\n\
                - **Review code**: Coordinate code reviews and quality checks\n\n\
                What would you like to work on today?"
            );

            if let Err(e) = ProjectManagerMessage::create(
                &app_state.db_pool,
                session.id,
                MessageRole::Assistant,
                welcome_content,
                None,
            )
            .await
            {
                tracing::error!("Failed to create welcome message: {}", e);
                // Continue anyway, we have the session
            }

            Ok(ResponseJson(ApiResponse {
                success: true,
                data: Some(session),
                message: None,
            }))
        }
        Err(e) => {
            tracing::error!(
                "Failed to create project manager session for project {}: {}",
                project_id,
                e
            );
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_session(
    Path((project_id, session_id)): Path<(Uuid, Uuid)>,
    State(app_state): State<AppState>,
) -> Result<ResponseJson<ApiResponse<ProjectManagerSessionWithMessages>>, StatusCode> {
    // Verify project exists
    match Project::find_by_id(&app_state.db_pool, project_id).await {
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to find project {}: {}", project_id, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
        _ => {}
    }

    // Get session
    let session = match ProjectManagerSession::find_by_id(&app_state.db_pool, session_id).await {
        Ok(Some(session)) => {
            if session.project_id != project_id {
                return Err(StatusCode::NOT_FOUND);
            }
            session
        }
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to find session {}: {}", session_id, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Get messages
    match ProjectManagerMessage::find_by_session_id(&app_state.db_pool, session_id).await {
        Ok(messages) => Ok(ResponseJson(ApiResponse {
            success: true,
            data: Some(ProjectManagerSessionWithMessages { session, messages }),
            message: None,
        })),
        Err(e) => {
            tracing::error!("Failed to fetch messages for session {}: {}", session_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn delete_session(
    Path((project_id, session_id)): Path<(Uuid, Uuid)>,
    State(app_state): State<AppState>,
) -> Result<ResponseJson<ApiResponse<()>>, StatusCode> {
    // Verify project exists and session belongs to it
    let session = match ProjectManagerSession::find_by_id(&app_state.db_pool, session_id).await {
        Ok(Some(session)) => {
            if session.project_id != project_id {
                return Err(StatusCode::NOT_FOUND);
            }
            session
        }
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to find session {}: {}", session_id, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    match ProjectManagerSession::delete(&app_state.db_pool, session_id).await {
        Ok(_) => Ok(ResponseJson(ApiResponse {
            success: true,
            data: Some(()),
            message: Some("Session deleted successfully".to_string()),
        })),
        Err(e) => {
            tracing::error!("Failed to delete session {}: {}", session_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn send_message(
    Path((project_id, session_id)): Path<(Uuid, Uuid)>,
    State(app_state): State<AppState>,
    Json(request): Json<SendMessageRequest>,
) -> Result<ResponseJson<ApiResponse<SendMessageResponse>>, StatusCode> {
    // Verify project exists and session belongs to it
    let session = match ProjectManagerSession::find_by_id(&app_state.db_pool, session_id).await {
        Ok(Some(session)) => {
            if session.project_id != project_id {
                return Err(StatusCode::NOT_FOUND);
            }
            session
        }
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to find session {}: {}", session_id, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Create user message
    let user_message = match ProjectManagerMessage::create(
        &app_state.db_pool,
        session_id,
        MessageRole::User,
        request.content.clone(),
        request.metadata,
    )
    .await
    {
        Ok(message) => message,
        Err(e) => {
            tracing::error!("Failed to create user message: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Update session timestamp
    if let Err(e) = session.update_timestamp(&app_state.db_pool).await {
        tracing::warn!("Failed to update session timestamp: {}", e);
    }

    // Process message with project manager service and generate response
    let assistant_response = match ProjectManagerService::process_message(
        &app_state,
        project_id,
        session_id,
        &request.content,
    )
    .await
    {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Failed to process message with project manager: {}", e);
            "I apologize, but I encountered an error processing your request. Please try again."
                .to_string()
        }
    };

    // Create assistant message
    let assistant_message = match ProjectManagerMessage::create(
        &app_state.db_pool,
        session_id,
        MessageRole::Assistant,
        assistant_response,
        None,
    )
    .await
    {
        Ok(message) => message,
        Err(e) => {
            tracing::error!("Failed to create assistant message: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    Ok(ResponseJson(ApiResponse {
        success: true,
        data: Some(SendMessageResponse {
            user_message,
            assistant_message,
        }),
        message: None,
    }))
}