const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    MessageFlags,
} = require('discord.js');
const { WebSocketServer } = require('ws');

// config
const TOKEN      = 'token_token';       // bot token
const CLIENT_ID  = '_client_ID_';       // Application ID 
const SECRET_KEY = '_secret_key_'; // Secret key (must same in the lua code roblox_bridge.lua)
const WS_PORT    = 8080;
// =====================================

// ---------- WebSocket Server ----------
const wss = new WebSocketServer({ port: WS_PORT });
const robloxClients = new Set();

wss.on('connection', (ws) => {
    console.log('[WS] connection found. waiting for authentication.');

    ws.on('message', (raw) => {
        const text = raw.toString();
        console.log('[WS] message from client:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('[WS] Json not valid:', e.message);
            return;
        }

        if (data.type === 'auth') {
            if (data.secret === SECRET_KEY) {
                robloxClients.add(ws);
                ws.isAuthenticated = true;
                console.log('[WS] The Roblox client has been successfully authenticated.');
                ws.send(JSON.stringify({ type: 'auth_ok' }));
            } else {
                console.warn('[WS] Incorrect secret key. Connection rejected.');
                ws.close(1008, 'Unauthorized');
            }
        }
    });

    ws.on('close', () => {
        robloxClients.delete(ws);
        console.log('[WS] The Roblox client has disconnected.');
    });

    ws.on('error', (err) => {
        console.error('[WS] Client error:', err.message);
    });
});

console.log(`WebSocket server is running on ws://localhost:${WS_PORT}`);

// Discord Bot 
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('print')
        .setDescription('Printing a message to the Roblox console')
        .addStringOption((opt) =>
            opt.setName('message')
                .setDescription('Text to be printed')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('execute')
        .setDescription('Running Lua code in Roblox')
        .addStringOption((opt) =>
            opt.setName('script')
                .setDescription('Lua code to be executed')
                .setRequired(true)
        ),
].map((c) => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Updating slash commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Slash commands have been successfully registered.');
    } catch (err) {
        console.error('Failed to register slash commands:', err);
    }
})();

function broadcastToRoblox(payload) {
    let sent = 0;
    for (const ws of robloxClients) {
        if (ws.isAuthenticated && ws.readyState === 1) {
            ws.send(JSON.stringify(payload));
            sent++;
        }
    }
    return sent;
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'print') {
        const pesan = options.getString('pesan');
        const n = broadcastToRoblox({ type: 'print', content: pesan });
        if (n > 0) {
            await interaction.reply(`✅ The print command has been sent to **${n}** Roblox clients.`);
        } else {
            await interaction.reply({
                content: '❌ No Roblox client is connected.',
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    if (commandName === 'execute') {
        const code = options.getString('script');
        const n = broadcastToRoblox({ type: 'execute', code });
        if (n > 0) {
            await interaction.reply(`⚡ The execute command was sent to **${n}** Roblox clients.`);
        } else {
            await interaction.reply({
                content: '❌ No Roblox client is connected.',
                flags: MessageFlags.Ephemeral,
            });
        }
    }
});

client.once('clientReady', () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});

client.login(TOKEN);