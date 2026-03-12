import { NextRequest, NextResponse } from 'next/server';
import * as queries from '@/lib/db/queries';

/**
 * GET /api/v1/orders/[id]
 * Get order details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const order = await queries.getOrderById(params.id);
    if (!order || order.merchant_id !== merchant.id) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get transactions for this order
    const transactions = await queries.getOrderTransactions(order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        paymentAddress: order.payment_address,
        customerReference: order.customer_reference,
        paidAt: order.paid_at,
        callbackSentAt: order.callback_sent_at,
        expiresAt: order.expires_at,
        createdAt: order.created_at,
        transactions: transactions.map((tx) => ({
          id: tx.id,
          hash: tx.tx_hash,
          from: tx.from_address,
          to: tx.to_address,
          amount: tx.amount,
          status: tx.status,
          confirmations: tx.confirmations,
          createdAt: tx.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[Order Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
