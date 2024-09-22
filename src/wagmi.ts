import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { Chain } from 'wagmi/chains';

const sepoliaTestnet: Chain = {
  id: 11155111,
  name: 'Sepolia Testnet',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
    public: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
};

export const config = getDefaultConfig({
  appName: 'BIMA Merchant Savings Widget',
  projectId: 'DEMO_PROJECT_ID', // will need to change this for prod or mobile
  chains: [sepoliaTestnet],
  ssr: true,
});