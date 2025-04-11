const { 
    Client, 
    GatewayIntentBits, 
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle 
} = require('discord.js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Import commands
const checkCommand = require('./commands/check');
const leaderboardCommand = require('./commands/leaderboard');
const questCommand = require('./commands/quest');
const statsCommand = require('./commands/stats');
const oracleCommand = require('./commands/oracle');
const gameCommand = require('./commands/game');

// Create client instance with all necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Command registration
client.once(Events.ClientReady, async () => {
    console.log(`🚀 Logged in as ${client.user.tag}`);
    
    try {
        const commands = await client.application.commands.set([
            checkCommand.data,
            leaderboardCommand.data,
            questCommand.data,
            statsCommand.data,
            oracleCommand.data,
            gameCommand.data,
            gameCommand.leaderboard.data
        ]);
        console.log('📚 Commands registered:', commands.map(cmd => cmd.name).join(', '));
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
});

// Interaction handler
client.on(Events.InteractionCreate, async interaction => {
    try {
        // Command handling
        if (interaction.isCommand()) {
            console.log('🎮 Command received:', interaction.commandName);
            
            switch (interaction.commandName) {
                case 'check':
                    await checkCommand.execute(interaction);
                    break;
                case 'leaderboard':
                    await leaderboardCommand.execute(interaction);
                    break;
                case 'quest':
                    await questCommand.execute(interaction);
                    break;
                case 'stats':
                    await statsCommand.execute(interaction);
                    break;
                case 'oracle':
                    await oracleCommand.execute(interaction);
                    break;
                case 'game':
                    await gameCommand.execute(interaction);
                    break;
                case 'scores':
                    await gameCommand.leaderboard.execute(interaction);
                    break;
                default:
                    console.log('❓ Unknown command:', interaction.commandName);
            }
        }

        // Button handling
        if (interaction.isButton()) {
            console.log('🔘 Button interaction:', interaction.customId);
            
            const buttonHandlers = {
                // Stats buttons
                'refresh_stats': statsCommand.handleRefresh,
                'stats_help': statsCommand.handleHelp,
                
                // Quest buttons
                'quest_progress': questCommand.handleQuestProgress,
                'quest_abandon': questCommand.handleQuestAbandon,
                
                // Leaderboard buttons
                'refresh_leaderboard': leaderboardCommand.handleRefresh,
                'refresh_scores': async (interaction) => {
                    await gameCommand.leaderboard.execute(interaction);
                }
            };

            const handler = buttonHandlers[interaction.customId];
            if (handler) {
                await handler(interaction);
            } else {
                console.log('❌ Unknown button interaction:', interaction.customId);
                await interaction.reply({
                    content: '⚠️ This button action is not available.',
                    ephemeral: true
                });
            }
        }

        // Select menu handling
        if (interaction.isStringSelectMenu()) {
            console.log('📝 Select menu interaction:', interaction.customId);
            
            switch (interaction.customId) {
                case 'quest_select':
                    await questCommand.handleQuestSelect(interaction);
                    break;
                default:
                    console.log('❌ Unknown select menu:', interaction.customId);
                    await interaction.reply({
                        content: '⚠️ This menu action is not available.',
                        ephemeral: true
                    });
            }
        }

    } catch (error) {
        console.error('❌ Error handling interaction:', error);
        console.error('Error details:', {
            type: error.name,
            message: error.message,
            stack: error.stack
        });

        try {
            const errorMessage = '⚠️ An error occurred while processing your request.';
            if (interaction.deferred) {
                await interaction.editReply({ 
                    content: errorMessage,
                    components: []
                });
            } else {
                await interaction.reply({ 
                    content: errorMessage,
                    ephemeral: true
                });
            }
        } catch (followUpError) {
            console.error('❌ Error sending error message:', followUpError);
        }
    }
});

// Message event handler for Oracle riddles
client.on(Events.MessageCreate, async message => {
    try {
        // Ignore bot messages
        if (message.author.bot) return;

        // Check if message is in oracle channel
        if (message.channel.name === 'oracle-channel') {
            console.log('🔮 Oracle answer attempt from:', message.author.username);
            await oracleCommand.handleAnswer(message);
        }
    } catch (error) {
        console.error('❌ Error handling message:', error);
        try {
            await message.reply('⚠️ An error occurred while processing your answer.');
        } catch (replyError) {
            console.error('❌ Error sending error message:', replyError);
        }
    }
});

// Error handlers
process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
    console.error('Rejection details:', {
        type: error.name,
        message: error.message,
        stack: error.stack
    });
});

client.on('error', error => {
    console.error('❌ Discord client error:', error);
    console.error('Client error details:', {
        type: error.name,
        message: error.message,
        stack: error.stack
    });
});

// Debug events
client.on('debug', info => {
    if (!info.includes('Heartbeat')) {
        console.log('🔍 Debug:', info);
    }
});

client.on('warn', warning => {
    console.warn('⚠️ Warning:', warning);
});

// Start the bot
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('✅ Bot logged in successfully');
        console.log('📚 Available commands:', client.application?.commands.cache.map(cmd => cmd.name).join(', '));
        console.log('🤖 Bot is ready to serve!');
    })
    .catch(error => {
        console.error('❌ Failed to login:', error);
        process.exit(1);
    });