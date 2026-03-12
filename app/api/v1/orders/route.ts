import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as queries from '@/lib/db/queries';
import { verifyApiKey } from '@/lib/utils/security';
import { getMerchantWallets } from '@/lib/db/queries';

const CreateOrderSchema = z.object({
  orderNumber: z.string().min(1).max(255),
  amount: z.string().regex(/^\d+(\.\d{1,8})?$/),
  currency: z.enum(['BNB', 'USDT', 'USDC']),
  customerReference: z.string().max(255).optional(),
  expiresIn: z.number().min(60).max(86400).optional(),
});

interface OrderRequest {
  orderNumber: string;
  amount: string;
  currency: 'BNB' | 'USDT' | 'USDC';
  customerReference?: string;
  expiresIn?: number;
}

/**
 * POST /api/v1/orders
 * Create a new payment order
 */
export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing X-API-Key header' },
        { status: 401 }
      );
    }

    // Verify API key
    const merchant = await queries.getMerchantByApiKey(apiKey);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body: OrderRequest = await request.json();
    const validatedData = CreateOrderSchema.parse(body);

    // Check if order already exists
    const existingOrder = await queries.getOrderByNumber(validatedData.orderNumber);
    if (existingOrder) {
      return NextResponse.json(
        { error: 'Order number already exists' },
        { status: 400 }
      );
    }

    // Get an available wallet for this merchant
    const wallets = await getMerchantWallets(merchant.id);
    if (wallets.length === 0) {
      return NextResponse.json(
        { error: 'No wallets available for this merchant' },
        { status: 400 }
      );
    }

    // Use the first available wallet (in production, implement round-robin)
    const wallet = wallets[0];

    // Calculate expiration time
    const expiresIn = validatedData.expiresIn || 3600; // Default 1 hour
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Create order
    const order = await queries.createOrder({
      merchantId: merchant.id,
      walletId: wallet.id,
      orderNumber: validatedData.orderNumber,
      amount: validatedData.amount,
      currency: validatedData.currency,
      customerReference: validatedData.customerReference,
      expiresAt,
    });

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          amount: order.amount,
          currency: order.currency,
          paymentAddress: wallet.address,
          status: order.status,
          expiresAt: order.expires_at,
          createdAt: order.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Orders API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/orders
 * Get merchant's orders
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

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const orders = await queries.getMerchantOrders(merchant.id, limit);

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        paymentAddress: order.payment_address,
        paidAt: order.paid_at,
        expiresAt: order.expires_at,
        createdAt: order.created_at,
      })),
    });
  } catch (error) {
    console.error('[Orders API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
