import type { NextPage } from 'next';
import MerchantDashboard from '../components/MerchantDashboard';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

const MerchantPage: NextPage = () => {
  return (
    <div>
      <nav>
        <ConnectButton />
        <Link href="/">Home</Link>
        <Link href="/user">User Dashboard</Link>
      </nav>
      <MerchantDashboard />
    </div>
  );
};

export default MerchantPage;