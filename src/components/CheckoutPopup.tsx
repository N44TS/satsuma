import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

interface CheckoutPopupProps {
  product: {
    id: number;
    name: string;
    price: number;
  };
  savingsSelection: boolean;
  availableLoyaltyPoints: bigint;
  onConfirm: (loyaltyPointsToUse: number) => void;
  onCancel: () => void;
}

const CheckoutPopup: React.FC<CheckoutPopupProps> = ({
  product,
  savingsSelection,
  availableLoyaltyPoints,
  onConfirm,
  onCancel
}) => {
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const savings = savingsSelection ? product.price * 0.05 : 0;
  const loyaltyPointsValue = loyaltyPointsToUse / 100; // Assuming 1 point = $0.01
  const totalPrice = product.price;

  useEffect(() => {
    setLoyaltyPointsToUse(0); // Reset loyalty points when the popup opens
  }, [product]);

  const handleLoyaltyPointsChange = (points: number) => {
    const maxPoints = Number(availableLoyaltyPoints);
    setLoyaltyPointsToUse(Math.min(Math.max(points, 0), maxPoints));
  };

  return (
    <div className={styles.checkoutPopup}>
      <h3>Checkout</h3>
      <p>Product: {product.name}</p>
      <p>Price: ${product.price.toFixed(2)} USBD</p>
      {savings > 0 && (
        <p>Savings to Pool: ${savings.toFixed(2)} USBD</p>
      )}
      <p>Available Loyalty Points: {availableLoyaltyPoints.toString()}</p>
      <label>
        Use Loyalty Points:
        <input
          type="number"
          value={loyaltyPointsToUse}
          onChange={(e) => handleLoyaltyPointsChange(Number(e.target.value))}
          min="0"
          max={Number(availableLoyaltyPoints)}
        />
      </label>
      <p>Loyalty Points Value: ${loyaltyPointsValue.toFixed(2)}</p>
      <p>Total Price: ${totalPrice.toFixed(2)} USBD</p>
      <button onClick={() => onConfirm(loyaltyPointsToUse)}>Confirm Purchase</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
};

export default CheckoutPopup;