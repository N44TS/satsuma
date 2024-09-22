import React, { useState } from 'react';
import { MERCHANT_CONFIG } from '../merchantConfig';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { purchaseAndDeposit, getMerchantAddress } from '../utils/contractInteractions';
import { parseEther } from 'viem';

const MockStorefront: React.FC = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async (productId: number, price: number) => {
    if (publicClient && walletClient && address) {
      try {
        console.log('Fetching merchant address...');
        const merchantAddress = await getMerchantAddress();
        console.log('Merchant address:', merchantAddress);
        if (!merchantAddress) {
          throw new Error('No merchant registered');
        }
        // Convert price to bigint, assuming price is in whole USBD tokens
        const amountInUSDC = BigInt(price) * BigInt(1e18); // Multiply by 1e18 for token decimals
        await purchaseAndDeposit(publicClient, walletClient, amountInUSDC, merchantAddress);
        alert('Purchase successful!');
      } catch (error) {
        console.error('Purchase failed:', error);
        if (error instanceof Error) {
          alert('Purchase failed: ' + error.message);
        } else {
          alert('Purchase failed. Please try again.');
        }
      }
    }
  };

  return (
    <div className="storefront">
      <h2>{MERCHANT_CONFIG.storeName}</h2>
      <div className="productList">
        {MERCHANT_CONFIG.items.map((product) => (
          <div key={product.id} className="product">
            <h3>{product.name}</h3>
            <p>Price: ${product.price} USBD</p>
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