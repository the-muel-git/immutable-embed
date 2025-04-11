const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const { playerCache } = require('../utils/cache');

// Game configuration
const GAME_CONFIG = {
    title: "🔴 ImmutaBall",
    description: "Test your skills in this addictive Flappy Bird-style game with a twist! Guide your bouncing ball through obstacles and aim for the highest score.",
    gameUrl: "https://immutaball.vercel.app",
    thumbnailUrl: "https://immutaball.vercel.app/images/immutaball-thumbnail.png",
    sessionParam: "session",
    features: [
        "Simple tap/click controls",
        "Endless arcade gameplay",
        "Real-time score tracking",
        "Global leaderboards"
    ]
};

// Helper function to format high score
function formatScore(score) {
    return score.toString().padStart(5, '0');
}

// Helper function to get player data
function getPlayerData(userId, username) {
    let player = playerCache.get(userId);
    if (!player) {
        player = {
            userId,
            username,
            highScore: 0,
            totalGames: 0,
            lastScore: 0,
            lastPlayed: null
        };
    }
    return player;
}

// Helper function to create game embed
function createGameEmbed(player) {
    const embed = new EmbedBuilder()
        .setTitle(GAME_CONFIG.title)
        .setDescription(GAME_CONFIG.description)
        .setColor('#FF4136')
        .addFields(
            { 
                name: '🎮 How to Play', 
                value: 'Click or tap to make your ball bounce. Avoid the pipes and survive as long as possible!', 
                inline: false 
            }
        );

    if (player && player.highScore > 0) {
        embed.addFields(
            { 
                name: '🏆 Your Best', 
                value: `High Score: ${formatScore(player.highScore)}`, 
                inline: true 
            },
            { 
                name: '📊 Last Game', 
                value: player.lastScore ? `Score: ${formatScore(player.lastScore)}` : 'No games yet', 
                inline: true 
            }
        );
    }

    if (GAME_CONFIG.thumbnailUrl) {
        embed.setThumbnail(GAME_CONFIG.thumbnailUrl);
    }

    return embed;
}

// Helper function to create launcher embed
function createLauncherEmbed() {
    return new EmbedBuilder()
        .setTitle('🔴 Welcome to ImmutaBall!')
        .setDescription(
            '**Ready to Bounce?**\n\n' +
            '🔴 Guide your ball through obstacles\n' +
            '🎯 Test your reflexes\n' +
            '🏆 Set new high scores\n' +
            '📊 Compare with friends\n\n' +
            '*Click the button below to start playing!*'
        )
        .setColor('#FF4136')
        .setThumbnail(GAME_CONFIG.thumbnailUrl)
        .setFooter({ text: '🎮 Click the button below to play!' });
}

// Helper function to create game URL with session
function createGameUrl(userId) {
    const url = new URL(GAME_CONFIG.gameUrl);
    if (userId) {
        const sessionId = `${userId}-${Date.now()}`;
        url.searchParams.append(GAME_CONFIG.sessionParam, sessionId);
    }
    return url.toString();
}

module.exports = {
    data: {
        name: 'game',
        description: '🔴 Play ImmutaBall',
        default_member_permissions: null,
        dm_permission: false
    },

    async execute(interaction) {
        try {
            // Get player data
            const player = getPlayerData(interaction.user.id, interaction.user.username);
            
            // Create game URL with session
            const gameUrl = createGameUrl(interaction.user.id);

            // Create button
            const gameButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('🔴 Play Now')
                        .setStyle(ButtonStyle.Link)
                        .setURL(gameUrl)
                );

            // Send response
            await interaction.reply({
                embeds: [createGameEmbed(player)],
                components: [gameButton]
            });

        } catch (error) {
            console.error('❌ Error launching game:', error);
            await interaction.reply({
                content: '⚠️ An error occurred while launching the game.',
                ephemeral: true
            });
        }
    },

    // Method to update player score
    async updateScore(userId, username, score) {
        try {
            let player = getPlayerData(userId, username);
            
            // Update player stats
            player.totalGames += 1;
            player.lastScore = score;
            player.lastPlayed = new Date();
            
            // Update high score if necessary
            if (score > player.highScore) {
                player.highScore = score;
            }

            // Save updated player data
            playerCache.set(userId, player);
            
            return true;
        } catch (error) {
            console.error('❌ Error updating score:', error);
            return false;
        }
    },

    // Leaderboard functionality
    leaderboard: {
        data: {
            name: 'scores',
            description: '🏆 View ImmutaBall high scores'
        },
        async execute(interaction) {
            try {
                // Get all players from cache and sort by high score
                const players = Array.from(playerCache.keys())
                    .map(key => playerCache.get(key))
                    .filter(player => player && player.highScore > 0)
                    .sort((a, b) => b.highScore - a.highScore)
                    .slice(0, 10);  // Top 10 players

                const embed = new EmbedBuilder()
                    .setTitle('🏆 ImmutaBall Leaderboard')
                    .setColor('#FF4136')
                    .setThumbnail(GAME_CONFIG.thumbnailUrl);

                if (players.length === 0) {
                    embed.setDescription('No scores yet! Be the first to play and set a high score!');
                } else {
                    let description = '**Top Players**\n\n';
                    players.forEach((player, index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔴';
                        description += `${medal} **${player.username}**: ${formatScore(player.highScore)}\n`;
                    });
                    
                    // Add your score if you're not in top 10
                    const currentPlayer = getPlayerData(interaction.user.id, interaction.user.username);
                    if (currentPlayer.highScore > 0 && !players.find(p => p.userId === currentPlayer.userId)) {
                        description += `\n**Your Best Score**\n🔴 ${formatScore(currentPlayer.highScore)}`;
                    }
                    
                    embed.setDescription(description);
                }

                // Add refresh button
                const refreshButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('refresh_scores')
                            .setLabel('🔄 Refresh Scores')
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.reply({
                    embeds: [embed],
                    components: [refreshButton],
                    ephemeral: true
                });
            } catch (error) {
                console.error('❌ Error showing leaderboard:', error);
                await interaction.reply({
                    content: '⚠️ An error occurred while fetching the leaderboard.',
                    ephemeral: true
                });
            }
        }
    }
};