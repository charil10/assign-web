import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import StakingForm from './StakingForm';
import StakingInfo from './StakingInfo';
import ContractStats from './ContractStats';

const InterfaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #dee2e6;
`;

const AccountInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const RefreshButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  margin-right: 10px;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AccountAddress = styled.div`
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #495057;
  border: 1px solid #dee2e6;
`;

const DisconnectButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #c82333;
  }
`;

const MainSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StakingInterface = ({ account, contracts, onDisconnect }) => {
  const [stakingInfo, setStakingInfo] = useState(null);
  const [contractStats, setContractStats] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load staking info
      const stakingData = await contracts.stakingContract.getStakingInfo(account);
      setStakingInfo({
        stakedAmount: ethers.utils.formatEther(stakingData.stakedAmount),
        pendingRewards: ethers.utils.formatEther(stakingData.pendingRewards),
        stakingStartTime: new Date(stakingData.stakingStartTime * 1000),
        isStaking: stakingData.isStaking
      });

      // Load contract stats
      const stats = await contracts.stakingContract.getContractStats();
      setContractStats({
        totalStaked: ethers.utils.formatEther(stats.totalStaked),
        totalRewardsDistributed: ethers.utils.formatEther(stats.totalRewardsDistributed),
        contractBalance: ethers.utils.formatEther(stats.contractBalance)
      });

      // Load token balance
      const balance = await contracts.mockToken.balanceOf(account);
      setTokenBalance(ethers.utils.formatEther(balance));

      // Update last updated timestamp
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load staking data', 'error');
    } finally {
      setLoading(false);
    }
  }, [contracts, account]);

  useEffect(() => {
    if (contracts) {
      loadData();
      // No more auto-reload - only refresh on initial load and after transactions
    }
  }, [contracts, account, loadData]);

  const showToast = (message, type = 'info') => {
    const toastOptions = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };
    
    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      default:
        toast.info(message, toastOptions);
    }
  };

  const handleStake = async (amount) => {
    try {
      // Frontend validation before transaction
      if (!amount || parseFloat(amount) <= 0) {
        showToast('Invalid stake amount', 'error');
        return;
      }

      if (parseFloat(amount) < 100) {
        showToast('Minimum stake amount is 100 tokens', 'error');
        return;
      }

      if (parseFloat(amount) > 1000000) {
        showToast('Maximum stake amount is 1,000,000 tokens', 'error');
        return;
      }

      if (parseFloat(amount) > parseFloat(tokenBalance)) {
        showToast('Insufficient token balance', 'error');
        return;
      }

      setLoading(true);

      const amountWei = ethers.utils.parseEther(amount);
      
      // First approve the staking contract to spend tokens
      showToast('Approving tokens...', 'info');
      const approveTx = await contracts.mockToken.approve(contracts.stakingContract.address, amountWei);
      await approveTx.wait();
      
      // Then stake the tokens
      showToast('Staking tokens...', 'info');
      const stakeTx = await contracts.stakingContract.stake(amountWei);
      await stakeTx.wait();
      
      showToast('Successfully staked tokens!', 'success');
      await loadData();
      
    } catch (error) {
      console.error('Error staking:', error);
      if (error.code === 4001) {
        showToast('Transaction rejected by user', 'warning');
      } else if (error.message.includes('insufficient funds')) {
        showToast('Insufficient BNB for gas fees', 'error');
      } else if (error.message.includes('execution reverted')) {
        showToast('Staking failed - check contract conditions', 'error');
      } else {
        showToast('Failed to stake tokens', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (amount) => {
    try {
      // Frontend validation before transaction
      if (!amount || parseFloat(amount) <= 0) {
        showToast('Invalid unstake amount', 'error');
        return;
      }

      if (parseFloat(amount) < 50) {
        showToast('Minimum unstake amount is 50 tokens', 'error');
        return;
      }

      if (!stakingInfo || !stakingInfo.isStaking) {
        showToast('You are not currently staking', 'error');
        return;
      }

      if (parseFloat(amount) > parseFloat(stakingInfo.stakedAmount)) {
        showToast('Cannot unstake more than staked amount', 'error');
        return;
      }

      setLoading(true);

      const amountWei = ethers.utils.parseEther(amount);
      showToast('Unstaking tokens...', 'info');
      const tx = await contracts.stakingContract.unstake(amountWei);
      await tx.wait();
      
      showToast('Successfully unstaked tokens!', 'success');
      await loadData();
      
    } catch (error) {
      console.error('Error unstaking:', error);
      if (error.code === 4001) {
        showToast('Transaction rejected by user', 'warning');
      } else if (error.message.includes('insufficient funds')) {
        showToast('Insufficient BNB for gas fees', 'error');
      } else if (error.message.includes('execution reverted')) {
        showToast('Unstaking failed - check contract conditions', 'error');
      } else {
        showToast('Failed to unstake tokens', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      // Frontend validation before transaction
      if (!stakingInfo || !stakingInfo.isStaking) {
        showToast('You must be staking to claim rewards', 'error');
        return;
      }

      // Note: Smart contract calculates rewards on-demand, so we don't validate amount here
      // The contract will handle the actual reward calculation and distribution

      setLoading(true);

      showToast('Claiming rewards...', 'info');
      const tx = await contracts.stakingContract.claimRewards();
      await tx.wait();
      
      showToast('Successfully claimed rewards!', 'success');
      await loadData();
      
    } catch (error) {
      console.error('Error claiming rewards:', error);
      if (error.code === 4001) {
        showToast('Transaction rejected by user', 'warning');
      } else if (error.message.includes('insufficient funds')) {
        showToast('Insufficient BNB for gas fees', 'error');
      } else if (error.message.includes('execution reverted')) {
        showToast('Claim failed - check contract conditions', 'error');
      } else {
        showToast('Failed to claim rewards', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckRewards = async () => {
    try {
      if (!stakingInfo || !stakingInfo.isStaking) {
        showToast('You must be staking to check rewards', 'error');
        return;
      }

      setLoading(true);
      showToast('Checking current rewards...', 'info');
      
      // Refresh data to get latest reward estimates
      await loadData();
      
      showToast('Rewards checked successfully!', 'success');
      
    } catch (error) {
      console.error('Error checking rewards:', error);
      showToast('Failed to check rewards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await loadData();
      showToast('Data refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Failed to refresh data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <InterfaceContainer>
      <HeaderSection>
        <AccountInfo>
          <h2>Welcome!</h2>
          <AccountAddress>{formatAddress(account)}</AccountAddress>
          {lastUpdated && (
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </AccountInfo>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <RefreshButton onClick={handleRefresh} disabled={loading}>
            {loading ? '🔄' : ' Refresh'}
          </RefreshButton>
          <DisconnectButton onClick={onDisconnect}>
            Disconnect
          </DisconnectButton>
        </div>
      </HeaderSection>

      <MainSection>
        <div>
          <StakingForm
            onStake={handleStake}
            onUnstake={handleUnstake}
            onClaimRewards={handleClaimRewards}
            onCheckRewards={handleCheckRewards}
            stakingInfo={stakingInfo}
            tokenBalance={tokenBalance}
            loading={loading}
          />
        </div>
        
        <div>
          <StakingInfo
            stakingInfo={stakingInfo}
            tokenBalance={tokenBalance}
            loading={loading}
          />
          
          <ContractStats
            contractStats={contractStats}
            loading={loading}
          />
        </div>
      </MainSection>

    </InterfaceContainer>
  );
};

export default StakingInterface;
