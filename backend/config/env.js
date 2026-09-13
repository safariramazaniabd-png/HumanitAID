const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';
const isDemo = process.env.DEMO_MODE === 'true';

if (isProduction && isDemo) {
  console.error('[FATAL] DEMO_MODE cannot be true in production. Set DEMO_MODE=false');
  process.exit(1);
}

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('[FATAL] JWT_SECRET must be set and at least 32 characters in production');
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || (isProduction ? (() => { throw new Error('JWT_SECRET required'); })() : crypto.randomBytes(32).toString('hex')),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  demoMode: isDemo,
  corsOrigin: process.env.CORS_ORIGIN || (isProduction ? 'https://www.humanit-aid.org' : 'http://localhost:8080'),
  siteUrl: process.env.SITE_URL || (isProduction ? 'https://www.humanit-aid.org' : 'http://localhost:8080'),
  adminUrl: process.env.ADMIN_URL || (isProduction ? 'https://www.humanit-aid.org/admin' : 'http://localhost:8080/admin'),
  databaseUrl: process.env.DATABASE_URL || '',
  directUrl: process.env.DIRECT_URL || '',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  flutterwave: {
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  },
  email: {
    apiKey: process.env.EMAIL_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@humanit-aid.org',
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    bucket: process.env.STORAGE_BUCKET || '',
    accessKey: process.env.STORAGE_ACCESS_KEY || '',
    secretKey: process.env.STORAGE_SECRET_KEY || '',
    url: process.env.STORAGE_URL || '',
  },
  upload: {
    maxSizeMB: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10),
  },
};
