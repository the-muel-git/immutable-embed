// src/utils/helpers.js
function getExpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

function createProgressBar(percent) {
    const filled = Math.floor(percent / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent}%`;
}

function shortenAddress(address) {
    return `${address.substring(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(num) {
    return num?.toLocaleString() || '0';
}

function getPlayerData(playerCache, userId, username) {
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

module.exports = {
    getExpForLevel,
    createProgressBar,
    shortenAddress,
    formatNumber,
    getPlayerData
};