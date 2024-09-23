import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { 
  registerMerchant, 
  getEthersContract, 
  distributeRewards, 
  setMerchantAddress 
} from '../utils/contractInteractions';
import styles from '../styles/Home.module.css';

const MerchantDashboard: React.FC = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); 

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
      setIsRegistering(true); // Set loading state to true
      try {
        console.log('Registering merchant...');
        await registerMerchant(publicClient, walletClient, address, chainId);
        setIsRegistered(true);
        console.log('Merchant registered successfully');
        alert('Merchant registered successfully!');
      } catch (error) {
        console.error('Registration failed:', error);
        if (error instanceof Error) {
          alert(`Registration failed: ${error.message}`);
        } else {
          alert('Registration failed. Please try again.');
        }
      } finally {
        setIsRegistering(false); // Set loading state to false
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

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h2 className={styles.title}>Merchant Dashboard</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Registration Status</h3>
            <p>{isRegistered ? 'Registered' : 'Not Registered'}</p>
          </div>
        </div>
        {!isRegistered && (
          <button 
            className={styles.button} 
            onClick={handleRegister}
            disabled={isRegistering}
          >
            {isRegistering ? 'Registering...' : 'Register as Merchant'}
          </button>
        )}
      </main>
    </div>
  );
};

export default MerchantDashboard;