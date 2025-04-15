import { useState } from 'react';
import { fetchGemsData } from '../utils/api';

/**
 * Gems Checker Component
 * Allows users to check gems for a specific wallet address
 */
export default function GemsChecker() {
  const [walletAddress, setWalletAddress] = useState('');
  const [gemsData, setGemsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!walletAddress || walletAddress.trim() === '') {
      setError('Please enter a wallet address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchGemsData(walletAddress);
      setGemsData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch gems data. Please verify the wallet address and try again.');
      setLoading(false);
      console.error('Error:', err);
    }
  };

  return (
    <div className="gems-checker">
      <h2>💎 Immutable Gems Checker</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="wallet-address">Wallet Address</label>
          <input
            id="wallet-address"
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Gems'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {gemsData && (
        <div className="gems-data">
          <h3>Gems Status</h3>
          <div className="data-row">
            <span>Wallet:</span>
            <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          </div>
          <div className="data-row">
            <span>Total Gems:</span>
            <span>{gemsData.gems?.toLocaleString() || 0}</span>
          </div>
          <div className="data-row">
            <span>Daily Claimable:</span>
            <span>{gemsData.daily_claimable?.toLocaleString() || 0}</span>
          </div>
          <div className="data-timestamp">
            Last Updated: {new Date().toLocaleString()}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .gems-checker {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          border-radius: 8px;
          background-color: #f8f9fa;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
          color: #333;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .input-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        button {
          width: 100%;
          padding: 12px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        button:hover {
          background-color: #0051a8;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          margin-top: 15px;
          padding: 10px;
          background-color: #ffebee;
          color: #d32f2f;
          border-radius: 4px;
        }
        
        .gems-data {
          margin-top: 20px;
          padding: 15px;
          background-color: #e3f2fd;
          border-radius: 4px;
        }
        
        .gems-data h3 {
          margin-top: 0;
          color: #0070f3;
        }
        
        .data-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ddd;
        }
        
        .data-timestamp {
          font-size: 12px;
          color: #666;
          text-align: right;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
} 