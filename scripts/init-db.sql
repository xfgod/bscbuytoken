-- BSC Payment Gateway Database Schema

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  api_key_hash VARCHAR(255) NOT NULL UNIQUE,
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  main_wallet_address VARCHAR(42) NOT NULL,
  settlement_address VARCHAR(42) NOT NULL,
  gas_threshold DECIMAL(18, 8) DEFAULT 0.05,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_api_key_hash ON merchants(api_key_hash);

-- Wallets table (HD-derived addresses)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  address VARCHAR(42) NOT NULL UNIQUE,
  derivation_path VARCHAR(100) NOT NULL,
  index_number INTEGER NOT NULL,
  balance DECIMAL(18, 8) DEFAULT 0,
  bnb_balance DECIMAL(18, 8) DEFAULT 0,
  usdt_balance DECIMAL(18, 8) DEFAULT 0,
  usdc_balance DECIMAL(18, 8) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallets_merchant_id ON wallets(merchant_id);
CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_wallets_active ON wallets(merchant_id, is_active);

-- Orders/Payments table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  order_number VARCHAR(100) NOT NULL UNIQUE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  payment_address VARCHAR(42) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  token_type VARCHAR(10) NOT NULL CHECK (token_type IN ('BNB', 'USDT', 'USDC')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'expired', 'failed')),
  transaction_hash VARCHAR(66),
  received_amount DECIMAL(18, 8),
  confirmations INTEGER DEFAULT 0,
  required_confirmations INTEGER DEFAULT 1,
  expires_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_orders_wallet_id ON orders(wallet_id);
CREATE INDEX idx_orders_payment_address ON orders(payment_address);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Transactions table (for tracking all movements)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_hash VARCHAR(66) NOT NULL UNIQUE,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  token_type VARCHAR(10) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('inbound', 'outbound', 'gas_fee', 'settlement', 'consolidation')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  block_number BIGINT,
  confirmations INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Webhooks/Callbacks table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  response_code INTEGER,
  response_body TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  failed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_logs_merchant_id ON webhook_logs(merchant_id);
CREATE INDEX idx_webhook_logs_order_id ON webhook_logs(order_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_next_retry ON webhook_logs(next_retry_at) WHERE status = 'pending';

-- API Keys table (for merchant API access control)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  permissions VARCHAR[] DEFAULT ARRAY['read', 'write'],
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_merchant_id ON api_keys(merchant_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- x402 Payment Sessions (for AI agents)
CREATE TABLE IF NOT EXISTS x402_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ai_agent_id VARCHAR(255) NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  expires_at TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_x402_sessions_order_id ON x402_sessions(order_id);
CREATE INDEX idx_x402_sessions_ai_agent_id ON x402_sessions(ai_agent_id);
CREATE INDEX idx_x402_sessions_token ON x402_sessions(session_token);
CREATE INDEX idx_x402_sessions_status ON x402_sessions(status);
