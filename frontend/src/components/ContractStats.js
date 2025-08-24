import React from 'react';
import styled from 'styled-components';

const StatsContainer = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #dee2e6;
`;

const StatsTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #495057;
  font-size: 1.1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  gap: 15px;
`;

const StatItem = styled.div`
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 1.3rem;
  font-weight: 600;
  color: #17a2b8;
`;

const ContractStats = ({ contractStats, loading }) => {
  if (loading) {
    return (
      <StatsContainer>
        <StatsTitle>Contract Statistics</StatsTitle>
        <div style={{ textAlign: 'center', color: '#6c757d' }}>Loading...</div>
      </StatsContainer>
    );
  }

  if (!contractStats) {
    return (
      <StatsContainer>
        <StatsTitle>Contract Statistics</StatsTitle>
        <div style={{ textAlign: 'center', color: '#6c757d' }}>No contract data available</div>
      </StatsContainer>
    );
  }

  const formatNumber = (num) => {
    if (!num || parseFloat(num) === 0) return '0.00';
    return parseFloat(num).toFixed(2);
  };

  return (
    <StatsContainer>
      <StatsTitle>Contract Statistics</StatsTitle>
      
      <StatsGrid>
        <StatItem>
          <StatLabel>Total Staked</StatLabel>
          <StatValue>{formatNumber(contractStats.totalStaked)} tokens</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Total Rewards Distributed</StatLabel>
          <StatValue>{formatNumber(contractStats.totalRewardsDistributed)} tokens</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Contract Balance</StatLabel>
          <StatValue>{formatNumber(contractStats.contractBalance)} tokens</StatValue>
        </StatItem>
      </StatsGrid>
    </StatsContainer>
  );
};

export default ContractStats;
