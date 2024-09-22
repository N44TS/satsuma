import { ethers } from 'ethers';
import contractABI from './ABI/maincontract2.json';
import { PublicClient, WalletClient } from 'viem';
import axios from 'axios';
import { parseEther, parseUnits } from 'viem';

const CONTRACT_ADDRESS = '0xCF14fF742f461f9CD280b60a166cA66F243370b1';
const DEBT_TOKEN_ADDRESS = '0xcFd7Fc6D664FFcc2FC74b68C321ECd6a400d2118'; 

export const getEthersContract = async (publicClient: PublicClient, walletClient: WalletClient) => {
  const provider = new ethers.BrowserProvider(walletClient.transport);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
};

export const registerMerchant = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  storefrontAddress: string
) => {
  const contract = await getEthersContract(publicClient, walletClient);
  const tx = await contract.registerMerchant(storefrontAddress);
  await tx.wait();
  await setMerchantAddress(storefrontAddress);
};

export const purchaseAndDeposit = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  amount: bigint,
  savePercentage: boolean,
  merchantAddress: string
) => {
  const contract = await getEthersContract(publicClient, walletClient);
  const signer = await getSigner(walletClient);
  
  try {
    console.log('Initiating purchase...');

    // Get the USBD token contract
    const usbdToken = new ethers.Contract(DEBT_TOKEN_ADDRESS, [
      'function approve(address spender, uint256 amount) public returns (bool)',
      'function allowance(address owner, address spender) public view returns (uint256)'
    ], signer);

    // Check current allowance
    const currentAllowance = await usbdToken.allowance(await signer.getAddress(), CONTRACT_ADDRESS);

    // If the current allowance is less than the amount, approve the contract to spend tokens
    if (currentAllowance < amount) {
      console.log('Approving token spend...');
      const approveTx = await usbdToken.approve(CONTRACT_ADDRESS, amount);
      await approveTx.wait();
      console.log('Token spend approved');
    }

    const tx = await contract.purchaseAndDeposit(amount, savePercentage, merchantAddress);
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Purchase completed');
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
};

// Helper function to get a signer
const getSigner = async (walletClient: WalletClient) => {
  const provider = new ethers.BrowserProvider(walletClient.transport);
  return provider.getSigner();
};

export const distributeRewards = async (
  publicClient: PublicClient,
  walletClient: WalletClient
) => {
  const contract = await getEthersContract(publicClient, walletClient);
  const tx = await contract.claimAndDistributeLoyaltyPoints(10); // Distribute to 10 users at a time
  await tx.wait();
};

export const getUserStake = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  userAddress: string
) => {
  const contract = await getEthersContract(publicClient, walletClient);
  const stake = await contract.getUserStake(userAddress);
  return ethers.formatUnits(stake, 18);
};

export const getUserLoyaltyPoints = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  userAddress: string
) => {
  const contract = await getEthersContract(publicClient, walletClient);
  const points = await contract.getUserLoyaltyPoints(userAddress);
  return points.toString();
};

export const setMerchantAddress = async (address: string): Promise<void> => {
  try {
    await axios.post('/api/setMerchant', { address });
    console.log('Merchant address set on server:', address);
  } catch (error) {
    console.error('Failed to set merchant address:', error);
    throw error;
  }
};

export const getMerchantAddress = async (): Promise<string | null> => {
  try {
    const response = await axios.get('/api/getMerchant');
    return response.data.address;
  } catch (error) {
    console.error('Failed to fetch merchant address:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('No merchant address set yet.');
      return null;
    }
    throw error;
  }
};

// Define the Purchase interface here
export interface Purchase {
  storefront: string;
  amount: string;
  savings: string;
  blockNumber: number;
  transactionHash: string;
}

export const getUserPurchases = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  userAddress: string
): Promise<Purchase[]> => {
  const contract = await getEthersContract(publicClient, walletClient);
  const filter = contract.filters.Purchase(userAddress);
  const events = await contract.queryFilter(filter);
  return events
    .filter((event): event is ethers.EventLog => event instanceof ethers.EventLog)
    .map(event => {
      const { args, blockNumber, transactionHash } = event;
      return {
        storefront: args.storefront,
        amount: ethers.formatUnits(args.amount, 18),
        savings: ethers.formatUnits(args.savings, 18),
        blockNumber,
        transactionHash
      };
    });
};

// function for user to withdraw their 'savings' stake
export const withdrawSavings = async (publicClient: any, walletClient: any, amount: string) => {
  const contract = await getEthersContract(publicClient, walletClient);
  const amountInTokenUnits = parseUnits(amount, 18); // Assuming USBD has 18 decimals
  const tx = await contract.withdrawSavings(amountInTokenUnits);
  await tx.wait();
};