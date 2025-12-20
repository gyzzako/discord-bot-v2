-- +migrate Up

-- Create guilds table
CREATE TABLE guilds (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT (datetime('now'))
);

-- Guild configuration: references guilds(id)
CREATE TABLE guild_configs (
  guild_id TEXT PRIMARY KEY NOT NULL REFERENCES guilds(id),
  dj_role_id TEXT NULL,
  allowed_text_channels TEXT,
  allowed_voice_channels TEXT
);