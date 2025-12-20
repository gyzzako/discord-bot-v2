package services

import (
	"database/sql"
	"encoding/json"
	"errors"

	_ "modernc.org/sqlite"

	"discord-bot-backend/internal/domain"
)

// SQLiteGuildService implements GuildService using SQLite as the backend.
type SQLiteGuildService struct {
	db *sql.DB
}

// NewSQLiteGuildService opens (or creates) the SQLite database at the given path
// Use ":memory:" for an in-memory database useful in tests.
func NewSQLiteGuildService(path string) (*SQLiteGuildService, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}

	return &SQLiteGuildService{db: db}, nil
}

// NewSQLiteGuildServiceFromDB creates a SQLiteGuildService from an existing *sql.DB.
// This is useful when migrations are applied on the DB before creating the service.
func NewSQLiteGuildServiceFromDB(db *sql.DB) *SQLiteGuildService {
	return &SQLiteGuildService{db: db}
}

var ErrNotFound = errors.New("not found")

func (s *SQLiteGuildService) GetConfig(guildId string) (domain.GuildConfig, error) {
	var djRole sql.NullString
	var allowedText sql.NullString
	var allowedVoice sql.NullString
	row := s.db.QueryRow(`SELECT dj_role_id, allowed_text_channels, allowed_voice_channels FROM guild_configs WHERE guild_id = ?`, guildId)
	if err := row.Scan(&djRole, &allowedText, &allowedVoice); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.GuildConfig{}, ErrNotFound
		}
		return domain.GuildConfig{}, err
	}
	cfg := domain.GuildConfig{GuildId: guildId}
	if djRole.Valid {
		v := djRole.String
		cfg.DJRoleID = &v
	}
	if allowedText.Valid && allowedText.String != "" {
		var arr []string
		if err := json.Unmarshal([]byte(allowedText.String), &arr); err == nil {
			cfg.AllowedTextChannels = arr
		}
	}
	if allowedVoice.Valid && allowedVoice.String != "" {
		var arr []string
		if err := json.Unmarshal([]byte(allowedVoice.String), &arr); err == nil {
			cfg.AllowedVoiceChannels = arr
		}
	}
	return cfg, nil
}

func (s *SQLiteGuildService) PutConfig(guildId string, cfg domain.GuildConfig) error {
	if cfg.GuildId == "" {
		cfg.GuildId = guildId
	}
	// marshal arrays
	at, _ := json.Marshal(cfg.AllowedTextChannels)
	av, _ := json.Marshal(cfg.AllowedVoiceChannels)
	var dj interface{}
	if cfg.DJRoleID != nil {
		dj = *cfg.DJRoleID
	} else {
		dj = nil
	}
	_, err := s.db.Exec(`INSERT OR REPLACE INTO guild_configs (guild_id, dj_role_id, allowed_text_channels, allowed_voice_channels) VALUES (?, ?, ?, ?)`, guildId, dj, string(at), string(av))
	return err
}

// CreateNewGuild ensures the guild exists in the DB and creates default config if missing.
func (s *SQLiteGuildService) CreateNewGuild(g domain.Guild) (domain.GuildConfig, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return domain.GuildConfig{}, err
	}
	defer tx.Rollback()

	// create guild row if missing
	if _, err := tx.Exec(`INSERT OR IGNORE INTO guilds (id, name) VALUES (?, ?)`, g.GuildId, g.Name); err != nil {
		return domain.GuildConfig{}, err
	}

	// create default config if missing
	if _, err := tx.Exec(`INSERT OR IGNORE INTO guild_configs (guild_id, dj_role_id, allowed_text_channels, allowed_voice_channels) VALUES (?, ?, ?, ?)`, g.GuildId, nil, "[]", "[]"); err != nil {
		return domain.GuildConfig{}, err
	}

	if err := tx.Commit(); err != nil {
		return domain.GuildConfig{}, err
	}

	return s.GetConfig(g.GuildId)
}

func (s *SQLiteGuildService) Close() error {
	if s.db == nil {
		return nil
	}
	return s.db.Close()
}
