use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool, Type};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Type, Serialize, Deserialize, PartialEq, TS)]
#[sqlx(type_name = "file_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
#[ts(export)]
pub enum FileType {
    Image,
    Video,
    Document,
    Other,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TaskAttachment {
    pub id: Uuid,
    pub task_id: Uuid,
    pub filename: String,
    pub original_name: String,
    pub file_path: String,
    pub file_size: i64,
    pub mime_type: String,
    pub file_type: FileType,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct CreateTaskAttachment {
    pub task_id: Uuid,
    pub filename: String,
    pub original_name: String,
    pub file_path: String,
    pub file_size: i64,
    pub mime_type: String,
    pub file_type: FileType,
}

impl TaskAttachment {
    pub async fn find_by_task_id(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskAttachment,
            r#"SELECT id as "id!: Uuid", task_id as "task_id!: Uuid", filename, original_name, file_path, file_size, mime_type, file_type as "file_type!: FileType", created_at as "created_at!: DateTime<Utc>"
               FROM task_attachments 
               WHERE task_id = $1
               ORDER BY created_at DESC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(
        pool: &SqlitePool,
        id: Uuid,
        task_id: Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskAttachment,
            r#"SELECT id as "id!: Uuid", task_id as "task_id!: Uuid", filename, original_name, file_path, file_size, mime_type, file_type as "file_type!: FileType", created_at as "created_at!: DateTime<Utc>"
               FROM task_attachments 
               WHERE id = $1 AND task_id = $2"#,
            id,
            task_id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn create(
        pool: &SqlitePool,
        data: &CreateTaskAttachment,
        attachment_id: Uuid,
    ) -> Result<Self, sqlx::Error> {
        let file_type = data.file_type as FileType;
        sqlx::query_as!(
            TaskAttachment,
            r#"INSERT INTO task_attachments (id, task_id, filename, original_name, file_path, file_size, mime_type, file_type) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
               RETURNING id as "id!: Uuid", task_id as "task_id!: Uuid", filename, original_name, file_path, file_size, mime_type, file_type as "file_type!: FileType", created_at as "created_at!: DateTime<Utc>""#,
            attachment_id,
            data.task_id,
            data.filename,
            data.original_name,
            data.file_path,
            data.file_size,
            data.mime_type,
            file_type
        )
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid, task_id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            "DELETE FROM task_attachments WHERE id = $1 AND task_id = $2",
            id,
            task_id
        )
        .execute(pool)
        .await?;
        Ok(result.rows_affected())
    }
}
