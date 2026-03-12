import axios from 'axios';
import { BSC_RPC_URL, TOKEN_ADDRESSES, formatTokenAmount, SupportedToken, getTokenDecimals } from './wallet';

export interface BlockHeader {
  number: string;
  timestamp: string;
  hash: string;
}

export interface TransactionReceipt {
  blockNumber: number;
  transactionHash: string;
  from: string;
  to: string;
  gasUsed: string;
  gasPrice: string;
  status: boolean;
  confirmations: number;
}

export interface TokenTransfer {
  from: string;
  to: string;
  value: string;
  transactionHash: string;
  blockNumber: number;
  token: SupportedToken;
  decimals: number;
}

class BSCRPCClient {
  private rpcUrl: string;
  private requestId: number = 0;

  constructor(rpcUrl: string = BSC_RPC_URL) {
    this.rpcUrl = rpcUrl;
  }

  /**
   * Make JSON-RPC call to BSC node
   */
  private async call<T>(method: string, params: any[] = []): Promise<T> {
    this.requestId++;
    try {
      const response = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: '2.0',
          method,
          params,
          id: this.requestId,
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error) {
      console.error(`[BSC RPC] ${method} failed:`, error);
      throw error;
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    const blockHex = await this.call<string>('eth_blockNumber');
    return parseInt(blockHex, 16);
  }

  /**
   * Get balance of address in wei
   */
  async getBalance(address: string): Promise<bigint> {
    const balanceHex = await this.call<string>('eth_getBalance', [
      address.toLowerCase(),
      'latest',
    ]);
    return BigInt(balanceHex);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    const receipt = await this.call<any>('eth_getTransactionReceipt', [txHash]);
    
    if (!receipt) return null;

    const blockNumber = parseInt(receipt.blockNumber, 16);
    const currentBlockNumber = await this.getBlockNumber();
    const confirmations = Math.max(0, currentBlockNumber - blockNumber);

    return {
      blockNumber,
      transactionHash: receipt.transactionHash,
      from: receipt.from,
      to: receipt.to || '',
      gasUsed: receipt.gasUsed,
      gasPrice: receipt.gasPrice,
      status: receipt.status === '0x1',
      confirmations,
    };
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string): Promise<any> {
    return this.call<any>('eth_getTransactionByHash', [txHash]);
  }

  /**
   * Call contract function (for ERC20 balanceOf)
   */
  async call(
    to: string,
    data: string,
    blockTag: string = 'latest'
  ): Promise<string> {
    return this.call<string>('eth_call', [
      { to, data },
      blockTag,
    ]);
  }

  /**
   * Get logs (events) from blockchain
   */
  async getLogs(filter: {
    fromBlock?: string | number;
    toBlock?: string | number;
    address?: string | string[];
    topics?: string[][];
  }): Promise<any[]> {
    const params = {
      fromBlock: typeof filter.fromBlock === 'number' 
        ? '0x' + filter.fromBlock.toString(16) 
        : filter.fromBlock || 'latest',
      toBlock: typeof filter.toBlock === 'number'
        ? '0x' + filter.toBlock.toString(16)
        : filter.toBlock || 'latest',
      address: filter.address,
      topics: filter.topics,
    };

    return this.call<any[]>('eth_getLogs', [params]);
  }
}

// ERC20 Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/**
 * Monitor wallet for incoming transactions
 */
export async function monitorWallet(
  walletAddress: string,
  fromBlock: number = 0
): Promise<{
  bnbTransfers: TransactionReceipt[];
  tokenTransfers: TokenTransfer[];
}> {
  const client = new BSCRPCClient();

  try {
    const currentBlock = await client.getBlockNumber();
    const toBlock = currentBlock;

    // Get logs for ERC20 transfers to wallet
    const logs = await client.getLogs({
      fromBlock,
      toBlock,
      topics: [
        ERC20_TRANSFER_TOPIC,
        null,
        '0x' + walletAddress.slice(2).padStart(64, '0'),
      ],
    });

    const tokenTransfers: TokenTransfer[] = [];

    for (const log of logs) {
      const token = Object.entries(TOKEN_ADDRESSES).find(
        ([, addr]) => addr.toLowerCase() === log.address.toLowerCase()
      )?.[0] as SupportedToken | undefined;

      if (token) {
        const value = BigInt(log.data);
        const decimals = getTokenDecimals(token);
        
        tokenTransfers.push({
          from: '0x' + log.topics[1].slice(26),
          to: walletAddress,
          value: formatTokenAmount(value, decimals),
          transactionHash: log.transactionHash,
          blockNumber: parseInt(log.blockNumber, 16),
          token,
          decimals,
        });
      }
    }

    return {
      bnbTransfers: [],
      tokenTransfers,
    };
  } catch (error) {
    console.error('[Monitoring] Error monitoring wallet:', error);
    throw error;
  }
}

/**
 * Check if transaction has sufficient confirmations
 */
export async function hasEnoughConfirmations(
  txHash: string,
  requiredConfirmations: number = 3
): Promise<boolean> {
  const client = new BSCRPCClient();
  const receipt = await client.getTransactionReceipt(txHash);
  return receipt ? receipt.confirmations >= requiredConfirmations : false;
}

/**
 * Get wallet balances for all supported tokens
 */
export async function getWalletBalances(walletAddress: string): Promise<{
  bnb: string;
  usdt: string;
  usdc: string;
}> {
  const client = new BSCRPCClient();

  // Get BNB balance
  const bnbWei = await client.getBalance(walletAddress);
  const bnb = formatTokenAmount(bnbWei, 18);

  // Get USDT and USDC balances
  // This would require calling balanceOf on the token contracts
  // For now, we'll return 0 - this would be implemented with actual contract calls

  return {
    bnb,
    usdt: '0',
    usdc: '0',
  };
}

export const bscClient = new BSCRPCClient();
