use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TaskComment {
    pub id: Uuid,
    pub task_id: Uuid,
    pub author: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TaskCommentWithAttachments {
    pub id: Uuid,
    pub task_id: Uuid,
    pub author: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub attachments: Vec<crate::models::task_attachment::TaskAttachment>,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct CreateTaskComment {
    pub task_id: Uuid,
    pub author: String,
    pub content: String,
    pub attachment_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct UpdateTaskComment {
    pub content: String,
}

impl TaskComment {
    pub async fn find_by_task_id(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskComment,
            r#"SELECT id as "id!: Uuid", task_id as "task_id!: Uuid", author, content, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>"
               FROM task_comments 
               WHERE task_id = $1
               ORDER BY created_at ASC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_task_id_with_attachments(
        pool: &SqlitePool,
        task_id: Uuid,
    ) -> Result<Vec<TaskCommentWithAttachments>, sqlx::Error> {
        let comments = Self::find_by_task_id(pool, task_id).await?;
        let mut comments_with_attachments = Vec::new();

        for comment in comments {
            let attachments = sqlx::query_as!(
                crate::models::task_attachment::TaskAttachment,
                r#"SELECT ta.id as "id!: Uuid", ta.task_id as "task_id!: Uuid", ta.filename, ta.original_name, ta.file_path, ta.file_size, ta.mime_type, ta.file_type as "file_type!: crate::models::task_attachment::FileType", ta.created_at as "created_at!: DateTime<Utc>"
                   FROM task_attachments ta
                   JOIN comment_attachments ca ON ta.id = ca.attachment_id
                   WHERE ca.comment_id = $1
                   ORDER BY ta.created_at ASC"#,
                comment.id
            )
            .fetch_all(pool)
            .await?;

            comments_with_attachments.push(TaskCommentWithAttachments {
                id: comment.id,
                task_id: comment.task_id,
                author: comment.author,
                content: comment.content,
                created_at: comment.created_at,
                updated_at: comment.updated_at,
                attachments,
            });
        }

        Ok(comments_with_attachments)
    }

    #[allow(dead_code)]
    pub async fn find_by_id(
        pool: &SqlitePool,
        id: Uuid,
        task_id: Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            TaskComment,
            r#"SELECT id as "id!: Uuid", task_id as "task_id!: Uuid", author, content, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>"
               FROM task_comments 
               WHERE id = $1 AND task_id = $2"#,
            id,
            task_id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn create(
        pool: &SqlitePool,
        data: &CreateTaskComment,
        comment_id: Uuid,
    ) -> Result<Self, sqlx::Error> {
        let mut tx = pool.begin().await?;

        let comment = sqlx::query_as!(
            TaskComment,
            r#"INSERT INTO task_comments (id, task_id, author, content) 
               VALUES ($1, $2, $3, $4) 
               RETURNING id as "id!: Uuid", task_id as "task_id!: Uuid", author, content, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>""#,
            comment_id,
            data.task_id,
            data.author,
            data.content
        )
        .fetch_one(&mut *tx)
        .await?;

        // Link attachments if provided
        if let Some(attachment_ids) = &data.attachment_ids {
            for attachment_id in attachment_ids {
                let uuid = Uuid::new_v4();
                sqlx::query!(
                    "INSERT INTO comment_attachments (id, comment_id, attachment_id) VALUES ($1, $2, $3)",
                    uuid,
                    comment_id,
                    attachment_id
                )
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(comment)
    }

    pub async fn update(
        pool: &SqlitePool,
        id: Uuid,
        task_id: Uuid,
        content: String,
    ) -> Result<Self, sqlx::Error> {
        sqlx::query_as!(
            TaskComment,
            r#"UPDATE task_comments 
               SET content = $3, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $1 AND task_id = $2 
               RETURNING id as "id!: Uuid", task_id as "task_id!: Uuid", author, content, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>""#,
            id,
            task_id,
            content
        )
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid, task_id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            "DELETE FROM task_comments WHERE id = $1 AND task_id = $2",
            id,
            task_id
        )
        .execute(pool)
        .await?;
        Ok(result.rows_affected())
    }
}
