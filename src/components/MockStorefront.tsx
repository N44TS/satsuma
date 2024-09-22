import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { MERCHANT_CONFIG } from '../merchantConfig';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { purchaseAndDeposit, getMerchantAddress } from '../utils/contractInteractions';
import { parseEther } from 'viem';

const MockStorefront: React.FC = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [savingsSelection, setSavingsSelection] = useState<Record<number, boolean>>({});
  const [purchaseStatus, setPurchaseStatus] = useState('');

  const handlePurchase = async (productId: number, price: number) => {
    if (!isConnected || !publicClient || !walletClient || !address) {
      alert('Please connect your wallet first');
      return;
    }
  
    setIsLoading(true);
    try {
      setPurchaseStatus('Approving token spend...');
      console.log('Fetching merchant address...');
      const merchantAddress = await getMerchantAddress();
      console.log('Merchant address:', merchantAddress);
      if (!merchantAddress) {
        throw new Error('No merchant registered');
      }
  
      const amountInUSDC = BigInt(price) * BigInt(1e18);
      setPurchaseStatus('Purchase in progress...');
      await purchaseAndDeposit(publicClient, walletClient, amountInUSDC, savingsSelection[productId] || false, merchantAddress);
      
      setPurchaseSuccess(true);
      setTimeout(() => {
        router.push('/user');
      }, 2000); // Redirect after 2 seconds
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
      setPurchaseStatus('');
    }
  };

  const handleSavingsChange = (productId: number, checked: boolean) => {
    setSavingsSelection(prev => ({ ...prev, [productId]: checked }));
  };

  return (
    <div className="storefront">
      <h2>{MERCHANT_CONFIG.storeName}</h2>
      {isLoading && (
        <div className="spinnerOverlay">
          <div className="spinner"></div>
          {purchaseStatus && <p>{purchaseStatus}</p>}
        </div>
      )}
      {purchaseSuccess && (
        <div className="successMessage">
          Purchase successful! Redirecting...
        </div>
      )}
      <div className="productList">
        {MERCHANT_CONFIG.items.map((product) => (
          <div key={product.id} className="product">
            <h3>{product.name}</h3>
            <p>Price: ${product.price} USBD</p>
            <label>
              <input
                type="checkbox"
                checked={savingsSelection[product.id] || false}
                onChange={(e) => handleSavingsChange(product.id, e.target.checked)}
              />
              Set aside 5% for bonus rewards
            </label>
            <button 
              onClick={() => handlePurchase(product.id, product.price)}
              disabled={!isConnected || isLoading}
            >
              {isLoading ? 'Processing...' : 'Pay with USBD'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MockStorefront;