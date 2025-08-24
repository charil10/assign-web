import React from 'react';
import styled from 'styled-components';

const ConnectContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
`;

const ConnectButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #0056b3;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #ffffff40;
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const InfoText = styled.p`
  color: #6c757d;
  margin: 20px 0;
  font-size: 1rem;
`;

const NetworkInfo = styled.div`
  background: #e9ecef;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
`;

const NetworkTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 1rem;
`;

const NetworkDetails = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
`;

const WalletConnect = ({ onConnect, isLoading }) => {
  return (
    <ConnectContainer>
      <h2>Connect Your Wallet</h2>
      <InfoText>
        Connect your MetaMask wallet to start staking tokens and earning rewards
      </InfoText>
      
      <NetworkInfo>
        <NetworkTitle>🌐 Network: BSC Testnet</NetworkTitle>
        <NetworkDetails>
          • Chain ID: 97<br/>
          • RPC: https://data-seed-prebsc-1-s1.binance.org:8545/<br/>
          • Explorer: https://testnet.bscscan.com/
        </NetworkDetails>
      </NetworkInfo>

      <div style={{
        background: '#e3f2fd',
        padding: '15px',
        borderRadius: '8px',
        margin: '20px 0',
        textAlign: 'left',
        border: '1px solid #bbdefb'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>📋 Requirements:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#1976d2' }}>
          <li>MetaMask extension installed and unlocked</li>
          <li>Account with some tBNB for gas fees</li>
          <li>Connected to BSC Testnet (Chain ID: 97)</li>
          <li>Some MockTokens for staking</li>
        </ul>
      </div>
      
      <ConnectButton onClick={onConnect} disabled={isLoading}>
        {isLoading ? (
          <>
            <LoadingSpinner />
            {' '}Connecting...
          </>
        ) : (
          '🔗 Connect MetaMask'
        )}
      </ConnectButton>
      
      <InfoText>
        Make sure you have MetaMask installed and some tBNB for gas fees
      </InfoText>

      <div style={{
        background: '#fff3e0',
        padding: '15px',
        borderRadius: '8px',
        margin: '20px 0',
        textAlign: 'left',
        border: '1px solid #ffcc02'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>⚠️ Important Notes:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#f57c00' }}>
          <li>Minimum stake: 100 tokens</li>
          <li>Minimum unstake: 50 tokens</li>
          <li>Maximum stake: 1,000,000 tokens</li>
          <li>Early unstaking may incur penalties</li>
        </ul>
      </div>
    </ConnectContainer>
  );
};

export default WalletConnect;
