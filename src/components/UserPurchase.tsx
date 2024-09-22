import React, { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { purchaseAndDeposit } from '../utils/contractInteractions';
import { parseEther } from 'viem';
import { getMerchantAddress } from '../utils/contractInteractions';

const UserPurchase: React.FC = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [amount, setAmount] = useState('');
  const [savePercentage, setSavePercentage] = useState(true);

  const handlePurchase = async () => {
    if (publicClient && walletClient && address) {
      try {
        const merchantAddress = await getMerchantAddress();
        if (!merchantAddress) {
          throw new Error('No merchant registered');
        }
        await purchaseAndDeposit(publicClient, walletClient, parseEther(amount), savePercentage, merchantAddress);
        alert('Purchase successful!');
        // Redirect to user dashboard
      } catch (error) {
        console.error('Purchase failed:', error);
        alert('Purchase failed: ' + (error as Error).message);
      }
    }
  };

  return (
    <div>
      <h2>Make a Purchase</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to purchase"
      />
      <label>
        <input
          type="checkbox"
          checked={savePercentage}
          onChange={(e) => setSavePercentage(e.target.checked)}
        />
        Save 5% and get 5% discount
      </label>
      <button onClick={handlePurchase}>Purchase</button>
    </div>
  );
};

export default UserPurchase;