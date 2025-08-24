import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StakingInterface from './components/StakingInterface';
import WalletConnect from './components/WalletConnect';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './config/contracts';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  color: #212529;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 10px 0;
  color: #6c757d;
`;

const MainContent = styled.main`
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;


function App() {
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contract addresses from config
  const contractAddresses = CONTRACT_ADDRESSES;

  const initializeContracts = useCallback(async (signer) => {
    try {
      console.log('📜 Starting contract initialization...');
      
      // Validate signer
      if (!signer) {
        throw new Error('Invalid signer provided');
      }

      console.log('✅ Signer object validated');

      // Basic signer validation
      try {
        const signerAddress = await signer.getAddress();
        console.log('✅ Signer address retrieved:', signerAddress);
      } catch (error) {
        console.error('❌ Signer validation failed:', error);
        throw new Error('Signer is not accessible');
      }

      // Validate contract addresses
      console.log('🔍 Validating contract addresses...');
      if (!ethers.utils.isAddress(contractAddresses.stakingContract)) {
        throw new Error('Invalid staking contract address');
      }
      console.log('✅ Staking contract address valid:', contractAddresses.stakingContract);

      if (!ethers.utils.isAddress(contractAddresses.mockToken)) {
        throw new Error('Invalid token contract address');
      }
      console.log('✅ Token contract address valid:', contractAddresses.mockToken);

      // Contract ABIs
      console.log('📋 Creating contract instances...');
      const stakingABI = [
        "function stake(uint256 amount) external",
        "function unstake(uint256 amount) external",
        "function claimRewards() external",
        "function getStakingInfo(address user) external view returns (uint256 stakedAmount, uint256 pendingRewards, uint256 stakingStartTime, bool isStaking)",
        "function getContractStats() external view returns (uint256 totalStaked, uint256 totalRewardsDistributed, uint256 contractBalance)"
      ];
      
      const tokenABI = [
        "function balanceOf(address owner) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function transfer(address to, uint256 amount) external returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
      ];
      
      const stakingContract = new ethers.Contract(contractAddresses.stakingContract, stakingABI, signer);
      const mockToken = new ethers.Contract(contractAddresses.mockToken, tokenABI, signer);
      
      console.log('✅ Contract instances created');
      
      // Validate contracts are accessible (with timeout)
      console.log('🔍 Testing contract accessibility...');
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Contract validation timeout')), 10000)
        );
        
        const validationPromise = Promise.all([
          stakingContract.getContractStats(),
          mockToken.balanceOf(await signer.getAddress())
        ]);
        
        const results = await Promise.race([validationPromise, timeoutPromise]);
        console.log('✅ Contract validation successful:', results);
      } catch (error) {
        if (error.message.includes('timeout')) {
          console.error('⏰ Contract validation timeout');
          throw new Error('Contract validation timeout. Please check your network connection.');
        } else {
          console.error('❌ Contract validation failed:', error);
          throw new Error('Contracts are not accessible. Please check if they are deployed correctly.');
        }
      }
      
      console.log('✅ All contracts validated and accessible');
      setContracts({ stakingContract, mockToken });
      
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      let errorMessage = 'Failed to initialize contracts';
      
      if (error.message.includes('Invalid signer')) {
        errorMessage = 'Invalid wallet connection';
      } else if (error.message.includes('Signer is not accessible')) {
        errorMessage = 'Wallet not accessible. Please reconnect.';
      } else if (error.message.includes('Invalid contract address')) {
        errorMessage = 'Invalid contract configuration';
      } else if (error.message.includes('not accessible')) {
        errorMessage = 'Contracts are not accessible. Please check deployment.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Network timeout. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    }
  }, [contractAddresses.stakingContract, contractAddresses.mockToken]);

  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔗 Starting wallet connection...');
      
      // Validate MetaMask installation
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this app.');
      }

      console.log('✅ MetaMask detected');

      // Wait a bit for MetaMask to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Validate MetaMask is unlocked
      let accounts = [];
      try {
        accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log('📋 Available accounts:', accounts);
      } catch (error) {
        console.error('❌ Failed to access accounts:', error);
        throw new Error('Failed to access MetaMask accounts. Please unlock MetaMask.');
      }
      
      if (accounts.length === 0) {
        throw new Error('Please unlock MetaMask and connect an account');
      }
      
      console.log('✅ MetaMask unlocked, accounts available');
      
      // Request account access with retry
      let requestedAccounts = [];
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 Requesting account access (attempt ${retryCount + 1}/${maxRetries})`);
          requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log('✅ Account access granted:', requestedAccounts);
          break;
        } catch (error) {
          retryCount++;
          console.error(`❌ Account access attempt ${retryCount} failed:`, error);
          if (error.code === 4001) {
            throw new Error('User rejected connection');
          }
          if (retryCount >= maxRetries) {
            throw new Error('Failed to request account access. Please try again.');
          }
          console.log(`⏳ Waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const account = requestedAccounts[0];
      
      if (!account) {
        throw new Error('No account selected');
      }

      // Validate account format
      if (!ethers.utils.isAddress(account)) {
        throw new Error('Invalid account address');
      }
      
      console.log('✅ Account validated:', account);
      
      // Check and switch to BSC Testnet if needed
      console.log('🌐 Checking network...');
      await switchToBscTestnet();
      
      // Wait for network switch to complete
      console.log('⏳ Waiting for network switch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create provider and signer
      console.log('🔧 Creating provider and signer...');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Basic signer validation with retry
      let signerValid = false;
      retryCount = 0;
      
      while (retryCount < maxRetries && !signerValid) {
        try {
          console.log(`🔍 Validating signer (attempt ${retryCount + 1}/${maxRetries})`);
          const signerAddress = await signer.getAddress();
          console.log('✅ Signer validated, address:', signerAddress);
          signerValid = true;
        } catch (error) {
          retryCount++;
          console.error(`❌ Signer validation attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) {
            throw new Error('Failed to initialize wallet signer after multiple attempts');
          }
          console.log(`⏳ Waiting before signer retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('✅ Wallet connection successful');
      setAccount(account);
      setIsConnected(true);
      
      // Initialize contracts
      console.log('📜 Initializing contracts...');
      await initializeContracts(signer);
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('🔄 Account changed:', accounts);
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          const newAccount = accounts[0];
          if (ethers.utils.isAddress(newAccount)) {
            setAccount(newAccount);
            initializeContracts(signer);
          } else {
            disconnectWallet();
          }
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId) => {
        console.log('🔄 Chain changed:', chainId);
        if (chainId !== NETWORK_CONFIG.chainId) {
          toast.warning('Network changed. Please switch to BSC Testnet.');
          disconnectWallet();
        }
      });
      
      toast.success('Wallet connected successfully!');
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      let errorMessage = 'Failed to connect wallet';
      
      if (error.code === 4001) {
        errorMessage = 'User rejected connection';
      } else if (error.message.includes('MetaMask is not installed')) {
        errorMessage = 'MetaMask is not installed. Please install MetaMask to use this app.';
      } else if (error.message.includes('unlock MetaMask')) {
        errorMessage = 'Please unlock MetaMask and connect an account';
      } else if (error.message.includes('Failed to access MetaMask accounts')) {
        errorMessage = 'MetaMask access denied. Please unlock and try again.';
      } else if (error.message.includes('No account selected')) {
        errorMessage = 'No account selected in MetaMask';
      } else if (error.message.includes('Invalid account address')) {
        errorMessage = 'Invalid account address format';
      } else if (error.message.includes('Failed to initialize wallet signer')) {
        errorMessage = 'Wallet signer initialization failed. Please try again.';
      } else if (error.message.includes('User rejected connection')) {
        errorMessage = 'Connection was rejected. Please try again.';
      } else if (error.message.includes('Failed to request account access')) {
        errorMessage = 'Account access failed. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [initializeContracts]);

  const switchToBscTestnet = async () => {
    try {
      // Check if we're already on BSC Testnet
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== NETWORK_CONFIG.chainId) {
        // Try to switch to BSC Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: NETWORK_CONFIG.chainId }],
          });
        } catch (switchError) {
          // If the network doesn't exist in MetaMask, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [NETWORK_CONFIG],
              });
            } catch (addError) {
              console.error('Error adding BSC Testnet:', addError);
              throw new Error('Failed to add BSC Testnet to MetaMask. Please add it manually.');
            }
          } else {
            throw new Error('Failed to switch to BSC Testnet. Please switch manually.');
          }
        }
      }
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContracts(null);
    setIsConnected(false);
    setError(null);
    toast.info('Wallet disconnected');
  };

  useEffect(() => {
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
      connectWallet();
    } else {
      setError('MetaMask is not installed. Please install MetaMask to use this app.');
    }
  }, [connectWallet]);

  return (
    <AppContainer>
      <Header>
        <Title>  Staking Platform</Title>
        <Subtitle>Stake your tokens and earn rewards on BSC Testnet</Subtitle>
      </Header>
      
      <MainContent>
        {!isConnected ? (
          <WalletConnect onConnect={connectWallet} isLoading={isLoading} />
        ) : (
          <StakingInterface
            account={account}
            contracts={contracts}
            onDisconnect={disconnectWallet}
          />
        )}
        
        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #f5c6cb',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </MainContent>
      
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AppContainer>
  );
}

export default App;
