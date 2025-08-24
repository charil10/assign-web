import React from 'react';
import styled from 'styled-components';

const InfoContainer = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #dee2e6;
  margin-bottom: 20px;
`;

const InfoTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #495057;
  font-size: 1.1rem;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 15px;
`;

const InfoItem = styled.div`
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
`;

const InfoLabel = styled.div`
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 5px;
  font-weight: 500;
`;

const InfoValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: #212529;
`;

const StatusIndicator = styled.div`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  background: ${props => props.active ? '#28a745' : '#dc3545'};
`;

const StakingInfo = ({ stakingInfo, tokenBalance, loading }) => {
  if (loading) {
    return (
      <InfoContainer>
        <InfoTitle>Staking Information</InfoTitle>
        <div style={{ textAlign: 'center', color: '#6c757d' }}>Loading...</div>
      </InfoContainer>
    );
  }

  if (!stakingInfo) {
    return (
      <InfoContainer>
        <InfoTitle>Staking Information</InfoTitle>
        <div style={{ textAlign: 'center', color: '#6c757d' }}>Connect wallet to view staking information</div>
      </InfoContainer>
    );
  }

  const formatDate = (date) => {
    if (!date || date.getTime() === 0) return 'Not started';
    return date.toLocaleDateString();
  };

  const formatNumber = (num) => {
    if (!num || parseFloat(num) === 0) return '0.00';
    return parseFloat(num).toFixed(2);
  };

  return (
    <InfoContainer>
      <InfoTitle>Staking Information</InfoTitle>
      
      <InfoGrid>
        <InfoItem>
          <InfoLabel>Token Balance</InfoLabel>
          <InfoValue>{formatNumber(tokenBalance)} tokens</InfoValue>
        </InfoItem>
        
        <InfoItem>
          <InfoLabel>Staking Status</InfoLabel>
          <InfoValue>
            <StatusIndicator active={stakingInfo.isStaking} />
            {stakingInfo.isStaking ? 'Active' : 'Inactive'}
          </InfoValue>
        </InfoItem>
        
        <InfoItem>
          <InfoLabel>Staked Amount</InfoLabel>
          <InfoValue>{formatNumber(stakingInfo.stakedAmount)} tokens</InfoValue>
        </InfoItem>
        
        <InfoItem>
          <InfoLabel>Pending Rewards</InfoLabel>
          <InfoValue>{formatNumber(stakingInfo.pendingRewards)} tokens</InfoValue>
        </InfoItem>
        
        <InfoItem>
          <InfoLabel>Staking Start Time</InfoLabel>
          <InfoValue style={{ fontSize: '1rem' }}>
            {formatDate(stakingInfo.stakingStartTime)}
          </InfoValue>
        </InfoItem>
      </InfoGrid>
    </InfoContainer>
  );
};

export default StakingInfo;
