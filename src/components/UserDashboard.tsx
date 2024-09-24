import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { getUserStake, getUserLoyaltyPoints, getUserPurchases, Purchase, getEthersContract, withdrawSavings } from '../utils/contractInteractions';
import styles from '../styles/UserDashboard.module.css';
import Image from 'next/image';

const UserDashboard: React.FC = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [stake, setStake] = useState('0');
  const [loyaltyPoints, setLoyaltyPoints] = useState('0');
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const handleWithdraw = async () => {
    if (publicClient && walletClient && address && chainId) {
      try {
        await withdrawSavings(publicClient, walletClient, stake, chainId);
        // Refresh user data after withdrawal
        const userStake = await getUserStake(publicClient, walletClient, address, chainId);
        setStake(userStake);
      } catch (error) {
        console.error('Withdrawal failed:', error);
        alert('Withdrawal failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (publicClient && walletClient && address && chainId) {
        const userStake = await getUserStake(publicClient, walletClient, address, chainId);
        const userPoints = await getUserLoyaltyPoints(publicClient, walletClient, address, chainId);
        const userPurchases = await getUserPurchases(publicClient, walletClient, address, chainId);
        setStake(userStake);
        setLoyaltyPoints(userPoints);
        setPurchases(userPurchases);
      }
    };

    fetchUserData();

    const setupEventListeners = async () => {
      if (publicClient && walletClient && address && chainId) {
        const contract = await getEthersContract(publicClient, walletClient, chainId);

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
  }, [publicClient, walletClient, address, chainId]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>User Dashboard</h1>
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <h2>Your Savings</h2>
            <p className={styles.statValue}>{stake} USBD</p>
            <button className={styles.withdrawButton} onClick={handleWithdraw}>
              Withdraw Savings
            </button>
          </div>
          <div className={styles.statCard}>
            <h2>Loyalty Points</h2>
            <p className={styles.statValue}>{loyaltyPoints} points</p>
          </div>
        </div>
        <h2 className={styles.subtitle}>Previous Purchases</h2>
        <table className={styles.purchasesTable}>
          <thead>
            <tr>
              <th>Amount</th>
              <th>Savings</th>
              <th>Transaction Hash</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase, index) => (
              <tr key={index} className={styles.purchaseRow}>
                <td>{purchase.amount} USBD</td>
                <td>{purchase.savings} USBD</td>
                <td className={styles.transactionHash}>{purchase.transactionHash.slice(0, 10)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default UserDashboard;