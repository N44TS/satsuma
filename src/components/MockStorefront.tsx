import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { MERCHANT_CONFIG } from '../merchantConfig';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { purchaseAndDeposit, getMerchantAddress } from '../utils/contractInteractions';
import { parseEther } from 'viem';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import CheckoutPopup from './CheckoutPopup';

const MockStorefront: React.FC = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [savingsSelection, setSavingsSelection] = useState<Record<number, boolean>>({});
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState<Record<number, bigint>>({});
  const [loyaltyPointsInput, setLoyaltyPointsInput] = useState<Record<number, string>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<null | { id: number; name: string; price: number }>(null);
  const [detailedStatus, setDetailedStatus] = useState('');

  const handlePurchase = (productId: number, price: number, name: string) => {
    console.log('handlePurchase called', { productId, price, name });
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setSelectedProduct({ id: productId, price, name });
    setShowCheckout(true);
  };

  const handleConfirmPurchase = async (loyaltyPointsToUse: number) => {
    if (!selectedProduct || !publicClient || !walletClient || !address || !chainId) {
      alert('Unable to process purchase. Please try again.');
      return;
    }

    setIsLoading(true);
    setShowCheckout(false);
    try {
      setDetailedStatus('Initiating purchase...');
      console.log('Fetching merchant address...');
      setDetailedStatus('Fetching merchant address...');
      const merchantAddress = await getMerchantAddress();
      console.log('Merchant address:', merchantAddress);
      if (!merchantAddress) {
        throw new Error('No merchant registered');
      }

      const amountInUSDC = BigInt(selectedProduct.price) * BigInt(1e18);
      setDetailedStatus('Approving token spend...');
      const txHash = await purchaseAndDeposit(
        publicClient, 
        walletClient, 
        amountInUSDC, 
        savingsSelection[selectedProduct.id] || false, 
        merchantAddress, 
        chainId,
        BigInt(loyaltyPointsToUse)
      );
      
      setDetailedStatus('Purchase completed');
      setPurchaseSuccess(true);
      setTimeout(() => {
        router.push('/user');
      }, 2000); // Redirect after 2 seconds
    } catch (error) {
      console.error('Purchase failed:', error);
      setDetailedStatus('Purchase failed');
      alert('Purchase failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoyaltyPointsChange = (productId: number, points: string) => {
    setLoyaltyPointsInput(prev => ({
      ...prev,
      [productId]: points
    }));
  };

  const handleSavingsChange = (productId: number, checked: boolean) => {
    setSavingsSelection(prev => ({ ...prev, [productId]: checked }));
  };

  return (
    <div className={styles.container}>
      {isLoading && (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p className="spinner-text">{detailedStatus}</p>
        </div>
      )}
      {purchaseSuccess && <div className="successMessage">Purchase successful! Redirecting to dashboard...</div>}
      <div className="productList">
        {MERCHANT_CONFIG.items.map((product) => (
          <div key={product.id} className="product">
            <img src={`/images/${product.name.toLowerCase()}.png`} alt={product.name} />
            <h3>{product.name}</h3>
            <p>${product.price} USBD</p>
            <label>
              <input
                type="checkbox"
                checked={savingsSelection[product.id] || false}
                onChange={(e) => handleSavingsChange(product.id, e.target.checked)}
              />
              Set aside 5% for bonus rewards
            </label>
            <button 
              onClick={() => handlePurchase(product.id, product.price, product.name)}
              disabled={!isConnected || isLoading}
            >
              {isLoading ? 'Processing...' : 'Pay with USBD'}
            </button>
          </div>
        ))}
      </div>
      {showCheckout && selectedProduct && (
        <>
          <div className={styles.overlay} onClick={() => setShowCheckout(false)} />
          <CheckoutPopup
            product={selectedProduct}
            savingsSelection={savingsSelection[selectedProduct.id] || false}
            availableLoyaltyPoints={loyaltyPoints[selectedProduct.id] || BigInt(0)}
            onConfirm={handleConfirmPurchase}
            onCancel={() => setShowCheckout(false)}
          />
        </>
      )}
    </div>
  );
};

export default MockStorefront;