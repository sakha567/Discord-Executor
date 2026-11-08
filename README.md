# Discord ↔ Roblox Executor Bridge

Control a Roblox executor from Discord using two slash commands: `/print` and `/execute`. Commands are delivered over WebSocket and executed in-game in real time.

## Structure

```
discord-roblox-bridge/
├── index.js              # Discord bot + WebSocket server
├── roblox_bridge.lua     # Script to run in the Roblox executor
├── package.json
└── README.md
```

## Requirements

- [Node.js](https://nodejs.org/) v18 or newer
- A Roblox executor that supports `WebSocket.connect` (e.g. Synapse, Wave, Delta)
- A Discord bot (see **Creating the Bot**)

## Creating the Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Open **Bot** → **Add Bot** → **Reset Token**. Copy the token (it is shown only once).
3. Open **General Information** → copy the **Application ID** (this is the Client ID).
4. Open **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: at minimum `Send Messages`
   - Open the generated URL, pick your server, and click **Authorize**.

## Configuration

Replace the values below in **both files**. `SECRET_KEY` must be **identical** in `index.js` and `roblox_bridge.lua`.

### `index.js`

```javascript
const TOKEN      = 'token_token';
const CLIENT_ID  = '_client_ID_';
const SECRET_KEY = '_secret_key_';
```

| Variable | Source |
|---|---|
| `TOKEN` | Developer Portal → Bot → Reset Token |
| `CLIENT_ID` | Developer Portal → General Information → Application ID |
| `SECRET_KEY` | Your own random long string |

Generate a random `SECRET_KEY`:

```bash
# Linux / macOS
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### `roblox_bridge.lua`

```lua
local WS_URL     = "ws://localhost:8080"
local SECRET_KEY = "_secret_key_"
```

| Variable | Description |
|---|---|
| `WS_URL` | `ws://localhost:8080` if the bot runs on the same machine. Replace `localhost` with the server IP/domain if the bot runs on a VPS. |
| `SECRET_KEY` | Must match the value in `index.js` |

## Install & Run

```bash
# 1. Install dependencies (once)
npm install

# 2. Start the bot
node index.js
```

Expected output:

```
WebSocket server is running on ws://localhost:8080
Updating slash commands...
Slash commands have been successfully registered.
Bot logged in as Yourbot#1234
```

Keep the terminal open. Then run `roblox_bridge.lua` in your Roblox executor.

> Global commands can take up to 1 hour to appear in Discord. For quick testing, register them to a single server: change `Routes.applicationCommands(CLIENT_ID)` to `Routes.applicationGuildCommands(CLIENT_ID, 'YOUR_GUILD_ID')`.

## Usage

In Discord:

```
/print message: hey
```

→ The Roblox executor console prints `hey`.

```
/execute script: print("hello")
```

→ The Lua code is executed in-game.

## Security

`SECRET_KEY` is the only authentication between the Roblox script and the bot server. Anyone who knows it can send execute commands to your Roblox account.

- Do not commit the real value to a public repo. Use `.env` or environment variables, and add `.env` to `.gitignore`.
- If it leaks, change the value in both files and restart the bot and the Roblox script.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Bot is offline | Wrong `TOKEN`, or the token was reset |
| Slash commands don't appear | Global delay (wait up to 1 hour) or Discord cache (press Ctrl+R) |
| Terminal logs `[WS] Incorrect secret key. Connection rejected.` | `SECRET_KEY` differs between the two files |
| Roblox script won't connect | Wrong `WS_URL`, bot not running, or executor lacks `WebSocket.connect` support |

## License

MIT
