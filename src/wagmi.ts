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

const opSepoliaTestnet: Chain = {
  id: 11155420,
  name: 'OP Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.optimism.io'] },
    public: { http: ['https://sepolia.optimism.io'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://optimism-sepolia.blockscout.com' },
  },
};

export const config = getDefaultConfig({
  appName: 'BIMA Merchant Savings Widget',
  projectId: 'DEMO_PROJECT_ID', // will need to change this for prod or mobile
  chains: [sepoliaTestnet, opSepoliaTestnet],
  ssr: true,
});