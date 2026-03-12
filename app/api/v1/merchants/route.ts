import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as queries from '@/lib/db/queries';
import {
  generateApiKey,
  hashApiKey,
  generateWebhookSecret,
  hashString,
} from '@/lib/utils/security';
import { isValidBSCAddress } from '@/lib/web3/wallet';

const RegisterMerchantSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  bscAddress: z
    .string()
    .refine(isValidBSCAddress, 'Invalid BSC address'),
  webhookUrl: z.string().url().optional(),
});

interface RegisterRequest {
  name: string;
  email: string;
  bscAddress: string;
  webhookUrl?: string;
}

/**
 * POST /api/v1/merchants/register
 * Register a new merchant
 */
export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const validatedData = RegisterMerchantSchema.parse(body);

    // Check if merchant already exists
    const existingMerchant = await queries.getMerchantByApiKey(''); // This will need adjustment
    
    // Generate API key and webhook secret
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);
    const webhookSecret = validatedData.webhookUrl
      ? generateWebhookSecret()
      : null;

    // Create merchant
    const merchant = await queries.createMerchant({
      name: validatedData.name,
      email: validatedData.email,
      apiKey,
      apiKeyHash,
      bscAddress: validatedData.bscAddress,
      webhookUrl: validatedData.webhookUrl,
      webhookSecret: webhookSecret || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        merchant: {
          id: merchant.id,
          name: merchant.name,
          email: merchant.email,
          apiKey, // Only returned on registration
          webhookSecret: webhookSecret || null,
          createdAt: merchant.created_at,
        },
        message:
          'Store your API key safely. It will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Merchants API] Registration Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if ((error as any).code === '23505') {
      // Unique constraint violation
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/merchants/info
 * Get merchant information
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

    // Get merchant's statistics
    const orders = await queries.getMerchantOrders(merchant.id, 1000);
    const wallets = await queries.getMerchantWallets(merchant.id);
    const apiKeys = await queries.getMerchantApiKeys(merchant.id);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const totalVolume = orders.reduce(
      (sum, o) => sum + parseFloat(o.amount || '0'),
      0
    );

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        bscAddress: merchant.bsc_address,
        webhookUrl: merchant.webhook_url,
        webhookStatus: merchant.callback_status,
        createdAt: merchant.created_at,
        stats: {
          totalOrders,
          completedOrders,
          totalVolume: totalVolume.toFixed(8),
          totalWallets: wallets.length,
          totalApiKeys: apiKeys.length,
        },
      },
    });
  } catch (error) {
    console.error('[Merchants API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
