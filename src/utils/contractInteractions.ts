import { ethers } from 'ethers';
import contractABI from './ABI/maincontract2.json';
import OPcontractABI from './ABI/OPabi.json';
import { PublicClient, WalletClient } from 'viem';
import axios from 'axios';
import { parseEther, parseUnits } from 'viem';

const CONTRACT_ADDRESSES: { [key: number]: string } = {
  11155111: '0xCF14fF742f461f9CD280b60a166cA66F243370b1', // Eth Sepolia
  11155420: '0x7467FB9be95FD6032b08ea7171E552Ea469af51E' // OP Sepolia
};

const DEBT_TOKEN_ADDRESSES: { [key: number]: string } = {
  11155111: '0xcFd7Fc6D664FFcc2FC74b68C321ECd6a400d2118', // Eth Sepolia
  11155420: '0xc13265Cb35a63aCe3BBd8dF5C249551355070321' // OP Sepolia
};

const ABIS: { [key: number]: any } = {
  11155111: contractABI,
  11155420: OPcontractABI
};

export const getEthersContract = async (publicClient: PublicClient, walletClient: WalletClient, chainId: number) => {
  const provider = new ethers.BrowserProvider(walletClient.transport);
  const signer = await provider.getSigner();
  const contractAddress = CONTRACT_ADDRESSES[chainId];
  const abi = ABIS[chainId];
  return new ethers.Contract(contractAddress, abi, signer);
};

export const registerMerchant = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  address: string,
  chainId: number
) => {
  const contract = await getEthersContract(publicClient, walletClient, chainId);
  try {
    const tx = await contract.registerMerchant(address);
    await tx.wait();
  } catch (error) {
    console.error('Error in registerMerchant:', error);
    throw error;
  }
};

export const purchaseAndDeposit = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  amount: bigint,
  savePercentage: boolean,
  merchantAddress: string,
  chainId: number
) => {
  const contract = await getEthersContract(publicClient, walletClient, chainId);
  const signer = await getSigner(walletClient);
  
  try {
    console.log('Initiating purchase...');

    // Get the USBD token contract
    const usbdToken = new ethers.Contract(DEBT_TOKEN_ADDRESSES[chainId], [
      'function approve(address spender, uint256 amount) public returns (bool)',
      'function allowance(address owner, address spender) public view returns (uint256)'
    ], signer);

    // Check current allowance
    const currentAllowance = await usbdToken.allowance(await signer.getAddress(), CONTRACT_ADDRESSES[chainId]);

    // If the current allowance is less than the amount, approve the contract to spend tokens
    if (currentAllowance < amount) {
      console.log('Approving token spend...');
      const approveTx = await usbdToken.approve(CONTRACT_ADDRESSES[chainId], amount);
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
  walletClient: WalletClient,
  chainId: number
) => {
  const contract = await getEthersContract(publicClient, walletClient, chainId);
  const tx = await contract.claimAndDistributeLoyaltyPoints(10); // Distribute to 10 users at a time
  await tx.wait();
};

export const getUserStake = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  userAddress: string,
  chainId: number
) => {
  const contract = await getEthersContract(publicClient, walletClient, chainId);
  const stake = await contract.getUserStake(userAddress);
  return ethers.formatUnits(stake, 18);
};

export const getUserLoyaltyPoints = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  userAddress: string,
  chainId: number
) => {
  const contract = await getEthersContract(publicClient, walletClient, chainId);
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
  userAddress: string,
  chainId: number
): Promise<Purchase[]> => {
  const contract = await getEthersContract(publicClient, walletClient, chainId);
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
export const withdrawSavings = async (publicClient: any, walletClient: any, amount: string, chainId: number) => {
  const contract = await getEthersContract(publicClient, walletClient, chainId);
  const amountInTokenUnits = parseUnits(amount, 18); // Assuming USBD has 18 decimals
  const tx = await contract.withdrawSavings(amountInTokenUnits);
  await tx.wait();
};