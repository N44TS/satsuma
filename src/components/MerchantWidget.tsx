import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import styles from '../styles/MerchantWidget.module.css';

// Mock data for savings history
const mockSavingsHistory = [
  { date: '2023-05-01', amount: 5 },
  { date: '2023-05-15', amount: 10 },
  { date: '2023-05-30', amount: 7.5 },
];

const MerchantWidget: React.FC = () => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { sendTransaction } = useSendTransaction();
  const [price, setPrice] = useState(100); // Example item price
  const [savings, setSavings] = useState(0);
  const [total, setTotal] = useState(price);

  useEffect(() => {
    const savingsAmount = price * 0.05;
    setSavings(savingsAmount);
    setTotal(price - savingsAmount + savingsAmount); // Total remains the same as price
  }, [price]);

  const handlePurchase = async () => {
    const totalAmount = parseEther(total.toString());
    await sendTransaction({ to: '0xYourMerchantAddressHere', value: totalAmount });
  };

  return (
    <div className={styles.widget}>
      <h2 className={styles.title}>BIMA Merchant Savings Widget</h2>
      <ConnectButton />
      {address && (
        <div className={styles.productInfo}>
          <p>Item Price: ${price.toFixed(2)}</p>
          <p>Savings (5%): ${savings.toFixed(2)}</p>
          <p>Total Amount: ${total.toFixed(2)}</p>
          <button className={styles.buyButton} onClick={handlePurchase}>
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
};

export default MerchantWidget;