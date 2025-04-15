import { useEffect, useState } from 'react';
import Head from 'next/head';
import GemsChecker from '../components/GemsChecker';
import { checkApiHealth } from '../utils/api';

export default function Home() {
  const [apiStatus, setApiStatus] = useState({ status: 'unknown', message: 'Checking API status...' });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const health = await checkApiHealth();
        setApiStatus({ 
          status: 'online', 
          message: `API is online (${health.status})` 
        });
      } catch (error) {
        console.error('API health check failed:', error);
        setApiStatus({ 
          status: 'offline', 
          message: 'API is offline or unreachable' 
        });
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Immutable Gems Checker</title>
        <meta name="description" content="Check your Immutable Gems balance" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">Welcome to Immutable Gems Checker</h1>
        
        <div className={`api-status ${apiStatus.status}`}>
          {apiStatus.message}
        </div>

        <GemsChecker />
      </main>

      <footer>
        <p>
          Powered by Express.js on Railway and Next.js on Vercel
        </p>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 800px;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer p {
          display: flex;
          justify-content: center;
          align-items: center;
          color: #666;
        }

        .title {
          margin: 0 0 30px;
          line-height: 1.15;
          font-size: 3rem;
          text-align: center;
        }

        .api-status {
          margin-bottom: 2rem;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .api-status.online {
          background-color: #e6f7e9;
          color: #2e7d32;
        }

        .api-status.offline {
          background-color: #ffebee;
          color: #c62828;
        }

        .api-status.unknown {
          background-color: #fff3e0;
          color: #ef6c00;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
} 