import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { getUserStake, getUserLoyaltyPoints, getUserPurchases, Purchase, getEthersContract, withdrawSavings } from '../utils/contractInteractions';

const UserDashboard: React.FC = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [stake, setStake] = useState('0');
  const [loyaltyPoints, setLoyaltyPoints] = useState('0');
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const handleWithdraw = async () => {
    if (publicClient && walletClient && address) {
      try {
        await withdrawSavings(publicClient, walletClient, stake);
        // Refresh user data after withdrawal
        const userStake = await getUserStake(publicClient, walletClient, address);
        setStake(userStake);
      } catch (error) {
        console.error('Withdrawal failed:', error);
        alert('Withdrawal failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (publicClient && walletClient && address) {
        const userStake = await getUserStake(publicClient, walletClient, address);
        const userPoints = await getUserLoyaltyPoints(publicClient, walletClient, address);
        const userPurchases = await getUserPurchases(publicClient, walletClient, address);
        setStake(userStake);
        setLoyaltyPoints(userPoints);
        setPurchases(userPurchases);
      }
    };

    fetchUserData();

    const setupEventListeners = async () => {
      if (publicClient && walletClient && address) {
        const contract = await getEthersContract(publicClient, walletClient);

        contract.on('Purchase', (user: string, storefront: string, amount: bigint, savings: bigint) => {
          if (user === address) {
            console.log('New purchase detected');
            fetchUserData();
          }
        });

        contract.on('LoyaltyPointsDistributed', (user: string, merchant: string, points: bigint) => {
          if (user === address) {
            console.log('Loyalty points distributed');
            fetchUserData();
          }
        });

        return () => {
          contract.removeAllListeners('Purchase');
          contract.removeAllListeners('LoyaltyPointsDistributed');
        };
      }
    };

    setupEventListeners();
  }, [publicClient, walletClient, address]);

  return (
    <div>
      <h2>User Dashboard</h2>
      <p>Your stake: {stake} USBD</p>
      <button onClick={handleWithdraw}>Withdraw Stake</button>
      <p>Your loyalty points: {loyaltyPoints}</p>
      <h3>Your Purchases</h3>
      <table>
        <thead>
          <tr>
            <th>Storefront</th>
            <th>Amount</th>
            <th>Savings</th>
            <th>Block Number</th>
            <th>Transaction Hash</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase, index) => (
            <tr key={index}>
              <td>{purchase.storefront}</td>
              <td>{purchase.amount} USBD</td>
              <td>{purchase.savings} USBD</td>
              <td>{purchase.blockNumber}</td>
              <td>{purchase.transactionHash.slice(0, 10)}...</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserDashboard;