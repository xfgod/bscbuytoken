import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as queries from '@/lib/db/queries';
import {
  createWebhookSignature,
  verifyWebhookSignature,
} from '@/lib/utils/security';

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [60, 300, 900, 3600, 86400]; // 1min, 5min, 15min, 1hr, 1day

interface WebhookPayload {
  event: 'payment.received' | 'payment.confirmed' | 'payment.expired';
  orderId: string;
  orderNumber: string;
  amount: string;
  currency: string;
  txHash?: string;
  confirmations?: number;
  timestamp: number;
}

/**
 * Internal function to send webhook to merchant
 */
export async function sendWebhook(
  webhookUrl: string,
  webhookSecret: string,
  payload: WebhookPayload
): Promise<boolean> {
  try {
    const payloadStr = JSON.stringify(payload);
    const signature = createWebhookSignature(payloadStr, webhookSecret);

    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': Date.now().toString(),
      },
      timeout: 10000,
    });

    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('[Webhook] Send failed:', error);
    return false;
  }
}

/**
 * POST /api/v1/webhooks/trigger
 * Trigger webhook send for payment confirmation
 * Called by monitoring system
 */
export async function POST(request: NextRequest) {
  try {
    // Verify internal authorization
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.WEBHOOK_TRIGGER_SECRET || 'secret'}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, event } = body;

    if (!orderId || !event) {
      return NextResponse.json(
        { error: 'Missing orderId or event' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await queries.getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get merchant details
    const merchant = await queries.getMerchantById(order.merchant_id);
    if (!merchant || !merchant.webhook_url) {
      return NextResponse.json(
        { success: true, message: 'No webhook configured' },
        { status: 200 }
      );
    }

    // Get transaction details if confirmed
    let txHash = null;
    let confirmations = 0;
    if (event === 'payment.confirmed') {
      const transactions = await queries.getOrderTransactions(orderId);
      if (transactions.length > 0) {
        txHash = transactions[0].tx_hash;
        confirmations = transactions[0].confirmations || 0;
      }
    }

    // Create webhook payload
    const payload: WebhookPayload = {
      event,
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.amount,
      currency: order.currency,
      txHash: txHash || undefined,
      confirmations: confirmations || undefined,
      timestamp: Date.now(),
    };

    // Create webhook record
    const webhook = await queries.createWebhook({
      orderId,
      payload,
    });

    // Try to send immediately
    const sent = await sendWebhook(
      merchant.webhook_url,
      merchant.webhook_secret || '',
      payload
    );

    if (sent) {
      // Mark as sent
      await queries.updateWebhookStatus(webhook.id, 'sent', 0);
      await queries.updateOrderStatus(orderId, order.status, undefined, undefined);

      return NextResponse.json({
        success: true,
        message: 'Webhook sent successfully',
      });
    } else {
      // Schedule retry
      const nextRetry = new Date(Date.now() + RETRY_DELAYS[0] * 1000);
      await queries.updateWebhookStatus(
        webhook.id,
        'pending',
        1,
        nextRetry,
        'Initial send failed'
      );

      return NextResponse.json({
        success: true,
        message: 'Webhook scheduled for retry',
      });
    }
  } catch (error) {
    console.error('[Webhooks API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/webhooks/pending
 * Get pending webhooks for retry (internal use)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.WEBHOOK_TRIGGER_SECRET || 'secret'}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pendingWebhooks = await queries.getPendingWebhooks(10);

    // Process retries
    for (const webhook of pendingWebhooks) {
      const order = await queries.getOrderById(webhook.order_id);
      const merchant = await queries.getMerchantById(order.merchant_id);

      if (!merchant || !merchant.webhook_url) {
        await queries.updateWebhookStatus(
          webhook.id,
          'failed',
          webhook.attempt
        );
        continue;
      }

      const sent = await sendWebhook(
        merchant.webhook_url,
        merchant.webhook_secret || '',
        webhook.payload
      );

      if (sent) {
        await queries.updateWebhookStatus(webhook.id, 'sent', webhook.attempt);
      } else if (webhook.attempt < MAX_RETRY_ATTEMPTS) {
        const nextRetryDelay = RETRY_DELAYS[webhook.attempt] || 86400;
        const nextRetry = new Date(Date.now() + nextRetryDelay * 1000);
        await queries.updateWebhookStatus(
          webhook.id,
          'pending',
          webhook.attempt + 1,
          nextRetry,
          `Retry attempt ${webhook.attempt + 1} failed`
        );
      } else {
        await queries.updateWebhookStatus(
          webhook.id,
          'failed',
          webhook.attempt,
          undefined,
          'Max retry attempts reached'
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingWebhooks.length,
    });
  } catch (error) {
    console.error('[Webhooks API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
