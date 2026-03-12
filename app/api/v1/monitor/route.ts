import { NextRequest, NextResponse } from 'next/server';
import * as queries from '@/lib/db/queries';
import { bscClient, monitorWallet } from '@/lib/web3/monitoring';

/**
 * POST /api/v1/monitor/check-orders
 * Check payment status for pending orders
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing X-API-Key header' },
        { status: 401 }
      );
    }

    const merchant = await queries.getMerchantByApiKey(apiKey);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get all pending orders for this merchant
    const orders = await queries.getMerchantOrders(merchant.id);
    const pendingOrders = orders.filter((o) => o.status === 'pending');

    const results = {
      checked: 0,
      confirmed: 0,
      failed: 0,
    };

    for (const order of pendingOrders) {
      try {
        // Get wallet associated with order
        const wallet = await queries.getWalletById(order.wallet_id);
        if (!wallet) continue;

        // Check for incoming transactions to this wallet
        const transfers = await monitorWallet(wallet.address);

        // Check if any transfer matches order amount
        for (const transfer of transfers.tokenTransfers) {
          if (
            transfer.to.toLowerCase() === wallet.address.toLowerCase() &&
            transfer.value === order.amount
          ) {
            // Check confirmations
            const receipt = await bscClient.getTransactionReceipt(
              transfer.transactionHash
            );
            if (receipt && receipt.confirmations >= 3) {
              // Create transaction record
              await queries.createTransaction({
                orderId: order.id,
                walletId: wallet.id,
                txHash: transfer.transactionHash,
                fromAddress: transfer.from,
                toAddress: transfer.to,
                amount: transfer.value,
                tokenAddress: transfer.token !== 'BNB' 
                  ? undefined 
                  : undefined,
              });

              // Update order status
              await queries.updateOrderStatus(
                order.id,
                'confirmed',
                wallet.address,
                new Date()
              );

              results.confirmed++;
            }
          }
        }

        results.checked++;
      } catch (error) {
        console.error(`[Monitor] Error checking order ${order.id}:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Checked ${results.checked} orders, confirmed ${results.confirmed}`,
    });
  } catch (error) {
    console.error('[Monitor API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/monitor/wallet-balance
 * Get current balance for a wallet
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing X-API-Key header' },
        { status: 401 }
      );
    }

    const merchant = await queries.getMerchantByApiKey(apiKey);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const walletId = request.nextUrl.searchParams.get('walletId');
    if (!walletId) {
      return NextResponse.json(
        { error: 'walletId parameter required' },
        { status: 400 }
      );
    }

    const wallet = await queries.getWalletById(walletId);
    if (!wallet || wallet.merchant_id !== merchant.id) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Get current balance from blockchain
    const balances = await bscClient.getBalance(wallet.address);

    // Update wallet balance in database
    await queries.updateWalletBalance(
      wallet.id,
      (balances / BigInt(10 ** 18)).toString()
    );

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.address,
        balanceBNB: (balances / BigInt(10 ** 18)).toString(),
        balanceUSDT: wallet.balance_usdt,
        balanceUSDC: wallet.balance_usdc,
        lastChecked: new Date(),
      },
    });
  } catch (error) {
    console.error('[Monitor API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
