// src/utils/cache.js
const NodeCache = require('node-cache');

// Create caches with specific configurations
const leaderboardCache = new NodeCache({ 
    stdTTL: 24 * 3600,  // 24 hours
    checkperiod: 600,    // Check for expired keys every 10 minutes
    useClones: false,
    errorOnMissing: true
});

const playerCache = new NodeCache({ 
    stdTTL: 0,          // No expiration
    useClones: false,
    errorOnMissing: true
});

const activeQuestCache = new NodeCache({ 
    stdTTL: 3600,       // 1 hour
    checkperiod: 300,   // Check every 5 minutes
    useClones: false,
    errorOnMissing: true
});

// Add debug and error handling methods
const debugCache = {
    leaderboardCache,
    
    setWallet(wallet, data) {
        try {
            console.log('📝 Setting wallet in cache:', { wallet, data });
            const result = leaderboardCache.set(wallet, data);
            console.log('💾 Cache updated:', {
                success: result,
                keys: leaderboardCache.keys(),
                stats: leaderboardCache.getStats()
            });
            return result;
        } catch (error) {
            console.error('❌ Error setting wallet in cache:', error);
            return false;
        }
    },

    getWallets() {
        try {
            const keys = leaderboardCache.keys();
            const wallets = keys.map(key => leaderboardCache.get(key));
            console.log('📊 Retrieved wallets from cache:', {
                totalKeys: keys.length,
                wallets: wallets
            });
            return wallets;
        } catch (error) {
            console.error('❌ Error getting wallets from cache:', error);
            return [];
        }
    }
};

// Export caches with debug wrapper
module.exports = {
    leaderboardCache: debugCache,
    playerCache,
    activeQuestCache
};