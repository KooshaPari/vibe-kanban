PRAGMA foreign_keys = ON;

-- Task attachments table for gallery media files
CREATE TABLE task_attachments (
    id            BLOB PRIMARY KEY,
    task_id       BLOB NOT NULL,
    filename      TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path     TEXT NOT NULL,
    file_size     INTEGER NOT NULL,
    mime_type     TEXT NOT NULL,
    file_type     TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'other')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Task comments table for PR-like activity feed
CREATE TABLE task_comments (
    id         BLOB PRIMARY KEY,
    task_id    BLOB NOT NULL,
    author     TEXT NOT NULL DEFAULT 'user',
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Junction table for attachments referenced in comments
CREATE TABLE comment_attachments (
    id            BLOB PRIMARY KEY,
    comment_id    BLOB NOT NULL,
    attachment_id BLOB NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (comment_id) REFERENCES task_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (attachment_id) REFERENCES task_attachments(id) ON DELETE CASCADE,
    UNIQUE(comment_id, attachment_id)
);

-- Index for better query performance
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_comment_attachments_comment_id ON comment_attachments(comment_id);