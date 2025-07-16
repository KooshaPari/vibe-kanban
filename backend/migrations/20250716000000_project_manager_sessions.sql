PRAGMA foreign_keys = ON;

CREATE TABLE project_manager_sessions (
    id                BLOB PRIMARY KEY,
    project_id        BLOB NOT NULL,
    title             TEXT NOT NULL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE project_manager_messages (
    id          BLOB PRIMARY KEY,
    session_id  BLOB NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content     TEXT NOT NULL,
    metadata    TEXT, -- JSON metadata for tool calls, file references, etc.
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (session_id) REFERENCES project_manager_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_manager_sessions_project_id ON project_manager_sessions(project_id);
CREATE INDEX idx_project_manager_messages_session_id ON project_manager_messages(session_id);
CREATE INDEX idx_project_manager_messages_created_at ON project_manager_messages(created_at);