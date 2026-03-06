use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json as ResponseJson,
    routing::{delete, get, post},
    Router,
};
use axum_typed_multipart::{FieldData, TryFromMultipart, TypedMultipart};
use std::fs;
use std::path::PathBuf;
use tempfile::NamedTempFile;
use uuid::Uuid;

use crate::{
    app_state::AppState,
    models::{
        task_attachment::{CreateTaskAttachment, FileType, TaskAttachment},
        task_comment::{
            CreateTaskComment, TaskComment, TaskCommentWithAttachments, UpdateTaskComment,
        },
        ApiResponse,
    },
    utils,
};

#[derive(TryFromMultipart)]
struct FileUploadRequest {
    #[form_data(limit = "50MiB")]
    file: FieldData<NamedTempFile>,
}

pub fn gallery_router() -> Router<AppState> {
    Router::new()
        .route("/tasks/:task_id/attachments", post(upload_attachment))
        .route("/tasks/:task_id/attachments", get(get_attachments))
        .route(
            "/tasks/:task_id/attachments/:attachment_id",
            delete(delete_attachment),
        )
        .route(
            "/tasks/:task_id/attachments/:attachment_id/file",
            get(serve_attachment),
        )
        .route("/tasks/:task_id/comments", post(create_comment))
        .route("/tasks/:task_id/comments", get(get_comments))
        .route(
            "/tasks/:task_id/comments/:comment_id",
            delete(delete_comment),
        )
        .route("/tasks/:task_id/comments/:comment_id", post(update_comment))
}

fn determine_file_type(mime_type: &str) -> FileType {
    match mime_type {
        // Allowed image types only
        "image/jpeg" | "image/jpg" | "image/png" | "image/gif" | "image/webp" => FileType::Image,
        // Allowed video types only  
        "video/mp4" | "video/webm" | "video/quicktime" => FileType::Video,
        // Allowed document types only
        "application/pdf" => FileType::Document,
        "text/plain" | "text/markdown" | "text/csv" => FileType::Document,
        "application/msword" => FileType::Document,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => {
            FileType::Document
        }
        "application/vnd.ms-excel" => FileType::Document,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => FileType::Document,
        _ => FileType::Other,
    }
}

fn is_safe_filename(filename: &str) -> bool {
    // Check for dangerous patterns
    if filename.contains("..") || filename.contains("/") || filename.contains("\\") {
        return false;
    }
    
    // Check for null bytes
    if filename.contains('\0') {
        return false;
    }
    
    // Check for very long filenames
    if filename.len() > 255 {
        return false;
    }
    
    // Check for potentially dangerous extensions
    let dangerous_extensions = [
        ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".jar", ".war",
        ".ear", ".jsp", ".php", ".asp", ".aspx", ".py", ".rb", ".pl",
        ".sh", ".bash", ".zsh", ".fish", ".ps1", ".vbs", ".js", ".html",
        ".htm", ".hta", ".msi", ".dmg", ".pkg", ".deb", ".rpm", ".app",
    ];
    
    let filename_lower = filename.to_lowercase();
    for ext in &dangerous_extensions {
        if filename_lower.ends_with(ext) {
            return false;
        }
    }
    
    true
}

fn get_upload_directory() -> PathBuf {
    utils::asset_dir().join("uploads")
}

