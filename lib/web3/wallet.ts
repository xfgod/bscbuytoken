import { mnemonicToSeed } from 'viem/accounts';
import { HDKey } from 'viem/accounts';
import { privateKeyToAccount, mnemonicToAccount } from 'viem/accounts';
import { publicKeyToAddress } from 'viem/utils';
import { toHex } from 'viem';

// BSC Constants
export const BSC_CHAIN_ID = 56;
export const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:8545';
export const BNB_DECIMALS = 18;
export const USDT_DECIMALS = 6;
export const USDC_DECIMALS = 6;

// Standard BIP44 path for BSC (Ethereum-compatible)
// m/44'/60'/0'/0/index
export const BIP44_PATH = "m/44'/60'/0'/0";

export interface WalletInfo {
  address: string;
  publicKey: string;
  derivationPath: string;
}

export interface MnemonicWallet {
  mnemonic: string;
  path: string;
  account: ReturnType<typeof mnemonicToAccount>;
}

/**
 * Generate a new HD wallet from mnemonic using BIP44 standard
 * Each merchant gets a unique derivation path index
 */
export async function deriveWalletFromMnemonic(
  mnemonic: string,
  index: number
): Promise<WalletInfo> {
  try {
    // Derive account using viem's mnemonicToAccount helper
    const account = mnemonicToAccount(mnemonic, {
      accountIndex: index,
      changeIndex: 0,
      addressIndex: 0,
    });

    const derivationPath = `${BIP44_PATH}/${index}`;

    return {
      address: account.address,
      publicKey: account.publicKey,
      derivationPath,
    };
  } catch (error) {
    throw new Error(`Failed to derive wallet: ${error}`);
  }
}

/**
 * Get wallet from private key (used for main wallet operations)
 */
export function getWalletFromPrivateKey(privateKey: string) {
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
  }
  
  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return account;
  } catch (error) {
    throw new Error(`Invalid private key: ${error}`);
  }
}

/**
 * Validate BSC address format
 */
export function isValidBSCAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Calculate BIP44 derivation path from index
 */
export function getBIP44Path(index: number): string {
  return `${BIP44_PATH}/${index}`;
}

/**
 * Format token amount from raw value
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  const fractionalStr = fractionalPart
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '');
  
  if (fractionalStr) {
    return `${wholePart}.${fractionalStr}`;
  }
  return wholePart.toString();
}

/**
 * Convert token amount to raw value
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const raw = BigInt(whole + paddedFraction);
  return raw;
}

/**
 * Get token contract addresses on BSC mainnet
 */
export const TOKEN_ADDRESSES = {
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  USDC: '0x8AC76a51cc950d9822D68b83FE1Ad97B32Cd580d',
} as const;

export type SupportedToken = 'BNB' | 'USDT' | 'USDC';

/**
 * Get decimals for token
 */
export function getTokenDecimals(token: SupportedToken): number {
  switch (token) {
    case 'BNB':
      return BNB_DECIMALS;
    case 'USDT':
      return USDT_DECIMALS;
    case 'USDC':
      return USDC_DECIMALS;
    default:
      throw new Error(`Unsupported token: ${token}`);
  }
}

/**
 * Get token contract address
 */
export function getTokenAddress(token: SupportedToken): string | null {
  if (token === 'BNB') return null; // BNB is native token
  return TOKEN_ADDRESSES[token] || null;
}
