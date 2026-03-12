import { sql } from '@vercel/postgres';

async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    // Create merchants table
    await sql`
      CREATE TABLE IF NOT EXISTS merchants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        api_key VARCHAR(255) NOT NULL UNIQUE,
        api_key_hash VARCHAR(255) NOT NULL,
        webhook_url TEXT,
        webhook_secret VARCHAR(255),
        bsc_address VARCHAR(42) NOT NULL,
        callback_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ merchants table created');

    // Create wallets table
    await sql`
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        address VARCHAR(42) NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        derivation_path VARCHAR(100) NOT NULL,
        balance_bnb NUMERIC(18, 8) DEFAULT 0,
        balance_usdt NUMERIC(18, 6) DEFAULT 0,
        balance_usdc NUMERIC(18, 6) DEFAULT 0,
        last_checked TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ wallets table created');

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE SET NULL,
        order_number VARCHAR(255) NOT NULL UNIQUE,
        amount NUMERIC(18, 8) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_address VARCHAR(42),
        customer_reference VARCHAR(255),
        expires_at TIMESTAMP,
        paid_at TIMESTAMP,
        callback_sent_at TIMESTAMP,
        callback_attempts INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ orders table created');

    // Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        tx_hash VARCHAR(66) NOT NULL UNIQUE,
        from_address VARCHAR(42) NOT NULL,
        to_address VARCHAR(42) NOT NULL,
        amount NUMERIC(18, 8) NOT NULL,
        token_address VARCHAR(42),
        gas_used NUMERIC(18, 0),
        gas_price NUMERIC(18, 0),
        block_number BIGINT,
        confirmations INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ transactions table created');

    // Create webhooks table
    await sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        attempt INT DEFAULT 0,
        next_retry_at TIMESTAMP,
        last_error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ webhooks table created');

    // Create x402_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS x402_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE SET NULL,
        ai_agent_id VARCHAR(255) NOT NULL,
        amount NUMERIC(18, 8) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_address VARCHAR(42),
        tx_hash VARCHAR(66),
        expires_at TIMESTAMP NOT NULL,
        paid_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ x402_sessions table created');

    // Create api_keys table
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) NOT NULL UNIQUE,
        last_used TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ api_keys table created');

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_merchants_email ON merchants(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_merchants_api_key ON merchants(api_key)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wallets_merchant_id ON wallets(merchant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_wallet_id ON orders(wallet_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_order_id ON webhooks(order_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_x402_merchant_id ON x402_sessions(merchant_id)`;
    console.log('✓ All indexes created');

    console.log('\n✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
