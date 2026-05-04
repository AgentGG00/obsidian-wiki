import sqlite3
import os
import uuid

DB_PATH = os.getenv("DB_PATH", "src/db/database.db")

def generate_author_token() -> str:
    return str(uuid.uuid4())

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    conn.execute(
        "CREATE TABLE IF NOT EXISTS comments ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "vault TEXT NOT NULL,"
        "page_slug TEXT NOT NULL,"
        "author_name TEXT NOT NULL,"
        "author_token TEXT NOT NULL,"
        "parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,"
        "depth INTEGER NOT NULL DEFAULT 0,"
        "updated_at TIMESTAMP,"
        "content TEXT NOT NULL,"
        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
    )
    conn.commit()
    conn.close()

def get_comments(vault: str, page_slug: str) -> list:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM comments WHERE vault = ? AND page_slug = ? ORDER BY created_at ASC",
        (vault, page_slug)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_comment(vault: str, page_slug: str, author_name: str, content: str, author_token: str, parent_id: int | None = None) -> dict:
    depth = 0
    conn = get_connection()

    if parent_id is not None:
        parent = conn.execute(
            "SELECT depth FROM comments WHERE id = ?", (parent_id,)
        ).fetchone()
        if parent:
            depth = min(parent["depth"] + 1, 3)

    cursor = conn.execute(
        "INSERT INTO comments (vault, page_slug, author_name, content, author_token, parent_id, depth) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (vault, page_slug, author_name, content, author_token, parent_id, depth)
    )
    conn.commit()

    row = conn.execute(
        "SELECT * FROM comments WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    conn.close()

    return dict(row)

def edit_comment(comment_id: int, content: str, author_token: str) -> bool:
    conn = get_connection()
    cursor = conn.execute(
        "UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP "
        "WHERE id = ? AND author_token = ?",
        (content, comment_id, author_token)
    )
    conn.commit()
    conn.close()
    return cursor.rowcount > 0

def delete_comment(comment_id: int, author_token: str) -> bool:
    conn = get_connection()
    cursor = conn.execute(
        "DELETE FROM comments WHERE id = ? AND author_token = ?",
        (comment_id, author_token)
    )
    conn.commit()
    conn.close()
    return cursor.rowcount > 0
