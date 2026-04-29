import sqlite3

DB_PATH = "database.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vault TEXT NOT NULL,
        page_slug TEXT NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
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