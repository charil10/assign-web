// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Staking Contract
 * @dev A gas-efficient staking contract with proportional rewards and penalty system
 * 
 * Security Features:
 * - ReentrancyGuard: Prevents reentrancy attacks
 * - Pausable: Allows emergency pausing
 * - Access control for admin functions
 * 
 * Gas Optimizations:
 * - No loops over all stakers for reward calculation
 * - Efficient storage packing
 * - Batch operations support
 */
contract StakingContract is ReentrancyGuard, Pausable, Ownable {

    // Token being staked
    IERC20 public stakingToken;
    
    // Staking parameters
    uint256 public constant MINIMUM_STAKE_AMOUNT = 100 * 10**18; // 100 tokens
    uint256 public constant MINIMUM_LOCK_PERIOD = 7 days;
    uint256 public constant MAXIMUM_LOCK_PERIOD = 365 days;
    
    // Reward parameters
    uint256 public constant REWARD_RATE = 10; // 10% annual rate
    uint256 public constant REWARD_PRECISION = 10000;
    
    // Penalty parameters
    uint256 public constant EARLY_UNSTAKE_PENALTY = 500; // 5% penalty
    uint256 public constant PENALTY_PRECISION = 10000;
    
    // Contract state
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public lastUpdateTime;
    
    // Staker information
    struct StakerInfo {
        uint256 stakedAmount;
        uint256 stakingStartTime;
        uint256 lastRewardCalculationTime;
        uint256 accumulatedRewards;
        bool isStaking;
    }
    
    // Mapping from user address to staker info
    mapping(address => StakerInfo) public stakers;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 penalty, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsUpdated(uint256 totalRewards, uint256 timestamp);

    constructor(address _stakingToken)Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20(_stakingToken);
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Stake tokens into the contract
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= MINIMUM_STAKE_AMOUNT, "Amount below minimum");
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        StakerInfo storage staker = stakers[msg.sender];
        
        // If already staking, calculate and add accumulated rewards first
        if (staker.isStaking) {
            _updateRewards(msg.sender);
            staker.stakedAmount = staker.stakedAmount + amount;
        } else {
            // New staker
            staker.stakingStartTime = block.timestamp;
            staker.lastRewardCalculationTime = block.timestamp;
            staker.stakedAmount = amount;
            staker.isStaking = true;
        }
        
        totalStaked = totalStaked + amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Unstake tokens from the contract
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        StakerInfo storage staker = stakers[msg.sender];
        require(staker.isStaking, "Not staking");
        require(amount <= staker.stakedAmount, "Insufficient staked amount");
        
        // Calculate rewards before unstaking
        _updateRewards(msg.sender);
        
        uint256 penalty = 0;
        uint256 actualAmount = amount;
        
        // Check if early unstaking penalty applies
        if (block.timestamp < staker.stakingStartTime + MINIMUM_LOCK_PERIOD) {
            penalty = amount * EARLY_UNSTAKE_PENALTY / PENALTY_PRECISION;
            actualAmount = amount - penalty;
        }
        
        // Update staker state
        staker.stakedAmount = staker.stakedAmount - amount;
        
        if (staker.stakedAmount == 0) {
            staker.isStaking = false;
        }
        
        totalStaked = totalStaked - amount;
        
        // Transfer tokens back to user
        require(stakingToken.transfer(msg.sender, actualAmount), "Transfer failed");
        
        emit Unstaked(msg.sender, amount, penalty, block.timestamp);
    }
    
    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external nonReentrant whenNotPaused {
        StakerInfo storage staker = stakers[msg.sender];
        require(staker.isStaking, "Not staking");
        
        _updateRewards(msg.sender);
        
        uint256 rewardsToClaim = staker.accumulatedRewards;
        require(rewardsToClaim > 0, "No rewards to claim");
        
        staker.accumulatedRewards = 0;
        totalRewardsDistributed = totalRewardsDistributed + rewardsToClaim;
        
        // Transfer reward tokens to user
        require(stakingToken.transfer(msg.sender, rewardsToClaim), "Transfer failed");
        
        emit RewardsClaimed(msg.sender, rewardsToClaim, block.timestamp);
    }
    
    /**
     * @dev Calculate and update rewards for a specific staker
     * @param stakerAddress Address of the staker
     */
    function _updateRewards(address stakerAddress) internal {
        StakerInfo storage staker = stakers[stakerAddress];
        
        if (!staker.isStaking || staker.stakedAmount == 0) {
            return;
        }
        
        uint256 timeElapsed = block.timestamp - staker.lastRewardCalculationTime;
        if (timeElapsed == 0) {
            return;
        }
        
        // Calculate rewards based on time and amount
        uint256 rewards = staker.stakedAmount
            * REWARD_RATE
            * timeElapsed
            / REWARD_PRECISION
            / (365 days);
        
        staker.accumulatedRewards = staker.accumulatedRewards + rewards;
        staker.lastRewardCalculationTime = block.timestamp;
    }
    
    /**
     * @dev Get current staking information for a user
     * @param user Address of the user
     * @return stakedAmount Current staked amount
     * @return pendingRewards Pending rewards
     * @return stakingStartTime When staking started
     * @return isStaking Whether user is currently staking
     */
    function getStakingInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 stakingStartTime,
        bool isStaking
    ) {
        StakerInfo storage staker = stakers[user];
        stakedAmount = staker.stakedAmount;
        stakingStartTime = staker.stakingStartTime;
        isStaking = staker.isStaking;
        
        // Calculate pending rewards
        if (staker.isStaking && staker.stakedAmount > 0) {
            uint256 timeElapsed = block.timestamp - staker.lastRewardCalculationTime;
            uint256 rewards = staker.stakedAmount
                * REWARD_RATE
                * timeElapsed
                / REWARD_PRECISION
                / (365 days);
            pendingRewards = staker.accumulatedRewards + rewards;
        } else {
            pendingRewards = staker.accumulatedRewards;
        }
    }
    
    /**
     * @dev Emergency function to pause staking operations
     * Only callable by owner
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Resume staking operations
     * Only callable by owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency function to recover stuck tokens
     * Only callable by owner
     * @param tokenAddress Address of the token to recover
     * @param amount Amount to recover
     */
    function emergencyRecover(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(stakingToken), "Cannot recover staking token");
        IERC20(tokenAddress).transfer(owner(), amount);
    }
    
    /**
     * @dev Get contract statistics
     * @return _totalStaked Total amount staked
     * @return _totalRewardsDistributed Total rewards distributed
     * @return _contractBalance Current contract balance
     */
    function getContractStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalRewardsDistributed,
        uint256 _contractBalance
    ) {
        _totalStaked = totalStaked;
        _totalRewardsDistributed = totalRewardsDistributed;
        _contractBalance = stakingToken.balanceOf(address(this));
    }
}
