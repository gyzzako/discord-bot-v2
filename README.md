# Discord Bot v2

A self-hosted, multi-guild Discord bot with an administration panel backend, designed for seamless music playback and guild management. This project utilizes a self-hosted Lavalink node (available at [https://github.com/lavalink-devs/Lavalink](https://github.com/lavalink-devs/Lavalink)) as the audio provider for handling music playback in a Discord bot.

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)

## Project Description

Discord Bot v2 is a comprehensive Discord bot solution that includes both a bot component written in TypeScript using Discord.js and a backend API written in Go. The bot supports multi-guild operations, music playback via Lavalink, and integrates with a SQLite database for persistent guild configurations. The backend provides RESTful APIs for managing guilds and their settings, enabling an administration panel for easy configuration.

The bot leverages Lavalink for high-quality audio streaming, ensuring low-latency music playback across multiple Discord servers.

## Features

- **Multi-Guild Support**: Manage multiple Discord servers with individual configurations.
- **Music Playback**: Play music from URLs using slash commands (`/play`, `/stop`).
- **Lavalink Integration**: Self-hosted Lavalink node for efficient audio handling.
- **Backend API**: Go-based REST API for guild and configuration management.
- **Database Persistence**: SQLite database with migrations for reliable data storage.
- **Slash Commands**: Modern Discord interactions with commands like `/play`, and `/stop`.
- **Administration Panel**: Backend endpoints for managing bot settings per guild.

## Installation

### Prerequisites

- Node.js (v18 or higher)
- Go (v1.25 or higher)
- Lavalink server (download from [https://github.com/lavalink-devs/Lavalink/releases](https://github.com/lavalink-devs/Lavalink/releases))

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install Go dependencies:
   ```bash
   go mod tidy
   ```

3. Build the backend (optional):
   ```bash
   go build ./cmd/api
   ```

### Bot Setup

1. Navigate to the `bot` directory:
   ```bash
   cd bot
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Build the bot:
   ```bash
   npm run build
   ```

### Lavalink Setup

1. Download the latest Lavalink JAR from the [releases page](https://github.com/lavalink-devs/Lavalink/releases).
2. Create a `application.yml` configuration file for Lavalink (see Lavalink documentation for details).
3. Run Lavalink:
   ```bash
   java -jar Lavalink.jar
   ```

## Configuration

Create a `.env` file in the root directory (or in the respective `bot` and `backend` directories if preferred). The following environment variables are required:

### Bot Configuration

- `DISCORD_TOKEN`: Your Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications).
- `DISCORD_APP_ID`: Your Discord application ID.
- `DISCORD_BOT_NAME`: The name of your bot (optional, used for Lavalink client).
- `BACKEND_URL`: URL of the backend API (default: `http://localhost:8080`).
- `BACKEND_CONFIG_TTL_MS`: Cache TTL for backend configurations (optional).
- `LAVALINK_HOST`: Host of your Lavalink server (default: localhost).
- `LAVALINK_PORT`: Port of your Lavalink server (default: 2333).
- `LAVALINK_PASSWORD`: Password for Lavalink authentication.
- `LAVALINK_ID`: ID for the Lavalink node (optional).
- `LOG_LEVEL`: Logging level (e.g., info, debug; default: info).
- `LOG_SILENT`: Set to true to disable logging (optional).

### Backend Configuration

The backend uses a SQLite database (`database.db`) and applies migrations automatically. No additional configuration is required beyond ensuring the database file is writable.

## Usage

### Running the Backend

From the `backend` directory:

```bash
go run ./cmd/api
```

The backend will start on `http://localhost:8080` and apply database migrations.

### Running the Bot

From the `bot` directory:

```bash
npm start
```

Or for development:

```bash
npm run dev
```

### Lavalink

Ensure Lavalink is running before starting the bot. The bot will connect to Lavalink for audio playback.

### Example Usage

1. Invite the bot to your Discord server using the OAuth2 URL from the Developer Portal.
2. Use `/ping` to test the bot.
3. Use `/play <url>` to play music from a URL.
4. Use `/stop` to stop playback and clear the queue.

The backend API can be used for administrative tasks, such as managing guild configurations via endpoints like `/guilds` and `/guilds/{id}/config`.