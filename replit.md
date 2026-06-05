# Discord Bot

A Discord bot with AI chat (OpenAI), moderation commands (ban/kick/mute/unmute), auto-role on join, and slash commands.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server + Discord bot (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Discord: discord.js v14
- AI: OpenAI (gpt-4o-mini)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/bot/` — Discord bot source
- `artifacts/api-server/src/bot/commands/` — Slash commands (ban, kick, mute, unmute, help)
- `artifacts/api-server/src/bot/events/` — Event handlers (guildMemberAdd, messageCreate, interactionCreate)
- `artifacts/api-server/src/bot/registry.ts` — Command registry
- `artifacts/api-server/src/bot/deploy-commands.ts` — Slash command registration on startup
- `lib/api-spec/openapi.yaml` — API contract (source of truth)

## Architecture decisions

- Bot runs inside the same Express process (started from `src/index.ts` via `startBot()`)
- Slash commands are deployed to guild (fast, instant) if `DISCORD_GUILD_ID` is set, otherwise globally (takes ~1 hour)
- AI chat: bot responds when mentioned (`@Bot`) or when message starts with `!ai`
- Auto-role: assigned on `guildMemberAdd` event using `AUTOROLE_ROLE_ID`

## Product

- `/ban`, `/kick`, `/mute`, `/unmute` — moderation commands (require appropriate permissions)
- `/help` — lists all commands
- `@Bot` or `!ai <message>` — AI chat powered by GPT-4o-mini
- Auto-role — automatically assigns a role to new members

## Required Secrets

- `DISCORD_BOT_TOKEN` — from Discord Developer Portal → Bot → Reset Token
- `DISCORD_CLIENT_ID` — from Discord Developer Portal → General Information → Application ID
- `DISCORD_GUILD_ID` — Right-click your server → Copy Server ID (optional, but makes commands register instantly)
- `AUTOROLE_ROLE_ID` — Right-click the role → Copy Role ID
- `OPENAI_API_KEY` — from platform.openai.com/api-keys

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Discord bot Privileged Gateway Intents must be enabled: **Server Members Intent** + **Message Content Intent**
- Bot needs `Manage Roles` permission and its role must be ABOVE the auto-role in the role hierarchy
- Slash commands register on bot startup — check logs for confirmation
- If `DISCORD_GUILD_ID` is not set, global commands take up to 1 hour to appear

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
