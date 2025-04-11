const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { playerCache, activeQuestCache } = require('../utils/cache');
const { QUESTS } = require('./quest');

// Helper function to calculate exp for level
function getExpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Helper function to create progress bar
function createProgressBar(percent) {
    const filled = Math.floor(percent / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent}%`;
}

// Get or create player data
function getPlayerData(userId, username) {
    let player = playerCache.get(userId);
    if (!player) {
        player = {
            userId,
            username,
            level: 1,
            exp: 0,
            questsCompleted: 0,
            lastQuest: null
        };
        playerCache.set(userId, player);
    }
    return player;
}

// Create stats embed with active quest information
function createStatsEmbed(player, activeQuest = null) {
    try {
        // For level 1, we only need to reach 100 EXP
        // For level 2+, we need to reach the next level's threshold
        let expNeeded;
        let expProgress;
        
        if (player.level === 1) {
            expNeeded = 100;  // First level needs 100 EXP
            expProgress = player.exp;  // Current progress is just their exp
        } else {
            const currentLevelExp = getExpForLevel(player.level);
            const nextLevelExp = getExpForLevel(player.level + 1);
            expNeeded = nextLevelExp - currentLevelExp;
            expProgress = player.exp - currentLevelExp;
        }
        
        const progress = Math.floor((expProgress / expNeeded) * 100);
        
        const embed = new EmbedBuilder()
            .setTitle(`🎮 ${player.username}'s Adventure Profile`)
            .setColor('#3498DB')
            .addFields(
                { 
                    name: '⚔️ Level', 
                    value: `\`${player.level}\``, 
                    inline: true 
                },
                { 
                    name: '✨ Total Experience', 
                    value: `\`${player.exp} EXP\``, 
                    inline: true 
                },
                { 
                    name: '🎯 Next Level', 
                    value: `\`${expProgress}/${expNeeded} EXP\``, 
                    inline: true 
                },
                { 
                    name: '🗺️ Quests Completed', 
                    value: `\`${player.questsCompleted || 0}\``, 
                    inline: true 
                },
                { 
                    name: '📊 Progress to Level ' + (player.level + 1), 
                    value: `\`${createProgressBar(Math.max(0, Math.min(100, progress)))}\``,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: '🎮 Adventure Stats System v2.0' });

        // Add active quest information if exists
        if (activeQuest) {
            const quest = QUESTS.find(q => q.id === activeQuest.questId);
            if (quest) {
                const timeLeft = Math.ceil((activeQuest.endTime - Date.now()) / 1000);
                const totalTime = quest.timeRequired;
                const questProgress = ((totalTime - timeLeft) / totalTime) * 100;

                embed.addFields(
                    {
                        name: '🎯 Active Quest',
                        value: `**${quest.name}** (\`${quest.difficulty}\`)`,
                        inline: false
                    },
                    {
                        name: '⏳ Time Remaining',
                        value: `\`${Math.max(0, Math.floor(timeLeft / 60))}m ${Math.max(0, timeLeft % 60)}s\``,
                        inline: true
                    },
                    {
                        name: '💎 Reward',
                        value: `\`${quest.expReward} EXP\``,
                        inline: true
                    },
                    {
                        name: '📈 Quest Progress',
                        value: `\`${createProgressBar(Math.min(100, questProgress))}\``,
                        inline: false
                    }
                );
            }
        }

        return embed;
    } catch (error) {
        console.error('❌ Error creating stats embed:', error);
        return new EmbedBuilder()
            .setTitle('❌ Error')
            .setColor('#FF0000')
            .setDescription('An error occurred while creating your stats.');
    }
}

module.exports = {
    data: {
        name: 'stats',
        description: '📊 View your adventure statistics and active quest progress',
        default_member_permissions: null,
        dm_permission: true
    },
    async execute(interaction) {
        try {
            const player = getPlayerData(interaction.user.id, interaction.user.username);
            const activeQuest = activeQuestCache.get(interaction.user.id);
            const embed = createStatsEmbed(player, activeQuest);
            
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('refresh_stats')
                        .setLabel('🔄 Refresh Stats')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stats_help')
                        .setLabel('❓ Help Guide')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({
                embeds: [embed],
                components: [buttons],
                ephemeral: true
            });
        } catch (error) {
            console.error('❌ Error executing stats command:', error);
            await interaction.reply({
                content: '⚠️ An error occurred while fetching your stats.',
                ephemeral: true
            });
        }
    },

    async handleRefresh(interaction) {
        try {
            const player = getPlayerData(interaction.user.id, interaction.user.username);
            const activeQuest = activeQuestCache.get(interaction.user.id);
            const embed = createStatsEmbed(player, activeQuest);
            
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('refresh_stats')
                        .setLabel('🔄 Refresh Stats')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stats_help')
                        .setLabel('❓ Help Guide')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.update({
                embeds: [embed],
                components: [buttons]
            });
        } catch (error) {
            console.error('❌ Error refreshing stats:', error);
            await interaction.reply({
                content: '⚠️ An error occurred while refreshing your stats.',
                ephemeral: true
            });
        }
    },

    async handleHelp(interaction) {
        try {
            const helpEmbed = new EmbedBuilder()
                .setTitle('📚 Adventure Guide')
                .setColor('#FFA500')
                .setDescription(
                    '**Welcome to Your Adventure!**\n\n' +
                    '**📊 Understanding Your Stats**\n' +
                    '⚔️ **Level**: Your current adventure rank\n' +
                    '✨ **Total Experience**: All EXP earned from quests\n' +
                    '🎯 **Next Level**: Progress towards your next rank\n' +
                    '🗺️ **Quests Completed**: Your successful adventures\n' +
                    '📊 **Progress Bar**: Visual journey to next level\n\n' +
                    '**🎯 Experience Guide**\n' +
                    '```\n' +
                    'Level 1: 0-100 EXP\n' +
                    'Level 2: 100-150 EXP\n' +
                    'Level 3: 150-225 EXP\n' +
                    'Level 4: 225-337 EXP\n' +
                    '```\n' +
                    '**🗺️ Available Quests**\n' +
                    QUESTS.map(quest => 
                        `• ${quest.name} (${quest.difficulty})\n  ⏳ ${quest.timeRequired / 60}m • ✨ ${quest.expReward} EXP`
                    ).join('\n') +
                    '\n\n💡 Use `/quest` to begin your next adventure!'
                )
                .setFooter({ text: '🎮 Adventure System v2.0 • Made with ❤️' });

            await interaction.reply({
                embeds: [helpEmbed],
                ephemeral: true
            });
        } catch (error) {
            console.error('❌ Error showing stats help:', error);
            await interaction.reply({
                content: '⚠️ An error occurred while showing the help message.',
                ephemeral: true
            });
        }
    }
};