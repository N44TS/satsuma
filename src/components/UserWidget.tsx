import React, { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { getUserStake, getUserLoyaltyPoints } from '../utils/contractInteractions';
import styles from '../styles/UserWidget.module.css';

const UserWidget: React.FC = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [stakedAmount, setStakedAmount] = useState('0');
  const [loyaltyPoints, setLoyaltyPoints] = useState('0');

  useEffect(() => {
    const fetchUserData = async () => {
      if (publicClient && walletClient && address) {
        const stake = await getUserStake(publicClient, walletClient, address);
        const points = await getUserLoyaltyPoints(publicClient, walletClient, address);
        setStakedAmount(stake);
        setLoyaltyPoints(points);
      }
    };
    fetchUserData();
  }, [publicClient, walletClient, address]);

  return (
    <div className={styles.widget}>
      <h2 className={styles.title}>BIMA User Dashboard</h2>
      <ConnectButton />
      {address && (
        <div className={styles.userInfo}>
          <p>Connected Address: {address}</p>
          <p>Balance: {balance?.formatted} {balance?.symbol}</p>
          <p>Total Staked: ${stakedAmount} USBD</p>
          <p>Loyalty Points: {loyaltyPoints}</p>
        </div>
      )}
    </div>
  );
};

export default UserWidget;