const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { leaderboardCache } = require('../utils/cache');

function shortenAddress(address) {
    return `${address.substring(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(num) {
    return num?.toLocaleString() || '0';
}

function createLeaderboardEmbed(entries) {
    const embed = new EmbedBuilder()
        .setTitle('🏆 Immutable Gems Leaderboard')
        .setColor('#FFD700')
        .setTimestamp();

    if (entries.length === 0) {
        embed.setDescription('📝 No wallets checked yet. Be the first to use `/check`!');
    } else {
        let description = '**Top Gem Holders**\n\n';
        entries.forEach((holder, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '💎';
            const username = holder.username ? ` (${holder.username})` : '';
            description += `${medal} **${formatNumber(holder.gems)}** gems${username}\n` +
                         `└ \`${shortenAddress(holder.address)}\` • ✨ Daily: ${formatNumber(holder.daily_claimable)}\n`;
        });
        
        const totalGems = entries.reduce((sum, entry) => sum + (entry.gems || 0), 0);
        const avgGems = Math.floor(totalGems / entries.length);
        
        description += `\n**📊 Statistics**\n` +
                      `• Total Wallets: \`${entries.length}\`\n` +
                      `• Total Gems: \`${formatNumber(totalGems)}\`\n` +
                      `• Average Gems: \`${formatNumber(avgGems)}\`\n\n` +
                      `*🔄 Last Updated: ${new Date().toLocaleString()}*`;
        
        embed.setDescription(description);
    }

    return embed;
}

module.exports = {
    data: {
        name: 'leaderboard',
        description: '🏆 Show top gem holders from checked wallets',
        default_member_permissions: null,
        dm_permission: true
    },
    async execute(interaction) {
        await interaction.deferReply();
        
        console.log('📊 Fetching leaderboard data...');
        const allEntries = leaderboardCache.getWallets();
        
        console.log('📝 Processing leaderboard entries:', {
            totalEntries: allEntries.length,
            entries: allEntries
        });
        
        const topHolders = allEntries
            .filter(entry => entry && entry.gems) // Ensure valid entries
            .sort((a, b) => b.gems - a.gems)
            .slice(0, 10);

        const embed = createLeaderboardEmbed(topHolders);

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_leaderboard')
                    .setLabel('🔄 Refresh Rankings')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [buttons]
        });
    },

    async handleRefresh(interaction) {
        try {
            const allEntries = leaderboardCache.getWallets();
            const topHolders = allEntries
                .filter(entry => entry && entry.gems)
                .sort((a, b) => b.gems - a.gems)
                .slice(0, 10);

            const embed = createLeaderboardEmbed(topHolders);

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('refresh_leaderboard')
                        .setLabel('🔄 Refresh Rankings')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.update({
                embeds: [embed],
                components: [buttons]
            });
        } catch (error) {
            console.error('❌ Error refreshing leaderboard:', error);
            await interaction.reply({
                content: '⚠️ An error occurred while refreshing the leaderboard.',
                ephemeral: true
            });
        }
    }
};