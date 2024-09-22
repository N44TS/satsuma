import type { NextPage } from 'next';
import UserDashboard from '../components/UserDashboard';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

const UserPage: NextPage = () => {
  return (
    <div>
      <nav>
        <ConnectButton />
        <Link href="/">Home</Link>
        <Link href="/merchant">Merchant Dashboard</Link>
      </nav>
      <UserDashboard />
    </div>
  );
};

export default UserPage;