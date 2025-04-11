const { EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { playerCache, activeQuestCache } = require('../utils/cache');

// Quest data
const QUESTS = [
    {
        id: 'forest_patrol',
        name: '🌲 Forest Patrol',
        difficulty: '🟢 Easy',
        timeRequired: 300, // 5 minutes
        expReward: 100,
        flavorText: 'Patrol the enchanted forest for any signs of trouble. Watch for mischievous pixies!'
    },
    {
        id: 'mountain_climb',
        name: '⛰️ Mountain Climb',
        difficulty: '🟡 Medium',
        timeRequired: 600, // 10 minutes
        expReward: 250,
        flavorText: 'Scale the treacherous peaks of the Misty Mountains. Beware of frost giants!'
    },
    {
        id: 'dragon_hunt',
        name: '🐉 Dragon Hunt',
        difficulty: '🔴 Hard',
        timeRequired: 1200, // 20 minutes
        expReward: 500,
        flavorText: 'Track down and face the mighty dragon terrorizing the kingdom. Glory awaits!'
    }
];

// Helper function to create progress bar
function createProgressBar(percent) {
    const filled = Math.floor(percent / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent}%`;
}

// Helper function to get player data
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

// Helper function to create quest selection menu
function createQuestMenu() {
    return new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setCustomId('quest_select')
                .setPlaceholder('🗺️ Choose your quest')
                .addOptions(
                    QUESTS.map(quest => ({
                        label: quest.name,
                        description: `${quest.difficulty} • ${quest.timeRequired / 60}m • ${quest.expReward} EXP`,
                        value: quest.id,
                        emoji: quest.id === 'forest_patrol' ? '🌲' : 
                               quest.id === 'mountain_climb' ? '⛰️' : '🐉'
                    }))
                )
        );
}

// Helper function to create quest buttons
function createQuestButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('quest_progress')
                .setLabel('📊 Check Progress')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('quest_abandon')
                .setLabel('❌ Abandon Quest')
                .setStyle(ButtonStyle.Danger)
        );
}

// Function to calculate exp for level
function getExpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Quest progress handler
async function handleQuestProgress(interaction) {
    try {
        const activeQuest = activeQuestCache.get(interaction.user.id);
        if (!activeQuest) {
            await interaction.reply({
                content: '⚠️ You are not currently on a quest.',
                ephemeral: true
            });
            return;
        }

        const quest = QUESTS.find(q => q.id === activeQuest.questId);
        const timeLeft = Math.ceil((activeQuest.endTime - Date.now()) / 1000);
        const totalTime = quest.timeRequired;
        const progress = ((totalTime - timeLeft) / totalTime) * 100;

        const embed = new EmbedBuilder()
            .setTitle(`${quest.name} Progress`)
            .setColor('#9B59B6')
            .addFields(
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
                    name: '📊 Quest Progress', 
                    value: `\`${createProgressBar(Math.min(100, progress))}\``, 
                    inline: false 
                }
            )
            .setFooter({ text: '🎮 Adventure Quest System v2.0' });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    } catch (error) {
        console.error('❌ Error checking quest progress:', error);
        await interaction.reply({
            content: '⚠️ An error occurred while checking quest progress.',
            ephemeral: true
        });
    }
}

