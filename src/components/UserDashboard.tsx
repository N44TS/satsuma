import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { getUserStake, getUserLoyaltyPoints, getUserPurchases, Purchase, getEthersContract, withdrawSavings } from '../utils/contractInteractions';
import styles from '../styles/Home.module.css';

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
        <h2 className={styles.title}>User Dashboard</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Your Savings</h3>
            <p>{stake} USBD</p>
          </div>
          <div className={styles.card}>
            <h3>Loyalty Points</h3>
            <p>{loyaltyPoints} points</p>
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Amount</th>
              <th>Savings</th>
              <th>Transaction Hash</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase, index) => (
              <tr key={index}>
                <td>{purchase.amount} USBC</td>
                <td>{purchase.savings} USBD</td>
                <td>{purchase.transactionHash.slice(0, 10)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className={styles.button} onClick={handleWithdraw}>
          Withdraw Savings
        </button>
      </main>
    </div>
  );
};

export default UserDashboard;