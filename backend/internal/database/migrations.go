package database

import (
	"database/sql"
	"log"

	migrate "github.com/rubenv/sql-migrate"
)

// ApplyMigrations applies all up migrations found in migrationsDir to the provided DB.
// `dialect` should match the sql-migrate dialect for the DB driver (e.g. "sqlite3", "postgres").
// migrationsDir should be a path like "./migrations" relative to the working directory or executable.
func ApplyMigrations(db *sql.DB, dialect string, migrationsDir string) error {
	if dialect == "" {
		dialect = "sqlite3"
	}
	migrations := &migrate.FileMigrationSource{Dir: migrationsDir}
	n, err := migrate.Exec(db, dialect, migrations, migrate.Up)
	if err != nil {
		return err
	}
	if n > 0 {
		log.Printf("applied %d migrations (dialect=%s) from %s", n, dialect, migrationsDir)
	} else {
		log.Printf("no migrations to apply (dialect=%s) in %s", dialect, migrationsDir)
	}
	return nil
}
