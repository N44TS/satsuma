//contract address: 0x4C7Ee35bb7C55D514d6A252E5032Ddf587727241
// stability pool address: 0xe128DA406fAEDd16a08702726B52E10B8C7A8587

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

contract SatsumaOP2 is Ownable {
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

    // Events 
    event Purchase(address indexed user, address indexed storefront, uint256 amount, uint256 savings, uint256 loyaltyPointsUsed, uint256 chainId);
    event Withdrawal(address indexed user, uint256 amount, uint256 chainId);
    event RewardsClaimed(address indexed merchant, uint256 amount, uint256 chainId);
    event LoyaltyPointsDistributed(address indexed user, address indexed merchant, uint256 points, uint256 chainId);
    event MerchantRegistered(address indexed storefront, address indexed merchantAddress, uint256 chainId);
    event MerchantDeactivated(address indexed storefront, uint256 chainId);
    event PointsRedeemed(address indexed user, address indexed storefront, uint256 points, uint256 chainId);

    constructor(address _stabilityPoolAddress) Ownable(msg.sender) {
        stabilityPool = IStabilityPool(_stabilityPoolAddress);
        debtToken = stabilityPool.debtToken();
    }

    // Function for users to make a purchase and optionally save a percentage
    function purchaseAndDeposit(uint256 amount, bool savePercentage, address storefront, uint256 loyaltyPointsToUse) external {
        require(amount > 0, "Amount must be greater than 0");
        require(activeMerchants[storefront], "Invalid storefront");
        require(loyaltyPoints[msg.sender] >= loyaltyPointsToUse, "Insufficient loyalty points");
        
        uint256 savings = 0;
        uint256 merchantPayment = amount;

        // Apply loyalty points discount
        if (loyaltyPointsToUse > 0) {
            if (loyaltyPointsToUse >= merchantPayment) {
                loyaltyPoints[msg.sender] -= merchantPayment;
                loyaltyPointsToUse = merchantPayment;
                merchantPayment = 0;
            } else {
                loyaltyPoints[msg.sender] -= loyaltyPointsToUse;
                merchantPayment -= loyaltyPointsToUse;
            }
        }

        if (savePercentage && merchantPayment > 0) {
            savings = merchantPayment * 5 / 100; // 5% savings
            merchantPayment -= savings;
        }

        if (merchantPayment > 0) {
            require(debtToken.transferFrom(msg.sender, address(this), merchantPayment), "Transfer failed");
            require(debtToken.transfer(merchantAddresses[storefront], merchantPayment), "Merchant payment failed");
        }

        if (savings > 0) {
            require(debtToken.transferFrom(msg.sender, address(this), savings), "Savings transfer failed");
            require(debtToken.approve(address(stabilityPool), savings), "Approval failed");
            stabilityPool.provideToSP(savings);
            userDeposits[msg.sender] += savings;
            totalDeposits += savings;
        }

        emit Purchase(msg.sender, storefront, amount, savings, loyaltyPointsToUse, block.chainid);
    }

    // Function for users to withdraw their savings
    function withdrawSavings(uint256 amount) external {
        require(userDeposits[msg.sender] >= amount, "Insufficient balance");
        stabilityPool.withdrawFromSP(amount);
        require(debtToken.transfer(msg.sender, amount), "Transfer failed");
        userDeposits[msg.sender] -= amount;
        totalDeposits -= amount;
        emit Withdrawal(msg.sender, amount, block.chainid);
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
        
        emit LoyaltyPointsDistributed(msg.sender, address(0), reward, block.chainid);
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
    function registerMerchant(address storefront) external {
        require(!activeMerchants[storefront], "Storefront already registered");
        merchantAddresses[storefront] = msg.sender;
        activeMerchants[storefront] = true;
        emit MerchantRegistered(storefront, msg.sender, block.chainid);
    }

    // Function for the owner to deactivate a merchant
    function deactivateMerchant(address storefront) external onlyOwner {
        require(activeMerchants[storefront], "Storefront not active");
        activeMerchants[storefront] = false;
        emit MerchantDeactivated(storefront, block.chainid);
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
                
                emit LoyaltyPointsDistributed(lastProcessedAddress, msg.sender, userReward, block.chainid);
                processed++;
            }
        }

        // Transfer the remaining reward to the merchant
        uint256 merchantReward = rewardAmount - totalDistributed;
        require(debtToken.transfer(msg.sender, merchantReward), "Reward transfer failed");
        
        emit RewardsClaimed(msg.sender, rewardAmount, block.chainid);
        emit LoyaltyPointsDistributed(address(0), msg.sender, totalDistributed, block.chainid);
    }

    // Internal function to get the next address in the userDeposits mapping
    function getNextAddress(address current) internal view returns (address) {
        // Implementation to get the next address in the userDeposits mapping
        // This would need to be implemented based on how I track user addresses
    }
}