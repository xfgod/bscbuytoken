import { NextRequest, NextResponse } from 'next/server';
import * as queries from '@/lib/db/queries';
import { bscClient, monitorWallet } from '@/lib/web3/monitoring';
import { formatTokenAmount, getTokenDecimals } from '@/lib/web3/wallet';

/**
 * GET /api/cron/monitor
 * Monitor all wallets for incoming payments
 * Called by Vercel Cron Jobs (must be authenticated)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization from Vercel
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'secret'}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      walletsChecked: 0,
      paymentsFound: 0,
      ordersUpdated: 0,
      webhooksTriggered: 0,
      errors: 0,
    };

    // Get all pending orders
    const orders = await queries.getMerchantOrders('', 1000);
    const pendingOrders = orders.filter((o) => o.status === 'pending');

    for (const order of pendingOrders) {
      try {
        // Check if order has expired
        if (order.expires_at && new Date(order.expires_at) < new Date()) {
          await queries.updateOrderStatus(order.id, 'expired');
          
          // Trigger webhook for expired payment
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/webhooks/trigger`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.WEBHOOK_TRIGGER_SECRET || 'secret'}`,
            },
            body: JSON.stringify({
              orderId: order.id,
              event: 'payment.expired',
            }),
          });

          results.ordersUpdated++;
          results.webhooksTriggered++;
          continue;
        }

        // Get wallet for this order
        const wallet = await queries.getWalletById(order.wallet_id);
        if (!wallet) continue;

        results.walletsChecked++;

        // Monitor wallet for incoming transactions
        const transfers = await monitorWallet(wallet.address);

        // Check if any transfer matches order amount and currency
        for (const transfer of transfers.tokenTransfers) {
          if (
            transfer.to.toLowerCase() === wallet.address.toLowerCase() &&
            transfer.value === order.amount
          ) {
            // Check transaction status
            const receipt = await bscClient.getTransactionReceipt(
              transfer.transactionHash
            );

            if (!receipt) continue;

            results.paymentsFound++;

            // Check if already recorded
            const existingTx = await queries.getTransactionByHash(
              transfer.transactionHash
            );

            if (!existingTx) {
              // Create transaction record
              await queries.createTransaction({
                orderId: order.id,
                walletId: wallet.id,
                txHash: transfer.transactionHash,
                fromAddress: transfer.from,
                toAddress: transfer.to,
                amount: transfer.value,
                blockNumber: transfer.blockNumber,
              });
            }

            // Update transaction confirmations if already exists
            if (receipt.confirmations >= 3) {
              await queries.updateTransactionStatus(
                transfer.transactionHash,
                'confirmed',
                receipt.confirmations,
                receipt.blockNumber
              );

              // Update order status to confirmed
              if (order.status !== 'confirmed') {
                await queries.updateOrderStatus(
                  order.id,
                  'confirmed',
                  wallet.address,
                  new Date()
                );

                // Trigger webhook for payment confirmation
                await fetch(
                  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/webhooks/trigger`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${process.env.WEBHOOK_TRIGGER_SECRET || 'secret'}`,
                    },
                    body: JSON.stringify({
                      orderId: order.id,
                      event: 'payment.confirmed',
                    }),
                  }
                );

                results.ordersUpdated++;
                results.webhooksTriggered++;
              }
            }
          }
        }
      } catch (error) {
        console.error(`[Monitor] Error processing order ${order.id}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      message: `Monitoring complete: ${results.walletsChecked} wallets checked, ${results.paymentsFound} payments found, ${results.ordersUpdated} orders updated`,
    });
  } catch (error) {
    console.error('[Monitor Cron] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Monitoring failed',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
