/**
 * API utilities for the frontend
 * This file contains functions to interact with the Express API server
 */

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://express-js-server-production.up.railway.app';

/**
 * Fetch gems data for a specific wallet
 * @param {string} walletAddress - The wallet address to check
 * @returns {Promise<Object>} - The gems data
 */
export const fetchGemsData = async (walletAddress) => {
  try {
    const response = await fetch(`${API_URL}/gems/${walletAddress}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching gems data:', error);
    throw error;
  }
};

/**
 * Fetch leaderboard data
 * @param {number} limit - The number of entries to fetch (default: 10)
 * @returns {Promise<Object>} - The leaderboard data
 */
export const fetchLeaderboard = async (limit = 10) => {
  try {
    const response = await fetch(`${API_URL}/leaderboard?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

/**
 * Fetch game configuration
 * @param {string} userId - Optional user ID for session tracking
 * @returns {Promise<Object>} - Game configuration data
 */
export const fetchGameConfig = async (userId) => {
  try {
    const url = userId ? `${API_URL}/game?userId=${userId}` : `${API_URL}/game`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game config:', error);
    throw error;
  }
};

/**
 * Fetch quest configuration
 * @returns {Promise<Object>} - The quest configuration data
 */
export const fetchQuestConfig = async () => {
  try {
    const response = await fetch(`${API_URL}/quest-config`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching quest config:', error);
    throw error;
  }
};

/**
 * Update quest configuration
 * @param {Object} config - The new quest configuration
 * @returns {Promise<Object>} - The updated configuration
 */
export const updateQuestConfig = async (config) => {
  try {
    const response = await fetch(`${API_URL}/quest-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating quest config:', error);
    throw error;
  }
};

/**
 * Send a message to the API
 * @param {string} message - The message to send
 * @returns {Promise<Object>} - The API response
 */
export const sendMessage = async (message) => {
  try {
    const response = await fetch(`${API_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Check API health
 * @returns {Promise<Object>} - The health status
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
}; 