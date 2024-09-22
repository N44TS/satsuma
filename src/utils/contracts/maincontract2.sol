// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for interacting with the Stability Pool
interface IStabilityPool {
    function provideToSP(uint256 _amount) external;
    function withdrawFromSP(uint256 _amount) external;
    function claimReward(address recipient) external returns (uint256 amount);
    function getDepositorBabelGain(address _depositor) external view returns (uint256);
    function debtToken() external view returns (IERC20);
}

contract MerchantSavingsContract is Ownable {
    IStabilityPool public immutable stabilityPool;
    IERC20 public immutable debtToken;
    
    // Mappings to store user deposits, loyalty points, merchant addresses, and active status
    mapping(address => uint256) public userDeposits;
    mapping(address => uint256) public loyaltyPoints;
    mapping(address => address) public merchantAddresses;
    mapping(address => bool) public activeMerchants;

    uint256 public totalDeposits;
    uint256 public constant PRECISION_FACTOR = 1e18;
    uint256 public totalRewards;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    address public lastProcessedAddress;

    mapping(address => uint256) public lastClaimedReward;

    // Events for various contract actions
    event Purchase(address indexed user, address indexed storefront, uint256 amount, uint256 savings);
    event Withdrawal(address indexed user, uint256 amount);
    event PointsRedeemed(address indexed user, address indexed storefront, uint256 points);
    event RewardsClaimed(address indexed merchant, uint256 amount);
    event LoyaltyPointsDistributed(address indexed user, address indexed merchant, uint256 points);
    event MerchantRegistered(address indexed storefront, address indexed merchantAddress);
    event MerchantDeactivated(address indexed storefront);

    constructor(address _stabilityPoolAddress) Ownable(msg.sender) {
        stabilityPool = IStabilityPool(_stabilityPoolAddress);
        debtToken = stabilityPool.debtToken();
    }

    // Function for users to make a purchase and optionally save a percentage
    function purchaseAndDeposit(uint256 amount, bool savePercentage, address storefront) external {
        require(amount > 0, "Amount must be greater than 0");
        require(activeMerchants[storefront], "Invalid storefront");
        
        uint256 savings = 0;
        uint256 merchantPayment = amount;

        if (savePercentage) {
            savings = amount * 5 / 100; // 5% savings
            merchantPayment = amount - savings;
        }

        require(debtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        require(debtToken.transfer(merchantAddresses[storefront], merchantPayment), "Merchant payment failed");

        if (savings > 0) {
            require(debtToken.approve(address(stabilityPool), savings), "Approval failed");
            stabilityPool.provideToSP(savings);
            userDeposits[msg.sender] += savings;
            totalDeposits += savings;
        }

        emit Purchase(msg.sender, storefront, amount, savings);
    }

    // Function for users to withdraw their savings
    function withdrawSavings(uint256 amount) external {
        require(userDeposits[msg.sender] >= amount, "Insufficient balance");
        stabilityPool.withdrawFromSP(amount);
        require(debtToken.transfer(msg.sender, amount), "Transfer failed");
        userDeposits[msg.sender] -= amount;
        totalDeposits -= amount;
        emit Withdrawal(msg.sender, amount);
    }

    // Function for users to redeem their loyalty points
    function redeemLoyaltyPoints(uint256 points, address storefront) external {
        require(loyaltyPoints[msg.sender] >= points, "Insufficient loyalty points");
        require(activeMerchants[storefront], "Invalid storefront");
        
        loyaltyPoints[msg.sender] -= points;
        
        // Transfer the equivalent amount of debtToken to the merchant
        require(debtToken.transfer(merchantAddresses[storefront], points), "Transfer failed");
        
        emit PointsRedeemed(msg.sender, storefront, points);
    }

    // Internal function to update the reward rate
    function updateRewardRate(uint256 newRate) internal {
        rewardRate = newRate;
        lastUpdateTime = block.timestamp;
    }

    // Function for users to claim their rewards
    function claimUserRewards() external {
        uint256 userDeposit = userDeposits[msg.sender];
        require(userDeposit > 0, "No deposits");
        
        uint256 reward = (userDeposit * rewardRate * (block.timestamp - lastUpdateTime)) / (1e18 * 1 days);
        loyaltyPoints[msg.sender] += reward;
        
        emit LoyaltyPointsDistributed(msg.sender, address(0), reward);
    }

    // View function to get a user's loyalty points
    function getUserLoyaltyPoints(address user) external view returns (uint256) {
        return loyaltyPoints[user];
    }

    // View function to get unclaimed rewards
    function getUnclaimedRewards() external view returns (uint256) {
        return stabilityPool.getDepositorBabelGain(address(this));
    }

    // Function for the owner to register a new merchant
    function registerMerchant(address storefront) external onlyOwner { //SHOULD REMOVE ONLY OWNER SO ANYONE CAN REGISTER!!
        require(!activeMerchants[storefront], "Storefront already registered");
        merchantAddresses[storefront] = msg.sender;
        activeMerchants[storefront] = true;
        emit MerchantRegistered(storefront, msg.sender);
    }

    // Function for the owner to deactivate a merchant
    function deactivateMerchant(address storefront) external onlyOwner {
        require(activeMerchants[storefront], "Storefront not active");
        activeMerchants[storefront] = false;
        emit MerchantDeactivated(storefront);
    }

    // View function to get a user's stake (deposit)
    function getUserStake(address user) external view returns (uint256) {
        return userDeposits[user];
    }

    // Function for merchants to claim and distribute loyalty points
    function claimAndDistributeLoyaltyPoints(uint256 batchSize) external {
        require(activeMerchants[msg.sender], "Not an active merchant");
        
        uint256 rewardAmount = stabilityPool.claimReward(address(this));
        totalRewards += rewardAmount;

        uint256 processed = 0;
        uint256 totalDistributed = 0;

        while (processed < batchSize && totalDeposits > 0) {
            lastProcessedAddress = getNextAddress(lastProcessedAddress);
            if (lastProcessedAddress == address(0)) break;

            uint256 userDeposit = userDeposits[lastProcessedAddress];
            if (userDeposit > 0) {
                uint256 newRewards = totalRewards - lastClaimedReward[lastProcessedAddress];
                uint256 userReward = (userDeposit * newRewards * PRECISION_FACTOR) / (totalDeposits * PRECISION_FACTOR);
                
                loyaltyPoints[lastProcessedAddress] += userReward;
                lastClaimedReward[lastProcessedAddress] = totalRewards;
                totalDistributed += userReward;
                
                emit LoyaltyPointsDistributed(lastProcessedAddress, msg.sender, userReward);
                processed++;
            }
        }

        // Transfer the remaining reward to the merchant
        uint256 merchantReward = rewardAmount - totalDistributed;
        require(debtToken.transfer(msg.sender, merchantReward), "Reward transfer failed");
        
        emit RewardsClaimed(msg.sender, rewardAmount);
        emit LoyaltyPointsDistributed(address(0), msg.sender, totalDistributed);
    }

    // Internal function to get the next address in the userDeposits mapping
    function getNextAddress(address current) internal view returns (address) {
        // Implementation to get the next address in the userDeposits mapping
        // This would need to be implemented based on how we track user addresses
    }
}