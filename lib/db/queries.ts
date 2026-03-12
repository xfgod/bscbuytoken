import { sql } from '@vercel/postgres';

// ===== MERCHANT QUERIES =====

export async function getMerchantByApiKey(apiKey: string) {
  const result = await sql`
    SELECT * FROM merchants WHERE api_key = ${apiKey}
  `;
  return result.rows[0];
}

export async function getMerchantById(merchantId: string) {
  const result = await sql`
    SELECT * FROM merchants WHERE id = ${merchantId}
  `;
  return result.rows[0];
}

export async function createMerchant(data: {
  name: string;
  email: string;
  apiKey: string;
  apiKeyHash: string;
  bscAddress: string;
  webhookUrl?: string;
  webhookSecret?: string;
}) {
  const result = await sql`
    INSERT INTO merchants (
      name, email, api_key, api_key_hash, bsc_address,
      webhook_url, webhook_secret
    ) VALUES (
      ${data.name}, ${data.email}, ${data.apiKey}, ${data.apiKeyHash},
      ${data.bscAddress}, ${data.webhookUrl || null}, ${data.webhookSecret || null}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateMerchant(
  merchantId: string,
  data: Partial<{
    name: string;
    webhookUrl: string;
    webhookSecret: string;
    callbackStatus: string;
  }>
) {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.webhookUrl !== undefined) {
    updates.push(`webhook_url = $${paramIndex++}`);
    values.push(data.webhookUrl);
  }
  if (data.webhookSecret !== undefined) {
    updates.push(`webhook_secret = $${paramIndex++}`);
    values.push(data.webhookSecret);
  }
  if (data.callbackStatus !== undefined) {
    updates.push(`callback_status = $${paramIndex++}`);
    values.push(data.callbackStatus);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(merchantId);

  const query = `
    UPDATE merchants
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await sql(query, values);
  return result.rows[0];
}

// ===== WALLET QUERIES =====

