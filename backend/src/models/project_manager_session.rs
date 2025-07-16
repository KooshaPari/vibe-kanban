use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

use crate::models::ApiResponse;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ProjectManagerSession {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    
    #[ts(type = "Date")]
    pub created_at: DateTime<Utc>,
    #[ts(type = "Date")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ProjectManagerMessage {
    pub id: Uuid,
    pub session_id: Uuid,
    pub role: MessageRole,
    pub content: String,
    pub metadata: Option<String>, // JSON string for tool calls, file refs, etc.
    
    #[ts(type = "Date")]
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, sqlx::Type)]
#[ts(export)]
#[sqlx(type_name = "TEXT")]
pub enum MessageRole {
    #[sqlx(rename = "user")]
    User,
    #[sqlx(rename = "assistant")]
    Assistant,
    #[sqlx(rename = "system")]
    System,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct CreateProjectManagerSession {
    pub project_id: Uuid,
    pub title: String,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export)]
pub struct SendMessageRequest {
    pub content: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct ProjectManagerSessionWithMessages {
    pub session: ProjectManagerSession,
    pub messages: Vec<ProjectManagerMessage>,
}

#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct SendMessageResponse {
    pub user_message: ProjectManagerMessage,
    pub assistant_message: ProjectManagerMessage,
}

impl ProjectManagerSession {
    pub async fn create(
        pool: &SqlitePool,
        project_id: Uuid,
        title: String,
    ) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();

        sqlx::query!(
            r#"
            INSERT INTO project_manager_sessions (id, project_id, title, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?4)
            "#,
            id,
            project_id,
            title,
            now
        )
        .execute(pool)
        .await?;

        Ok(Self {
            id,
            project_id,
            title,
            created_at: now,
            updated_at: now,
        })
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            Self,
            "SELECT * FROM project_manager_sessions WHERE id = ?",
            id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn find_by_project_id(
        pool: &SqlitePool,
        project_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            Self,
            "SELECT * FROM project_manager_sessions WHERE project_id = ? ORDER BY updated_at DESC",
            project_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn update_timestamp(&self, pool: &SqlitePool) -> Result<(), sqlx::Error> {
        let now = Utc::now();
        sqlx::query!(
            "UPDATE project_manager_sessions SET updated_at = ? WHERE id = ?",
            now,
            self.id
        )
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!("DELETE FROM project_manager_sessions WHERE id = ?", id)
            .execute(pool)
            .await?;
        Ok(())
    }
}

impl ProjectManagerMessage {
    pub async fn create(
        pool: &SqlitePool,
        session_id: Uuid,
        role: MessageRole,
        content: String,
        metadata: Option<serde_json::Value>,
    ) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let metadata_str = metadata.map(|m| m.to_string());

        sqlx::query!(
            r#"
            INSERT INTO project_manager_messages (id, session_id, role, content, metadata, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
            id,
            session_id,
            role,
            content,
            metadata_str,
            now
        )
        .execute(pool)
        .await?;

        Ok(Self {
            id,
            session_id,
            role,
            content,
            metadata: metadata_str,
            created_at: now,
        })
    }

    pub async fn find_by_session_id(
        pool: &SqlitePool,
        session_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            Self,
            "SELECT * FROM project_manager_messages WHERE session_id = ? ORDER BY created_at ASC",
            session_id
        )
        .fetch_all(pool)
        .await
    }

    pub fn get_metadata_json(&self) -> Option<serde_json::Value> {
        self.metadata
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok())
    }
}