import type { NextPage } from 'next';
import UserDashboard from '../components/UserDashboard';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

const UserPage: NextPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/" className="logo">Satsuma</Link>
          <div className={styles.tagline}>buy to earn demo site.</div>
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
      <UserDashboard />
    </div>
  );
};

export default UserPage;