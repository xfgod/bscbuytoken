# BSC Payment Gateway - Complete Payment Processing System

A comprehensive, enterprise-grade payment gateway for BSC (Binance Smart Chain) that enables merchants to accept BNB, USDT, and USDC payments with real-time monitoring, automatic webhooks, and AI agent support via the x402 protocol.

## Features

### Core Payment Processing
- **Multi-Token Support**: Accept BNB, USDT, and USDC payments
- **HD Wallet Generation**: Automatic BIP44-compliant wallet derivation for each payment
- **Real-time Monitoring**: Continuous blockchain monitoring via RPC polling
- **Payment Detection**: Automatic detection of incoming transfers with confirmation tracking
- **Instant Confirmations**: Webhook callbacks triggered after 3+ block confirmations

### Developer Experience
- **RESTful API**: Simple, well-documented API for payment creation and monitoring
- **Webhook System**: Reliable webhook delivery with exponential backoff retry (max 5 attempts)
- **API Key Management**: Multiple API keys per merchant with usage tracking
- **Merchant Dashboard**: Full-featured dashboard for analytics, order management, and wallets
- **Public Checkout**: Customer-friendly payment checkout page with QR codes

### Advanced Features
- **x402 Protocol Support**: AI agents can self-transact using the x402 standard
- **Automatic Gas Distribution**: Main wallet can fund generated wallets with gas fees
- **Rate Limiting**: Built-in protection against abuse
- **HMAC Signature Verification**: Secure webhook authentication
- **Automatic Expiration**: Orders expire after configurable timeout
- **Transaction Archival**: Complete transaction history for audit trails

## Architecture

```
Frontend (Next.js 15 + React 19)
├── Homepage & Registration
├── Merchant Dashboard
└── Payment Checkout Page

Backend (Next.js API Routes)
├── /api/v1/merchants/* - Merchant management
├── /api/v1/orders/* - Payment order operations
├── /api/v1/wallets/* - Wallet management
├── /api/v1/x402/* - AI payment sessions
├── /api/v1/monitor/* - Payment monitoring
├── /api/v1/webhooks/* - Webhook delivery & retry
├── /api/public/orders/* - Public payment data
├── /api/cron/monitor/* - Automated blockchain monitoring
└── /api/cron/webhooks/* - Webhook retry processing

Web3 Layer
├── HD Wallet Derivation (viem)
├── BSC RPC Monitoring (JSON-RPC)
├── ERC20 Transfer Detection
└── Transaction Receipt Verification

Database (Neon PostgreSQL)
├── merchants - Payment merchant accounts
├── api_keys - API key management
├── wallets - Derived payment wallets
├── orders - Payment orders
├── transactions - Blockchain transactions
├── webhooks - Webhook delivery tracking
└── x402_sessions - AI payment sessions
```

## API Endpoints

### Authentication
All endpoints require `X-API-Key` header except public checkout endpoints.

```bash
curl -H "X-API-Key: your_api_key" https://api.example.com/api/v1/orders
```

### Merchant Management

#### Register Merchant
```bash
POST /api/v1/merchants/register
{
  "name": "My Business",
  "email": "contact@mybusiness.com",
  "bscAddress": "0x...",
  "webhookUrl": "https://yourapp.com/webhooks"
}
```

#### Get Merchant Info
```bash
GET /api/v1/merchants/info
```

### Orders

#### Create Payment Order
```bash
POST /api/v1/orders
{
  "orderNumber": "ORDER-123",
  "amount": "10.5",
  "currency": "USDT",
  "customerReference": "customer-id",
  "expiresIn": 3600
}
```

Response:
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "orderNumber": "ORDER-123",
    "amount": "10.5",
    "currency": "USDT",
    "paymentAddress": "0x...",
    "status": "pending",
    "expiresAt": "2024-03-13T10:00:00Z",
    "createdAt": "2024-03-13T09:00:00Z"
  }
}
```

#### Get Orders
```bash
GET /api/v1/orders?limit=50
```

#### Get Order Details
```bash
GET /api/v1/orders/{orderId}
```

### Wallets

#### Create Wallet
```bash
POST /api/v1/wallets
```

#### Get Wallets
```bash
GET /api/v1/wallets
```

#### Check Wallet Balance
```bash
GET /api/v1/monitor/wallet-balance?walletId={walletId}
```

### Payment Monitoring

#### Check Payment Status
```bash
POST /api/v1/monitor/check-orders
```

### x402 Protocol (AI Payments)

#### Create x402 Session
```bash
POST /api/v1/x402
{
  "aiAgentId": "agent-123",
  "amount": "1.5",
  "currency": "BNB",
  "expiresIn": 600,
  "metadata": { "model": "gpt-4", "usage": 150 }
}
```

Returns 402 Payment Required with payment details for AI agent to process.

#### Check Session Status
```bash
GET /api/v1/x402?sessionId={sessionId}
```

## Webhook Events

### Event: `payment.received`
Triggered when payment is first detected (0 confirmations).

```json
{
  "event": "payment.received",
  "orderId": "uuid",
  "orderNumber": "ORDER-123",
  "amount": "10.5",
  "currency": "USDT",
  "timestamp": 1678867200000
}
```

### Event: `payment.confirmed`
Triggered when payment reaches 3+ confirmations.

```json
{
  "event": "payment.confirmed",
  "orderId": "uuid",
  "orderNumber": "ORDER-123",
  "amount": "10.5",
  "currency": "USDT",
  "txHash": "0x...",
  "confirmations": 3,
  "timestamp": 1678867200000
}
```

### Event: `payment.expired`
Triggered when payment deadline is reached without payment.

```json
{
  "event": "payment.expired",
  "orderId": "uuid",
  "orderNumber": "ORDER-123",
  "amount": "10.5",
  "currency": "USDT",
  "timestamp": 1678867200000
}
```

### Webhook Verification

Verify webhooks using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
}

// Express middleware example
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  
  if (verifyWebhook(req.body, signature, process.env.WEBHOOK_SECRET)) {
    // Process webhook safely
    res.json({ received: true });
  } else {
    res.status(401).json({ error: 'Invalid signature' });
  }
});
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Neon PostgreSQL account
- BSC mainnet wallet with BNB for gas

### Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@host/dbname

# Web3
MNEMONIC_SEED=word word word ... (12-24 words)
MAIN_WALLET_ADDRESS=0x...
PRIVATE_KEY=0x...

# Security
API_SECRET=your-api-secret-key
WEBHOOK_TRIGGER_SECRET=your-webhook-secret
ENCRYPTION_KEY=your-encryption-key-min-32-chars
JWT_SECRET=your-jwt-secret

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Jobs
CRON_SECRET=your-cron-secret
```

