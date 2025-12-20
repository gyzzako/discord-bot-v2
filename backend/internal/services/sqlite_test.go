package services

import (
	"database/sql"
	"testing"

	"discord-bot-backend/internal/database"
	"discord-bot-backend/internal/domain"

	_ "modernc.org/sqlite"
)

func TestInMemoryGuildService_PutGet(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}
	defer db.Close()
	if err := database.ApplyMigrations(db, "sqlite3", "../../migrations"); err != nil {
		t.Fatalf("failed to apply migrations: %v", err)
	}
	svc := NewSQLiteGuildServiceFromDB(db)
	g := domain.GuildConfig{DJRoleID: nil, AllowedTextChannels: []string{}, AllowedVoiceChannels: []string{}}

	if err := svc.PutConfig("g1", g); err != nil {
		t.Fatalf("PutConfig error: %v", err)
	}

	got, err := svc.GetConfig("g1")
	if err != nil {
		t.Fatalf("GetConfig error: %v", err)
	}
	if got.GuildId != "g1" {
		t.Fatalf("expected guildID g1, got %s", got.GuildId)
	}
	if got.DJRoleID != nil {
		t.Fatalf("expected nil DJRoleID, got %v", got.DJRoleID)
	}
}

func TestInMemoryGuildService_NotFound(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}
	defer db.Close()
	if err := database.ApplyMigrations(db, "sqlite3", "../../migrations"); err != nil {
		t.Fatalf("failed to apply migrations: %v", err)
	}
	svc := NewSQLiteGuildServiceFromDB(db)
	_, err = svc.GetConfig("missing")
	if err == nil {
		t.Fatalf("expected error for missing guild")
	}
}

func TestInMemoryGuildService_ConfigWithDJRole(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}
	defer db.Close()
	if err := database.ApplyMigrations(db, "sqlite3", "../../migrations"); err != nil {
		t.Fatalf("failed to apply migrations: %v", err)
	}
	svc := NewSQLiteGuildServiceFromDB(db)
	djRole := "role1"
	cfg := domain.GuildConfig{DJRoleID: &djRole, AllowedTextChannels: []string{}, AllowedVoiceChannels: []string{}}

	if err := svc.PutConfig("g1", cfg); err != nil {
		t.Fatalf("PutConfig error: %v", err)
	}

	got, err := svc.GetConfig("g1")
	if err != nil {
		t.Fatalf("GetConfig error: %v", err)
	}
	if got.GuildId != "g1" {
		t.Fatalf("expected guildID g1, got %s", got.GuildId)
	}
	if got.DJRoleID == nil || *got.DJRoleID != "role1" {
		t.Fatalf("expected DJRoleID role1, got %v", got.DJRoleID)
	}
}
