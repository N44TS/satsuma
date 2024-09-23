import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { 
  registerMerchant, 
  getEthersContract, 
  distributeRewards, 
  setMerchantAddress 
} from '../utils/contractInteractions';

const MerchantDashboard: React.FC = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (publicClient && walletClient && address && chainId) {
        const contract = await getEthersContract(publicClient, walletClient, chainId);
        const status = await contract.activeMerchants(address);
        setIsRegistered(status);
        
        if (status) {
          // If registered on contract already, update server-side storage
          await setMerchantAddress(address);
          console.log('Updated server storage with registered merchant address:', address);
        }
      }
    };
    checkRegistrationStatus();
  }, [publicClient, walletClient, address, chainId]);

  const handleRegister = async () => {
    if (publicClient && walletClient && address && chainId) {
      try {
        console.log('Registering merchant...');
        await registerMerchant(publicClient, walletClient, address, chainId);
        setIsRegistered(true);
        console.log('Merchant registered successfully');
        alert('Merchant registered successfully!');
      } catch (error) {
        console.error('Registration failed:', error);
        alert('Registration failed. Please try again.');
      }
    }
  };

  const handleDistributeRewards = async () => {
    if (publicClient && walletClient && address && chainId) {
      try {
        await distributeRewards(publicClient, walletClient, chainId);
        alert('Rewards distributed successfully!');
      } catch (error) {
        console.error('Failed to distribute rewards:', error);
      }
    }
  };

  if (!isRegistered) {
    return (
      <div>
        <h2>Merchant Registration</h2>
        <button onClick={handleRegister}>Register as Merchant</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Merchant Dashboard</h2>
      <p>You are registered as a merchant.</p>
      <button onClick={handleDistributeRewards}>Distribute Rewards</button>
    </div>
  );
};

export default MerchantDashboard;