import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import MockStorefront from '../components/MockStorefront';
import { useAccount } from 'wagmi';

const Home: NextPage = () => {
  const { isConnected } = useAccount();

  return (
    <div className={styles.container}>
      <Head>
        <title>Satsuma Loyalty Widget</title>
        <meta name="description" content="Accept USBD and offer user store credit" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <div>
          <Link href="/" className="logo">Satsuma</Link>
          <div className="tagline">shop to earn demo site.</div>
        </div>
        <nav>
          <Link href="/">🍊</Link>
          <Link href="/merchant">Merchant Account</Link>
          {isConnected && <Link href="/user">My Account</Link>}
        </nav>
        <div className="icons">
          <ConnectButton />
        </div>
      </header>

      <main className={styles.main}>
        <div className="main-content">
          <MockStorefront />
        </div>
      </main>
    </div>
  );
};

export default Home;