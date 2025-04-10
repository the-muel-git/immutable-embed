const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Utility function to format numbers
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

// Function to fetch gems from Immutable API
async function fetchGems(walletAddress) {
    try {
        const response = await axios.get(
            `https://api.immutable.com/v1/rewards/gems/${walletAddress}`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching gems:', error);
        return null;
    }
}

// Create the gems embed
function createGemsEmbed(gemsData, walletAddress) {
    const embed = new EmbedBuilder()
        .setTitle('💎 Immutable Gems Status')
        .setColor('#00AAFF')
        .setTimestamp();

    if (gemsData) {
        embed
            .setDescription(`**Wallet Address**\n\`${walletAddress}\``)
            .addFields(
                { 
                    name: '💰 Total Gems', 
                    value: formatNumber(gemsData.total || 0), 
                    inline: false 
                },
                { 
                    name: '✅ Available', 
                    value: formatNumber(gemsData.available || 0), 
                    inline: true 
                },
                { 
                    name: '🔒 Locked', 
                    value: formatNumber(gemsData.locked || 0), 
                    inline: true 
                }
            )
            .setFooter({ 
                text: 'Last Updated', 
                iconURL: 'https://immutable.com/favicon.ico' 
            });
    } else {
        embed
            .setColor('#FF0000')
            .setDescription('❌ Error fetching gems data. Please verify the wallet address and try again.');
    }

    return embed;
}

// Create interactive buttons
function createButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('refresh')
                .setLabel('Refresh')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('help')
                .setLabel('Help')
                .setEmoji('❓')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('close')
                .setLabel('Close')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );
}

// Bot event handlers
client.once('ready', async () => {
    console.log(`Bot is online as ${client.user.tag}`);
    
    // Register slash command
    try {
        await client.application.commands.create({
            name: 'gems',
            description: 'Check Immutable X gems for a wallet',
            options: [{
                name: 'wallet',
                type: 3,
                description: 'Enter the wallet address',
                required: true
            }]
        });
        console.log('Slash command registered successfully');
    } catch (error) {
        console.error('Error registering slash command:', error);
    }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand() && interaction.commandName === 'gems') {
            const walletAddress = interaction.options.getString('wallet');
            const gemsData = await fetchGems(walletAddress);
            const embed = createGemsEmbed(gemsData, walletAddress);
            await interaction.reply({ 
                embeds: [embed], 
                components: [createButtons()] 
            });
        }

        if (interaction.isButton()) {
            const walletAddress = interaction.message.embeds[0].description
                .split('`')[1];

            switch (interaction.customId) {
                case 'refresh':
                    const newGemsData = await fetchGems(walletAddress);
                    const newEmbed = createGemsEmbed(newGemsData, walletAddress);
                    await interaction.update({ 
                        embeds: [newEmbed], 
                        components: [createButtons()] 
                    });
                    break;

                case 'help':
                    const helpEmbed = new EmbedBuilder()
                        .setTitle('❓ Help Guide')
                        .setColor('#FFA500')
                        .setDescription(
                            '**Commands**\n' +
                            '`/gems <wallet>` - Check gems for a wallet\n\n' +
                            '**Buttons**\n' +
                            '🔄 Refresh - Update gems data\n' +
                            '❓ Help - Show this help message\n' +
                            '❌ Close - Remove the message\n\n' +
                            '**Support**\n' +
                            'For more help, visit [Immutable Support](https://support.immutable.com)'
                        );
                    await interaction.reply({ 
                        embeds: [helpEmbed], 
                        ephemeral: true 
                    });
                    break;

                case 'close':
                    await interaction.message.delete();
                    break;
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply({ 
            content: '❌ An error occurred while processing your request.', 
            ephemeral: true 
        });
    }
});

// Start the bot
client.login(process.env.DISCORD_TOKEN);
