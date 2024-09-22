import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { getUserStake, getUserLoyaltyPoints } from '../utils/contractInteractions';

const UserDashboard: React.FC = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [stake, setStake] = useState('0');
  const [loyaltyPoints, setLoyaltyPoints] = useState('0');

  useEffect(() => {
    const fetchUserData = async () => {
      if (publicClient && walletClient && address) {
        const userStake = await getUserStake(publicClient, walletClient, address);
        const userPoints = await getUserLoyaltyPoints(publicClient, walletClient, address);
        setStake(userStake);
        setLoyaltyPoints(userPoints);
      }
    };
    fetchUserData();
  }, [publicClient, walletClient, address]);

  return (
    <div>
      <h2>User Dashboard</h2>
      <p>Your stake: {stake} USBD</p>
      <p>Your loyalty points: {loyaltyPoints}</p>
    </div>
  );
};

export default UserDashboard;