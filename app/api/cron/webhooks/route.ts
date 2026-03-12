import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cron/webhooks
 * Process pending webhook retries
 * Called by Vercel Cron Jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'secret'}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call webhook processing endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/webhooks`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.WEBHOOK_TRIGGER_SECRET || 'secret'}`,
        },
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...data,
    });
  } catch (error) {
    console.error('[Webhooks Cron] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}
