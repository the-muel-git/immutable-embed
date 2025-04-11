const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { playerCache } = require('../utils/cache');

// Riddle Database
const RIDDLES = [
    {
        id: 'blockchain_basics',
        question: "I am the foundation of trust without central might,\nBlock by block I grow in height.\nImmutable records I do keep,\nWhat technology makes my promises deep?",
        answer: "blockchain",
        hints: [
            "I'm distributed, not in one place",
            "Each block links to the one before",
            "Once written, my records never change"
        ],
        difficulty: "Easy",
        lore: "Blockchain technology is the backbone of Immutable's gaming ecosystem"
    },
    {
        id: 'smart_contracts',
        question: "In digital realms I make the rules clear,\nSelf-executing when conditions appear.\nNo middleman needed, I'm trustless and true,\nWhat am I that makes promises come through?",
        answer: "smart contracts",
        hints: [
            "I automate agreements",
            "Ethereum made me famous",
            "I'm code that enforces rules"
        ],
        difficulty: "Medium",
        lore: "Smart Contracts power Immutable's gaming transactions and NFT trades"
    },
    {
        id: 'nft_mystery',
        question: "Unique and scarce, in pixels I dwell,\nProof of ownership, I serve well.\nIn games I grant powers divine,\nWhat digital treasure can truly be thine?",
        answer: "nft",
        hints: [
            "I'm non-fungible",
            "I prove digital ownership",
            "Games use me for special items"
        ],
        difficulty: "Easy",
        lore: "NFTs are the foundation of true digital ownership in Immutable games"
    }
];

// Active riddle tracking
let activeRiddle = null;
let riddleParticipants = new Map();

function createRiddleEmbed(riddle, isInitial = true) {
    const embed = new EmbedBuilder()
        .setTitle('🔮 The Oracle\'s Riddle')
        .setColor('#9B59B6')
        .setDescription(
            `*A mystical challenge appears...*\n\n` +
            `**The Riddle:**\n${riddle.question}\n\n` +
            `**Difficulty:** ${riddle.difficulty}\n\n` +
            `*To answer, reply with your guess in this channel*`
        )
        .setFooter({ text: '🎮 Immutable Oracle • Seek the truth' });

    if (!isInitial) {
        embed.addFields({ 
            name: '💭 Current Participants', 
            value: riddleParticipants.size > 0 
                ? Array.from(riddleParticipants.keys()).join('\n')
                : 'No attempts yet',
            inline: false 
        });
    }

    return embed;
}

function createHintEmbed(hint) {
    return new EmbedBuilder()
        .setTitle('💫 Oracle\'s Whisper')
        .setColor('#3498DB')
        .setDescription(`*A mystical hint appears...*\n\n${hint}`)
        .setFooter({ text: '🔮 Let the wisdom guide you' });
}

async function grantOracleSeekerRole(message) {
    try {
        // First check if the role exists
        let role = message.guild.roles.cache.find(r => r.name === "Oracle Seeker");
        
        // If role doesn't exist, try to create it
        if (!role) {
            try {
                role = await message.guild.roles.create({
                    name: "Oracle Seeker",
                    color: "#9B59B6", // Purple color
                    reason: "Role for Oracle riddle solvers",
                    permissions: [] // No special permissions
                });
                console.log('✅ Created Oracle Seeker role');
            } catch (createError) {
                console.error('❌ Failed to create role:', createError);
                throw new Error('Failed to create role');
            }
        }

        // Get the bot's member object
        const botMember = await message.guild.members.fetch(message.client.user.id);
        
        // Check bot's permissions explicitly
        const requiredPermissions = ['ManageRoles'];
        const missingPermissions = requiredPermissions.filter(perm => !botMember.permissions.has(perm));
        
        if (missingPermissions.length > 0) {
            console.error(`❌ Missing permissions: ${missingPermissions.join(', ')}`);
            await message.channel.send({
                content: `⚠️ I need the following permissions: ${missingPermissions.join(', ')}. Please ask a server admin to grant these permissions.`,
                ephemeral: true
            });
            return false;
        }

        // Check role hierarchy
        if (role.position >= botMember.roles.highest.position) {
            console.error('❌ Role hierarchy issue: Bot role must be higher than Oracle Seeker role');
            await message.channel.send({
                content: '⚠️ Please move my role above the "Oracle Seeker" role in server settings.',
                ephemeral: true
            });
            return false;
        }

        // Get the member and add the role
        const member = await message.guild.members.fetch(message.author.id);
        await member.roles.add(role);
        
        console.log(`✅ Successfully granted Oracle Seeker role to ${message.author.username}`);
        return true;

    } catch (error) {
        console.error('❌ Error in role management:', error);
        
        // More detailed error logging
        const errorDetails = {
            guildId: message.guild.id,
            guildName: message.guild.name,
            userId: message.author.id,
            username: message.author.username,
            error: error.message
        };
        console.error('Error details:', errorDetails);

        // Send appropriate error message
        let errorMessage = '⚠️ Failed to grant the role. ';
        if (error.code === 50013) {
            errorMessage += 'I don\'t have permission to manage roles.';
        } else if (error.code === 50028) {
            errorMessage += 'Invalid role.';
        } else {
            errorMessage += 'Please check bot permissions and role hierarchy.';
        }

        await message.channel.send({
            content: errorMessage,
            ephemeral: true
        });
        return false;
    }
}

