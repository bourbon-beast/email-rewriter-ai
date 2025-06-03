-- File: backend/database/schema.sql
CREATE TABLE base_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE tones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prompt_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component_type VARCHAR(20) NOT NULL, -- 'base' or 'tone'
    component_id INTEGER NOT NULL,
    old_content TEXT,
    new_content TEXT,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