### Installation

1. **Install Dependencies**
```bash
pnpm install
```

2. **Setup Database**
```bash
pnpm run setup-db
```

This creates all required tables and indexes.

3. **Run Development Server**
```bash
pnpm run dev
```

Visit http://localhost:3000 to access the application.

### Deployment to Vercel

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
- Go to vercel.com
- Import your repository
- Add environment variables
- Deploy

3. **Configure Cron Jobs**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/monitor",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/webhooks",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

## Security Best Practices

### API Keys
- Generate unique API keys per integration
- Rotate keys regularly
- Never commit keys to version control
- Use environment variables exclusively

### Private Keys
- Store private keys in environment variables only
- Never log or expose private keys
- Use HSM or key management service in production
- Implement key rotation procedures

### Webhook Security
- Always verify HMAC signatures
- Implement idempotency using order IDs
- Use HTTPS for webhook URLs
- Implement retry logic with exponential backoff
- Log all webhook events

### Database Security
- Use strong, unique database passwords
- Enable SSL/TLS for database connections
- Implement row-level security policies
- Regular automated backups
- Audit all access logs

## Monitoring and Analytics

### Dashboard
- Real-time payment statistics
- Transaction history and filtering
- Wallet balance monitoring
- API key usage metrics
- Webhook delivery status

### Logs
- Payment processing logs
- Webhook delivery logs
- Error tracking and alerting
- Transaction history

## Error Handling

### Common Errors

| Code | Message | Solution |
|------|---------|----------|
| 401 | Invalid API key | Check X-API-Key header |
| 400 | Invalid BSC address | Use valid 42-char EVM address |
| 409 | Order number exists | Use unique order numbers |
| 402 | Payment Required (x402) | Send payment to returned address |
| 500 | Internal error | Check server logs |

## Performance Considerations

- **Wallet Creation**: ~100ms per wallet
- **Order Creation**: ~50ms
- **Payment Detection**: ~5s RPC latency
- **Webhook Delivery**: ~1-5s per attempt
- **DB Queries**: ~10-50ms per query

### Optimization Tips

1. **Batch Operations**: Create multiple orders in single request
2. **Caching**: Cache frequently accessed data
3. **Rate Limiting**: Implement client-side rate limiting
4. **Connection Pooling**: Use connection pools for database
5. **Webhook Async**: Process webhooks asynchronously

## Troubleshooting

### Payments Not Detected

1. Check wallet address in order
2. Verify RPC endpoint connectivity
3. Check network (mainnet vs testnet)
4. Review transaction logs
5. Ensure 3+ confirmations

### Webhooks Not Delivering

1. Verify webhook URL is public
2. Check HMAC signature verification
3. Ensure merchant webhook secret matches
4. Review webhook delivery logs
5. Implement retry logic in your system

### Database Connection Issues

1. Verify DATABASE_URL is correct
2. Check network connectivity
3. Ensure credentials have correct permissions
4. Review database logs
5. Test connection manually

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Implement changes
4. Add tests if applicable
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

- Email: 431513121@qq.com
- TG: t.me/ctzhu
- Twitter: x.com/p4qcheng

## Roadmap

- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Advanced analytics dashboard
- [ ] Mobile app for merchant management
- [ ] Payment invoice generation
- [ ] Subscription/recurring payments
- [ ] KYC/AML integration
- [ ] Fiat on/off ramps
- [ ] NFT payment support
- [ ] Advanced fraud detection
- [ ] Multi-currency support (USD, EUR, etc.)

## Disclaimer

This payment system handles real cryptocurrency transactions. Use with caution and implement proper security measures. Always test thoroughly before production deployment. The developers are not responsible for lost funds due to misconfiguration or user error.

---

Built with ❤️ for the BSC community
