package main

import (
	"database/sql"
	"log"
	"net/http"

	api "discord-bot-backend/internal/api"
	"discord-bot-backend/internal/api/guild"
	"discord-bot-backend/internal/api/guild_config"
	"discord-bot-backend/internal/database"
	"discord-bot-backend/internal/services"

	_ "modernc.org/sqlite"
)

func main() {
	db, err := sql.Open("sqlite", "database.db")
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	// Apply migrations
	if err := database.ApplyMigrations(db, "sqlite3", "./migrations"); err != nil {
		log.Fatalf("failed to apply migrations: %v", err)
	}

	mux := http.NewServeMux()
	svc := services.NewSQLiteGuildServiceFromDB(db)
	RegisterApiRoutes(mux, svc)

	log.Println("starting backend API on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}

func RegisterApiRoutes(mux *http.ServeMux, svc services.GuildService) {
	guildHandler := &guild.GuildHandler{Service: svc}
	guildConfigHandler := &guild_config.GuildConfigHandler{Service: svc}

	api.RegisterRoutes(mux, &api.Handler{
		GuildHandler:       guildHandler,
		GuildConfigHandler: guildConfigHandler,
	})
}