// Quest abandon handler
async function handleQuestAbandon(interaction) {
    try {
        const activeQuest = activeQuestCache.get(interaction.user.id);
        if (!activeQuest) {
            await interaction.reply({
                content: '⚠️ You are not currently on a quest.',
                ephemeral: true
            });
            return;
        }

        const quest = QUESTS.find(q => q.id === activeQuest.questId);
        const player = getPlayerData(interaction.user.id, interaction.user.username);
        
        // Calculate time spent on quest
        const timeSpent = Math.floor((Date.now() - activeQuest.startTime) / 1000);
        const totalTime = quest.timeRequired;
        const progressPercent = Math.min(100, Math.floor((timeSpent / totalTime) * 100));
        
        // Remove the quest from active quests
        activeQuestCache.del(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle('❌ Quest Abandoned')
            .setDescription(`You have abandoned: **${quest.name}**`)
            .setColor('#FF0000')
            .addFields(
                { 
                    name: '⏳ Time Invested', 
                    value: `\`${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s\``, 
                    inline: true 
                },
                { 
                    name: '📊 Progress Lost', 
                    value: `\`${progressPercent}%\``, 
                    inline: true 
                },
                { 
                    name: '✨ Potential EXP Lost', 
                    value: `\`${quest.expReward} EXP\``, 
                    inline: true 
                },
                { 
                    name: '⚠️ Notice', 
                    value: 'All progress and potential rewards have been forfeited.', 
                    inline: false 
                }
            )
            .setFooter({ text: '💡 Use /quest to start a new adventure!' });

        // Clear any pending quest completion timeouts
        if (activeQuest.timeoutId) {
            clearTimeout(activeQuest.timeoutId);
        }

        // Update player stats to show quest was abandoned
        player.lastQuest = {
            questId: quest.id,
            status: 'abandoned',
            timestamp: new Date().toISOString()
        };
        playerCache.set(player.userId, player);

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Error abandoning quest:', error);
        await interaction.reply({
            content: '⚠️ An error occurred while abandoning the quest.',
            ephemeral: true
        });
    }
}

// Quest selection handler
async function handleQuestSelect(interaction) {
    try {
        const selectedQuestId = interaction.values[0];
        const quest = QUESTS.find(q => q.id === selectedQuestId);
        
        if (!quest) {
            await interaction.reply({
                content: '⚠️ Invalid quest selected.',
                ephemeral: true
            });
            return;
        }

        const player = getPlayerData(interaction.user.id, interaction.user.username);
        
        // Check if player is already on a quest
        const existingQuest = activeQuestCache.get(interaction.user.id);
        if (existingQuest) {
            await interaction.reply({
                content: '⚠️ You are already on a quest! Complete or abandon it first.',
                ephemeral: true
            });
            return;
        }
        
        // Start the quest
        const questData = {
            questId: quest.id,
            startTime: Date.now(),
            endTime: Date.now() + (quest.timeRequired * 1000)
        };

        // Set up quest completion
        const timeoutId = setTimeout(async () => {
            try {
                const player = getPlayerData(interaction.user.id, interaction.user.username);
                
                // Only complete the quest if it hasn't been abandoned
                const currentQuest = activeQuestCache.get(interaction.user.id);
                if (currentQuest && currentQuest.questId === quest.id) {
                    // Update player stats
                    player.exp += quest.expReward;
                    player.questsCompleted += 1;
                    player.lastQuest = {
                        questId: quest.id,
                        status: 'completed',
                        timestamp: new Date().toISOString()
                    };
                    
                    // Check for level up
                    while (player.exp >= getExpForLevel(player.level + 1)) {
                        player.level += 1;
                    }
                    
                    playerCache.set(interaction.user.id, player);
                    activeQuestCache.del(interaction.user.id);

                    // Send completion message
                    try {
                        await interaction.channel.send({
                            content: `<@${interaction.user.id}>`,
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('🎉 Quest Completed!')
                                    .setDescription(`**${quest.name}** completed successfully!`)
                                    .setColor('#2ECC71')
                                    .addFields(
                                        { name: '✨ EXP Gained', value: `\`${quest.expReward} EXP\``, inline: true },
                                        { name: '📈 Current Level', value: `\`${player.level}\``, inline: true },
                                        { name: '🎯 Total EXP', value: `\`${player.exp} EXP\``, inline: true }
                                    )
                                    .setFooter({ text: '🎮 Adventure Quest System v2.0' })
                            ]
                        });
                    } catch (error) {
                        console.error('❌ Error sending completion message:', error);
                    }
                }
            } catch (error) {
                console.error('❌ Error completing quest:', error);
            }
        }, quest.timeRequired * 1000);

        // Store the timeout ID with the quest data
        questData.timeoutId = timeoutId;
        activeQuestCache.set(interaction.user.id, questData);

        const embed = new EmbedBuilder()
            .setTitle(`${quest.name} Started!`)
            .setDescription(quest.flavorText)
            .setColor('#9B59B6')
            .addFields(
                { name: '⚔️ Difficulty', value: quest.difficulty, inline: true },
                { name: '⏳ Duration', value: `\`${quest.timeRequired / 60} minutes\``, inline: true },
                { name: '✨ Reward', value: `\`${quest.expReward} EXP\``, inline: true }
            )
            .setFooter({ text: `🎮 Adventurer: ${player.username}` });

        await interaction.update({
            embeds: [embed],
            components: [createQuestButtons()]
        });

    } catch (error) {
        console.error('❌ Error in quest selection:', error);
        await interaction.reply({
            content: '⚠️ An error occurred while selecting the quest.',
            ephemeral: true
        });
    }
}

module.exports = {
    data: {
        name: 'quest',
        description: '🗺️ Start a new quest adventure',
        default_member_permissions: null,
        dm_permission: true
    },
    QUESTS,
    async execute(interaction) {
        try {
            // Check if player is already on a quest
            const activeQuest = activeQuestCache.get(interaction.user.id);
            if (activeQuest) {
                const quest = QUESTS.find(q => q.id === activeQuest.questId);
                const timeLeft = Math.ceil((activeQuest.endTime - Date.now()) / 1000);
                
                await interaction.reply({
                    content: `⚠️ You are already on a quest: **${quest.name}**\nTime remaining: \`${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s\``,
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🗺️ Available Quests')
                .setDescription('Choose your next adventure!')
                .setColor('#9B59B6')
                .addFields(
                    QUESTS.map(quest => ({
                        name: quest.name,
                        value: `${quest.difficulty} • ⏳ ${quest.timeRequired / 60}m • ✨ ${quest.expReward} EXP\n${quest.flavorText}`,
                        inline: false
                    }))
                )
                .setFooter({ text: '🎮 Adventure Quest System v2.0' });

            await interaction.reply({
                embeds: [embed],
                components: [createQuestMenu()],
                ephemeral: true
            });
        } catch (error) {
            console.error('❌ Error executing quest command:', error);
            await interaction.reply({
                content: '⚠️ An error occurred while loading available quests.',
                ephemeral: true
            });
        }
    },
    handleQuestProgress,
    handleQuestSelect,
    handleQuestAbandon
};