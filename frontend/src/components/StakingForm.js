import React, { useState } from 'react';
import styled from 'styled-components';

const FormContainer = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
`;

const FormTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #495057;
  font-size: 1.1rem;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  &.error {
    border-color: #dc3545;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 5px;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  flex: 1;
  min-width: 120px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StakeButton = styled(Button)`
  background: #28a745;
  color: white;
  
  &:hover:not(:disabled) {
    background: #218838;
  }
`;

const UnstakeButton = styled(Button)`
  background: #ffc107;
  color: #212529;
  
  &:hover:not(:disabled) {
    background: #e0a800;
  }
`;

const ClaimButton = styled(Button)`
  background: #17a2b8;
  color: white;
  
  &:hover:not(:disabled) {
    background: #138496;
  }
`;

const CheckRewardsButton = styled(Button)`
  background: #6f42c1;
  color: white;
  margin-right: 10px;
  
  &:hover:not(:disabled) {
    background: #5a32a3;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff40;
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StakingForm = ({ onStake, onUnstake, onClaimRewards, onCheckRewards, stakingInfo, tokenBalance, loading }) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [stakeError, setStakeError] = useState('');
  const [unstakeError, setUnstakeError] = useState('');

  // Validation functions
  const validateStakeAmount = (amount) => {
    if (!amount || amount === '') {
      return 'Please enter an amount to stake';
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Amount must be a positive number';
    }
    
    if (numAmount < 100) {
      return 'Minimum stake amount is 100 tokens';
    }
    
    if (numAmount > parseFloat(tokenBalance)) {
      return 'Insufficient token balance';
    }
    
    if (numAmount > 1000000) {
      return 'Maximum stake amount is 1,000,000 tokens';
    }
    
    return '';
  };

  const validateUnstakeAmount = (amount) => {
    if (!amount || amount === '') {
      return 'Please enter an amount to unstake';
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Amount must be a positive number';
    }
    
    if (!stakingInfo || !stakingInfo.isStaking) {
      return 'You are not currently staking';
    }
    
    if (numAmount > parseFloat(stakingInfo.stakedAmount)) {
      return 'Cannot unstake more than staked amount';
    }
    
    if (numAmount < 50) {
      return 'Minimum unstake amount is 50 tokens';
    }
    
    return '';
  };

  const handleStakeInputChange = (e) => {
    const value = e.target.value;
    setStakeAmount(value);
    setStakeError(validateStakeAmount(value));
  };

  const handleUnstakeInputChange = (e) => {
    const value = e.target.value;
    setUnstakeAmount(value);
    setUnstakeError(validateUnstakeAmount(value));
  };

  const handleStake = () => {
    const error = validateStakeAmount(stakeAmount);
    if (error) {
      setStakeError(error);
      return;
    }
    
    onStake(stakeAmount);
    setStakeAmount('');
    setStakeError('');
  };

  const handleUnstake = () => {
    const error = validateUnstakeAmount(unstakeAmount);
    if (error) {
      setUnstakeError(error);
      return;
    }
    
    onUnstake(unstakeAmount);
    setUnstakeAmount('');
    setUnstakeError('');
  };

  // Button state validation
  const canStake = stakeAmount && 
    parseFloat(stakeAmount) > 0 && 
    parseFloat(stakeAmount) <= parseFloat(tokenBalance) &&
    parseFloat(stakeAmount) >= 100 &&
    !stakeError;

  const canUnstake = unstakeAmount && 
    parseFloat(unstakeAmount) > 0 && 
    stakingInfo && 
    parseFloat(unstakeAmount) <= parseFloat(stakingInfo.stakedAmount) &&
    parseFloat(unstakeAmount) >= 50 &&
    !unstakeError;

  // Claim button is enabled when user is staking (rewards calculated on-demand by smart contract)
  const canClaim = stakingInfo && stakingInfo.isStaking;

  return (
    <FormContainer>
      <FormTitle>Staking Actions</FormTitle>
      
      <InputGroup>
        <Label>Stake Amount (Available: {parseFloat(tokenBalance).toFixed(2)} tokens)</Label>
        <Input
          type="number"
          placeholder="Enter amount to stake (min: 100)"
          value={stakeAmount}
          onChange={handleStakeInputChange}
          min="100"
          step="1"
          disabled={loading}
          className={stakeError ? 'error' : ''}
        />
        {stakeError && <ErrorMessage>{stakeError}</ErrorMessage>}
      </InputGroup>
      
      <ButtonGroup>
        <StakeButton onClick={handleStake} disabled={!canStake || loading}>
          {loading ? <LoadingSpinner /> : 'Stake'}
        </StakeButton>
      </ButtonGroup>

      <InputGroup>
        <Label>Unstake Amount (Staked: {stakingInfo ? parseFloat(stakingInfo.stakedAmount).toFixed(2) : '0'} tokens)</Label>
        <Input
          type="number"
          placeholder="Enter amount to unstake (min: 50)"
          value={unstakeAmount}
          onChange={handleUnstakeInputChange}
          min="50"
          step="1"
          disabled={loading}
          className={unstakeError ? 'error' : ''}
        />
        {unstakeError && <ErrorMessage>{unstakeError}</ErrorMessage>}
      </InputGroup>
      
      <ButtonGroup>
        <UnstakeButton onClick={handleUnstake} disabled={!canUnstake || loading}>
          {loading ? <LoadingSpinner /> : 'Unstake'}
        </UnstakeButton>
      </ButtonGroup>

      <ButtonGroup>
        <CheckRewardsButton onClick={onCheckRewards} disabled={!canClaim || loading}>
          {loading ? <LoadingSpinner /> : 'Check Rewards'}
        </CheckRewardsButton>
        <ClaimButton onClick={onClaimRewards} disabled={!canClaim || loading}>
          {loading ? <LoadingSpinner /> : 'Claim Rewards'}
        </ClaimButton>
      </ButtonGroup>
      
      {stakingInfo && stakingInfo.isStaking && (
        <div style={{
          background: '#e8f5e8',
          padding: '10px',
          borderRadius: '6px',
          marginTop: '15px',
          fontSize: '0.9rem',
          color: '#155724',
          border: '1px solid #c3e6cb'
        }}>
           <strong>Rewards Info:</strong> Rewards are calculated on-demand by the smart contract when you claim. 
          Current estimated rewards: <strong>{parseFloat(stakingInfo.pendingRewards).toFixed(4)} tokens</strong>
        </div>
      )}
    </FormContainer>
  );
};

export default StakingForm;
