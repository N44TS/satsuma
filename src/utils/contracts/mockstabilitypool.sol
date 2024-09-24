//contract address: 0x8f72A9e26f301898CF514698346F211e270Aad36
//usbd sepolia address: 0xcFd7Fc6D664FFcc2FC74b68C321ECd6a400d2118

//FOR DEMO ONLY

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockStabilityPool {
    using SafeERC20 for IERC20;

    IERC20 public immutable debtToken;
    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;
    uint256 public rewardRate = 1e16; // 1% per day

    constructor(address _debtTokenAddress) {
        debtToken = IERC20(_debtTokenAddress);
    }

    function provideToSP(uint256 _amount) external {
        require(debtToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        deposits[msg.sender] += _amount;
        totalDeposits += _amount;
    }

    function withdrawFromSP(uint256 _amount) external {
        require(deposits[msg.sender] >= _amount, "Insufficient balance");
        deposits[msg.sender] -= _amount;
        totalDeposits -= _amount;
        require(debtToken.transfer(msg.sender, _amount), "Transfer failed");
    }

    function claimReward(address recipient) external returns (uint256 amount) {
        uint256 reward = (deposits[msg.sender] * rewardRate * 1 days) / 1e18;
        uint256 availableReward = debtToken.balanceOf(address(this));
        reward = reward > availableReward ? availableReward : reward;
        require(debtToken.transfer(recipient, reward), "Reward transfer failed");
        return reward;
    }

    function getDepositorBabelGain(address _depositor) external view returns (uint256) {
        return (deposits[_depositor] * rewardRate * 1 days) / 1e18;
    }

    function setRewardRate(uint256 _newRate) external {
        rewardRate = _newRate;
    }
}