async fn upload_attachment(
    State(state): State<AppState>,
    Path(task_id): Path<Uuid>,
    TypedMultipart(upload_request): TypedMultipart<FileUploadRequest>,
) -> Result<ResponseJson<ApiResponse<TaskAttachment>>, StatusCode> {
    tracing::info!("Starting upload attachment for task_id: {}", task_id);

    // Ensure upload directory exists
    let upload_dir = get_upload_directory();
    if !upload_dir.exists() {
        fs::create_dir_all(&upload_dir).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    let file_field = upload_request.file;
    let temp_file = file_field.contents;
    let file_metadata = file_field.metadata;

    // Get filename and content type from metadata
    let filename = file_metadata
        .file_name
        .unwrap_or_else(|| "unknown".to_string());
    let content_type = file_metadata
        .content_type
        .unwrap_or_else(|| "application/octet-stream".to_string());

    // Validate filename for security
    if !is_safe_filename(&filename) {
        tracing::warn!("Unsafe filename detected: {}", filename);
        return Err(StatusCode::BAD_REQUEST);
    }

    tracing::info!(
        "Processing file: {} with content type: {}",
        filename,
        content_type
    );

    // Validate file type
    let file_type = determine_file_type(&content_type);
    let is_supported = matches!(
        file_type,
        FileType::Image | FileType::Video | FileType::Document
    );

    if !is_supported {
        tracing::warn!(
            "Unsupported file type: {} for file: {}",
            content_type,
            filename
        );
        return Err(StatusCode::UNSUPPORTED_MEDIA_TYPE);
    }

    // Get file size
    let file_size = temp_file
        .as_file()
        .metadata()
        .map_err(|e| {
            tracing::error!("Failed to get file metadata: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .len();

    // Check file size (50MB limit)
    const MAX_FILE_SIZE: u64 = 50 * 1024 * 1024;
    if file_size > MAX_FILE_SIZE {
        tracing::warn!("File too large: {} bytes for file: {}", file_size, filename);
        return Err(StatusCode::PAYLOAD_TOO_LARGE);
    }

    // Validate file is not empty
    if file_size == 0 {
        tracing::warn!("Empty file uploaded: {}", filename);
        return Err(StatusCode::BAD_REQUEST);
    }

    // Generate unique filename
    let attachment_id = Uuid::new_v4();
    let extension = std::path::Path::new(&filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");
    let unique_filename = if extension.is_empty() {
        format!("{}", attachment_id)
    } else {
        format!("{}.{}", attachment_id, extension)
    };

    let file_path = upload_dir.join(&unique_filename);
    let relative_path = format!("uploads/{}", unique_filename);

    // Move temp file to final location
    temp_file.persist(&file_path).map_err(|e| {
        tracing::error!(
            "Failed to persist temp file to: {} - {}",
            file_path.display(),
            e
        );
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Create database record
    let create_attachment = CreateTaskAttachment {
        task_id,
        filename: unique_filename.clone(),
        original_name: filename.clone(),
        file_path: relative_path,
        file_size: file_size as i64,
        mime_type: content_type.clone(),
        file_type,
    };

    let attachment = TaskAttachment::create(&state.db_pool, &create_attachment, attachment_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create attachment in database: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    tracing::info!(
        "File uploaded successfully: {} ({} bytes)",
        filename,
        file_size
    );
    Ok(ResponseJson(ApiResponse::success_with_message(
        attachment,
        "File uploaded successfully",
    )))
}

async fn get_attachments(
    State(state): State<AppState>,
    Path(task_id): Path<Uuid>,
) -> Result<ResponseJson<ApiResponse<Vec<TaskAttachment>>>, StatusCode> {
    let attachments = TaskAttachment::find_by_task_id(&state.db_pool, task_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(ResponseJson(ApiResponse::success(attachments)))
}

async fn delete_attachment(
    State(state): State<AppState>,
    Path((task_id, attachment_id)): Path<(Uuid, Uuid)>,
) -> Result<ResponseJson<ApiResponse<()>>, StatusCode> {
    // First get the attachment to find the file path
    let attachment = TaskAttachment::find_by_id(&state.db_pool, attachment_id, task_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(attachment) = attachment {
        // Delete the file from disk
        let file_path = utils::asset_dir().join(&attachment.file_path);
        if file_path.exists() {
            fs::remove_file(file_path).ok(); // Don't fail if file doesn't exist
        }

        // Delete from database
        TaskAttachment::delete(&state.db_pool, attachment_id, task_id)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(ResponseJson(ApiResponse::success_with_message(
            (),
            "Attachment deleted successfully",
        )))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn serve_attachment(
    State(state): State<AppState>,
    Path((task_id, attachment_id)): Path<(Uuid, Uuid)>,
) -> Result<Vec<u8>, StatusCode> {
    let attachment = TaskAttachment::find_by_id(&state.db_pool, attachment_id, task_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(attachment) = attachment {
        let file_path = utils::asset_dir().join(&attachment.file_path);
        fs::read(file_path).map_err(|_| StatusCode::NOT_FOUND)
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn create_comment(
    State(state): State<AppState>,
    Path(_task_id): Path<Uuid>,
    axum::Json(data): axum::Json<CreateTaskComment>,
) -> Result<ResponseJson<ApiResponse<TaskComment>>, StatusCode> {
    let comment_id = Uuid::new_v4();
    let comment = TaskComment::create(&state.db_pool, &data, comment_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(ResponseJson(ApiResponse::success_with_message(
        comment,
        "Comment created successfully",
    )))
}

async fn get_comments(
    State(state): State<AppState>,
    Path(task_id): Path<Uuid>,
) -> Result<ResponseJson<ApiResponse<Vec<TaskCommentWithAttachments>>>, StatusCode> {
    let comments = TaskComment::find_by_task_id_with_attachments(&state.db_pool, task_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(ResponseJson(ApiResponse::success(comments)))
}

async fn update_comment(
    State(state): State<AppState>,
    Path((task_id, comment_id)): Path<(Uuid, Uuid)>,
    axum::Json(data): axum::Json<UpdateTaskComment>,
) -> Result<ResponseJson<ApiResponse<TaskComment>>, StatusCode> {
    let comment = TaskComment::update(&state.db_pool, comment_id, task_id, data.content)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(ResponseJson(ApiResponse::success_with_message(
        comment,
        "Comment updated successfully",
    )))
}

async fn delete_comment(
    State(state): State<AppState>,
    Path((task_id, comment_id)): Path<(Uuid, Uuid)>,
) -> Result<ResponseJson<ApiResponse<()>>, StatusCode> {
    let rows_affected = TaskComment::delete(&state.db_pool, comment_id, task_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if rows_affected > 0 {
        Ok(ResponseJson(ApiResponse::success_with_message(
            (),
            "Comment deleted successfully",
        )))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}