module.exports = {
    data: {
        name: 'oracle',
        description: '🔮 Start a mystical riddle challenge',
        default_member_permissions: null,
        dm_permission: false
    },
    async execute(interaction) {
        try {
            // Check if there's already an active riddle
            if (activeRiddle) {
                await interaction.reply({
                    content: '⚠️ A riddle is already active in the channel!',
                    ephemeral: true
                });
                return;
            }

            // Select a random riddle
            activeRiddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
            riddleParticipants.clear();

            const embed = createRiddleEmbed(activeRiddle);
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Error starting riddle:', error);
            await interaction.reply({
                content: '⚠️ An error occurred while starting the riddle.',
                ephemeral: true
            });
        }
    },

    async handleAnswer(message) {
        try {
            if (!activeRiddle) {
                await message.reply('⚠️ There is no active riddle to answer!');
                return;
            }

            const answer = message.content.toLowerCase();
            const username = message.author.username;

            // Record participation
            if (!riddleParticipants.has(username)) {
                riddleParticipants.set(username, {
                    attempts: 1
                });
            } else {
                const participant = riddleParticipants.get(username);
                participant.attempts++;
            }

            // Check answer
            if (answer.includes(activeRiddle.answer.toLowerCase())) {
                try {
                    // Try to grant the role
                    const roleGranted = await grantOracleSeekerRole(message);
                    
                    // Create success embed
                    const successEmbed = new EmbedBuilder()
                        .setTitle('🌟 Prophecy Fulfilled!')
                        .setColor('#2ECC71')
                        .setDescription(
                            `**Congratulations, ${username}!**\n\n` +
                            `You have successfully solved the Oracle's riddle!\n\n` +
                            `**The Answer:** ${activeRiddle.answer}\n\n` +
                            `**Lore:** ${activeRiddle.lore}`
                        )
                        .addFields({
                            name: '🏆 Reward',
                            value: roleGranted 
                                ? '✅ You have been granted the "Oracle Seeker" role!'
                                : '❌ Role could not be granted. Please contact a server administrator.',
                            inline: false
                        })
                        .setFooter({ text: '✨ The Oracle acknowledges your wisdom' });

                    await message.channel.send({ embeds: [successEmbed] });

                    // Reset the riddle only if everything was successful
                    activeRiddle = null;
                    riddleParticipants.clear();

                } catch (roleError) {
                    console.error('❌ Error in role granting process:', roleError);
                    await message.channel.send({
                        content: '⚠️ There was an issue granting the role, but your answer was correct!',
                        ephemeral: true
                    });
                }
            } else {
                // Wrong answer
                const participant = riddleParticipants.get(username);
                
                // Give hint every 3 attempts
                if (participant.attempts % 3 === 0 && activeRiddle.hints.length > 0) {
                    const hintIndex = Math.min(
                        Math.floor(participant.attempts / 3) - 1,
                        activeRiddle.hints.length - 1
                    );
                    const hint = activeRiddle.hints[hintIndex];
                    const hintEmbed = createHintEmbed(hint);
                    await message.channel.send({ embeds: [hintEmbed] });
                } else {
                    await message.reply({
                        content: '🤔 That\'s not quite right... Keep trying!',
                        ephemeral: true
                    });
                }
            }

        } catch (error) {
            console.error('❌ Error handling answer:', error);
            await message.reply('⚠️ An error occurred while processing your answer.');
        }
    }
};