export async function createWallet(data: {
  merchantId: string;
  address: string;
  publicKey: string;
  derivationPath: string;
}) {
  const result = await sql`
    INSERT INTO wallets (
      merchant_id, address, public_key, derivation_path
    ) VALUES (
      ${data.merchantId}, ${data.address}, ${data.publicKey}, ${data.derivationPath}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getWalletByAddress(address: string) {
  const result = await sql`
    SELECT * FROM wallets WHERE address = ${address.toLowerCase()}
  `;
  return result.rows[0];
}

export async function getWalletById(walletId: string) {
  const result = await sql`
    SELECT * FROM wallets WHERE id = ${walletId}
  `;
  return result.rows[0];
}

export async function getMerchantWallets(merchantId: string) {
  const result = await sql`
    SELECT * FROM wallets
    WHERE merchant_id = ${merchantId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function updateWalletBalance(
  walletId: string,
  balanceBNB?: string,
  balanceUSDT?: string,
  balanceUSDC?: string
) {
  const result = await sql`
    UPDATE wallets
    SET
      balance_bnb = COALESCE(${balanceBNB || null}::NUMERIC, balance_bnb),
      balance_usdt = COALESCE(${balanceUSDT || null}::NUMERIC, balance_usdt),
      balance_usdc = COALESCE(${balanceUSDC || null}::NUMERIC, balance_usdc),
      last_checked = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${walletId}
    RETURNING *
  `;
  return result.rows[0];
}

// ===== ORDER QUERIES =====

export async function createOrder(data: {
  merchantId: string;
  walletId: string;
  orderNumber: string;
  amount: string;
  currency: string;
  customerReference?: string;
  expiresAt?: Date;
}) {
  const result = await sql`
    INSERT INTO orders (
      merchant_id, wallet_id, order_number, amount, currency,
      customer_reference, expires_at
    ) VALUES (
      ${data.merchantId}, ${data.walletId}, ${data.orderNumber},
      ${data.amount}::NUMERIC, ${data.currency},
      ${data.customerReference || null}, ${data.expiresAt || null}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getOrderById(orderId: string) {
  const result = await sql`
    SELECT * FROM orders WHERE id = ${orderId}
  `;
  return result.rows[0];
}

export async function getOrderByNumber(orderNumber: string) {
  const result = await sql`
    SELECT * FROM orders WHERE order_number = ${orderNumber}
  `;
  return result.rows[0];
}

export async function getMerchantOrders(merchantId: string, limit: number = 50) {
  const result = await sql`
    SELECT * FROM orders
    WHERE merchant_id = ${merchantId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  paymentAddress?: string,
  paidAt?: Date
) {
  const result = await sql`
    UPDATE orders
    SET
      status = ${status},
      payment_address = COALESCE(${paymentAddress || null}, payment_address),
      paid_at = COALESCE(${paidAt || null}, paid_at),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${orderId}
    RETURNING *
  `;
  return result.rows[0];
}

// ===== TRANSACTION QUERIES =====

export async function createTransaction(data: {
  orderId: string;
  walletId: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenAddress?: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
}) {
  const result = await sql`
    INSERT INTO transactions (
      order_id, wallet_id, tx_hash, from_address, to_address,
      amount, token_address, gas_used, gas_price, block_number
    ) VALUES (
      ${data.orderId}, ${data.walletId}, ${data.txHash},
      ${data.fromAddress}, ${data.toAddress}, ${data.amount}::NUMERIC,
      ${data.tokenAddress || null}, ${data.gasUsed || null},
      ${data.gasPrice || null}, ${data.blockNumber || null}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getTransactionByHash(txHash: string) {
  const result = await sql`
    SELECT * FROM transactions WHERE tx_hash = ${txHash}
  `;
  return result.rows[0];
}

export async function getOrderTransactions(orderId: string) {
  const result = await sql`
    SELECT * FROM transactions
    WHERE order_id = ${orderId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function updateTransactionStatus(
  txHash: string,
  status: string,
  confirmations?: number,
  blockNumber?: number
) {
  const result = await sql`
    UPDATE transactions
    SET
      status = ${status},
      confirmations = COALESCE(${confirmations || null}::INT, confirmations),
      block_number = COALESCE(${blockNumber || null}::BIGINT, block_number),
      updated_at = CURRENT_TIMESTAMP
    WHERE tx_hash = ${txHash}
    RETURNING *
  `;
  return result.rows[0];
}

// ===== WEBHOOK QUERIES =====

export async function createWebhook(data: {
  orderId: string;
  payload: any;
}) {
  const result = await sql`
    INSERT INTO webhooks (order_id, payload)
    VALUES (${data.orderId}, ${JSON.stringify(data.payload)}::JSONB)
    RETURNING *
  `;
  return result.rows[0];
}

export async function getPendingWebhooks(limit: number = 10) {
  const result = await sql`
    SELECT * FROM webhooks
    WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= CURRENT_TIMESTAMP)
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;
  return result.rows;
}

export async function updateWebhookStatus(
  webhookId: string,
  status: string,
  attempt: number,
  nextRetryAt?: Date,
  lastError?: string
) {
  const result = await sql`
    UPDATE webhooks
    SET
      status = ${status},
      attempt = ${attempt},
      next_retry_at = ${nextRetryAt || null},
      last_error = ${lastError || null},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${webhookId}
    RETURNING *
  `;
  return result.rows[0];
}

// ===== X402 SESSION QUERIES =====

export async function createX402Session(data: {
  merchantId: string;
  walletId: string;
  aiAgentId: string;
  amount: string;
  currency: string;
  expiresAt: Date;
  metadata?: any;
}) {
  const result = await sql`
    INSERT INTO x402_sessions (
      merchant_id, wallet_id, ai_agent_id, amount, currency,
      expires_at, metadata
    ) VALUES (
      ${data.merchantId}, ${data.walletId}, ${data.aiAgentId},
      ${data.amount}::NUMERIC, ${data.currency}, ${data.expiresAt},
      ${data.metadata ? JSON.stringify(data.metadata) : null}::JSONB
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getX402Session(sessionId: string) {
  const result = await sql`
    SELECT * FROM x402_sessions WHERE id = ${sessionId}
  `;
  return result.rows[0];
}

export async function updateX402SessionStatus(
  sessionId: string,
  status: string,
  txHash?: string,
  paidAt?: Date
) {
  const result = await sql`
    UPDATE x402_sessions
    SET
      status = ${status},
      tx_hash = COALESCE(${txHash || null}, tx_hash),
      paid_at = COALESCE(${paidAt || null}, paid_at),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sessionId}
    RETURNING *
  `;
  return result.rows[0];
}

// ===== API KEY QUERIES =====

export async function createApiKey(data: {
  merchantId: string;
  name: string;
  keyHash: string;
}) {
  const result = await sql`
    INSERT INTO api_keys (merchant_id, name, key_hash, is_active)
    VALUES (${data.merchantId}, ${data.name}, ${data.keyHash}, true)
    RETURNING *
  `;
  return result.rows[0];
}

export async function getMerchantApiKeys(merchantId: string) {
  const result = await sql`
    SELECT id, merchant_id, name, last_used, is_active, created_at, updated_at
    FROM api_keys
    WHERE merchant_id = ${merchantId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function getApiKeyByHash(keyHash: string) {
  const result = await sql`
    SELECT * FROM api_keys WHERE key_hash = ${keyHash} AND is_active = true
  `;
  return result.rows[0];
}

export async function updateApiKeyLastUsed(keyId: string) {
  const result = await sql`
    UPDATE api_keys
    SET last_used = CURRENT_TIMESTAMP
    WHERE id = ${keyId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function revokeApiKey(keyId: string) {
  const result = await sql`
    UPDATE api_keys
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${keyId}
    RETURNING *
  `;
  return result.rows[0];
}
