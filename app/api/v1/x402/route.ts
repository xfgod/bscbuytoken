import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as queries from '@/lib/db/queries';
import { verifyApiKey } from '@/lib/utils/security';

const X402CreateSchema = z.object({
  aiAgentId: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,8})?$/),
  currency: z.enum(['BNB', 'USDT', 'USDC']),
  expiresIn: z.number().min(60).max(86400).optional(),
  metadata: z.record(z.any()).optional(),
});

interface X402Request {
  aiAgentId: string;
  amount: string;
  currency: 'BNB' | 'USDT' | 'USDC';
  expiresIn?: number;
  metadata?: Record<string, any>;
}

/**
 * POST /api/v1/x402
 * Create x402 payment session for AI agent
 * x402 is a protocol for AI agents to make micro-payments
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

    // Parse and validate request
    const body: X402Request = await request.json();
    const validatedData = X402CreateSchema.parse(body);

    // Get available wallet
    const wallets = await queries.getMerchantWallets(merchant.id);
    if (wallets.length === 0) {
      return NextResponse.json(
        { error: 'No wallets available' },
        { status: 400 }
      );
    }

    const wallet = wallets[0];

    // Calculate expiration time
    const expiresIn = validatedData.expiresIn || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Create x402 session
    const session = await queries.createX402Session({
      merchantId: merchant.id,
      walletId: wallet.id,
      aiAgentId: validatedData.aiAgentId,
      amount: validatedData.amount,
      currency: validatedData.currency,
      expiresAt,
      metadata: validatedData.metadata,
    });

    // Return x402 payment response
    // AI agents can use this to make the payment
    return NextResponse.json(
      {
        success: true,
        x402: {
          sessionId: session.id,
          paymentAddress: wallet.address,
          amount: session.amount,
          currency: session.currency,
          expiresAt: session.expires_at,
          // x402 protocol header format for AI agents
          'x402-payment-required': `${session.amount} ${session.currency} to ${wallet.address}`,
        },
      },
      { status: 402 } // 402 Payment Required status
    );
  } catch (error) {
    console.error('[x402 API] Error:', error);

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
 * GET /api/v1/x402/:sessionId
 * Check x402 session status
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

    const sessionId = request.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId parameter required' },
        { status: 400 }
      );
    }

    const session = await queries.getX402Session(sessionId);
    if (!session || session.merchant_id !== merchant.id) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session has expired
    const isExpired = new Date() > new Date(session.expires_at);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        status: isExpired ? 'expired' : session.status,
        amount: session.amount,
        currency: session.currency,
        paymentAddress: session.payment_address,
        txHash: session.tx_hash,
        paidAt: session.paid_at,
        expiresAt: session.expires_at,
        aiAgentId: session.ai_agent_id,
      },
    });
  } catch (error) {
    console.error('[x402 API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
