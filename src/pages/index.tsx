import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import MockStorefront from '../components/MockStorefront';

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>BIMA Merchant Savings Widget</title>
        <meta name="description" content="BIMA Merchant Savings Widget Demo" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <ConnectButton />
        <Link href="/merchant">Merchant Dashboard</Link>
        <Link href="/user">User Dashboard</Link>
      </nav>

      <main className={styles.main}>
        <h1>Welcome to BIMA Merchant Savings</h1>
        <MockStorefront />
      </main>
    </div>
  );
};

export default Home;