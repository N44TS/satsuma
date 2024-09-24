import styles from '../styles/Home.module.css';
import MerchantDashboard from '../components/MerchantDashboard';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import type { NextPage } from 'next';

const MerchantPage: NextPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/" className="logo">Satsuma</Link>
          <div className={styles.tagline}>shop to earn demo site.</div>
        </div>
        <nav>
          <Link href="/">🍊</Link>
          <Link href="/merchant">Merchant Account</Link>
          <Link href="/user">My Account</Link>
        </nav>
        <div className={styles.icons}>
          <ConnectButton />
        </div>
      </header>
      <MerchantDashboard />
    </div>
  );
};

export default MerchantPage;