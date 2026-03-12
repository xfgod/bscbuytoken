import { NextRequest, NextResponse } from 'next/server';
import * as queries from '@/lib/db/queries';
import { deriveWalletFromMnemonic, isValidBSCAddress } from '@/lib/web3/wallet';

/**
 * POST /api/v1/wallets
 * Derive and create a new wallet for merchant
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

    const { body } = await request.json();

    // Get existing wallets to determine next index
    const existingWallets = await queries.getMerchantWallets(merchant.id);
    const nextIndex = existingWallets.length;

    // Get mnemonic from environment (in production, this would be stored securely)
    const mnemonic = process.env.MNEMONIC_SEED;
    if (!mnemonic) {
      return NextResponse.json(
        { error: 'Wallet derivation not configured' },
        { status: 500 }
      );
    }

    // Derive new wallet
    const walletInfo = await deriveWalletFromMnemonic(mnemonic, nextIndex);

    // Store wallet in database
    const wallet = await queries.createWallet({
      merchantId: merchant.id,
      address: walletInfo.address,
      publicKey: walletInfo.publicKey,
      derivationPath: walletInfo.derivationPath,
    });

    return NextResponse.json(
      {
        success: true,
        wallet: {
          id: wallet.id,
          address: wallet.address,
          derivationPath: wallet.derivation_path,
          balanceBNB: wallet.balance_bnb,
          balanceUSDT: wallet.balance_usdt,
          balanceUSDC: wallet.balance_usdc,
          createdAt: wallet.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Wallets API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/wallets
 * Get merchant's wallets
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

    const wallets = await queries.getMerchantWallets(merchant.id);

    return NextResponse.json({
      success: true,
      wallets: wallets.map((wallet) => ({
        id: wallet.id,
        address: wallet.address,
        derivationPath: wallet.derivation_path,
        balanceBNB: wallet.balance_bnb,
        balanceUSDT: wallet.balance_usdt,
        balanceUSDC: wallet.balance_usdc,
        lastChecked: wallet.last_checked,
        createdAt: wallet.created_at,
      })),
    });
  } catch (error) {
    console.error('[Wallets API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
