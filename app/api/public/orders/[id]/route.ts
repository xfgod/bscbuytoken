import { NextRequest, NextResponse } from 'next/server';
import * as queries from '@/lib/db/queries';

/**
 * GET /api/public/orders/[id]
 * Get public order details (no auth required)
 * Used for payment checkout page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await queries.getOrderById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order has expired
    const isExpired = order.expires_at && new Date(order.expires_at) < new Date();
    const status = isExpired ? 'expired' : order.status;

    // Get transactions
    const transactions = await queries.getOrderTransactions(order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        amount: order.amount,
        currency: order.currency,
        status,
        paymentAddress: order.payment_address,
        customerReference: order.customer_reference,
        expiresAt: order.expires_at,
        paidAt: order.paid_at,
        createdAt: order.created_at,
        transactions: transactions.map((tx) => ({
          id: tx.id,
          hash: tx.tx_hash,
          from: tx.from_address,
          to: tx.to_address,
          amount: tx.amount,
          status: tx.status,
          confirmations: tx.confirmations,
        })),
      },
    });
  } catch (error) {
    console.error('[Public Orders API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
