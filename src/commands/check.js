const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { leaderboardCache } = require('../utils/cache');

// API configuration
const API_URL = process.env.API_URL || 'https://express-js-server-production.up.railway.app';

module.exports = {
    data: {
        name: 'check',
        description: '💎 Check Immutable gems for a wallet',
        options: [{
            name: 'wallet',
            type: 3,
            description: '🔍 The wallet address to check',
            required: true
        }]
    },
    async execute(interaction) {
        const wallet = interaction.options.getString('wallet');
        await interaction.deferReply();
        
        try {
            console.log('🔍 Checking wallet:', wallet);
            const response = await axios.get(`${API_URL}/gems/${wallet}`);
            const gemsData = response.data.data;
            
            // Store in leaderboard cache with debug logging
            const walletData = {
                address: wallet,
                gems: gemsData.gems,
                username: interaction.user.username,
                lastChecked: new Date().toISOString(),
                daily_claimable: gemsData.daily_gems_claimable
            };
            
            console.log('💾 Storing wallet data:', walletData);
            leaderboardCache.setWallet(wallet, walletData);

            const embed = new EmbedBuilder()
                .setTitle('💎 Immutable Gems Status')
                .setColor('#0099FF')
                .setDescription(`**Wallet Address**\n\`${wallet.slice(0, 6)}...${wallet.slice(-4)}\``)
                .addFields(
                    { 
                        name: '💰 Total Gems', 
                        value: `\`${gemsData.gems?.toLocaleString() || 0}\``,
                        inline: true 
                    },
                    { 
                        name: '✨ Daily Claimable', 
                        value: `\`${gemsData.daily_gems_claimable?.toLocaleString() || 0}\``,
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `🔄 Last Updated: ${new Date().toLocaleString()} • Added to leaderboard` 
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Error in check command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error Checking Gems')
                .setColor('#FF0000')
                .setDescription('Failed to fetch gems data. Please verify the wallet address and try again.')
                .addFields(
                    {
                        name: '⚠️ Error Details',
                        value: 'The API request failed or returned invalid data.',
                        inline: false
                    },
                    {
                        name: '💡 Tip',
                        value: 'Make sure the wallet address is correct and try again in a few moments.',
                        inline: false
                    }
                )
                .setFooter({ text: '🔍 Immutable Gems Checker v2.0' })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};