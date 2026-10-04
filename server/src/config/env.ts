/**
 * Environment Configuration & Startup Validator for FitTrack Server
 */

const requiredInAllEnvs = [
  { key: 'DATABASE_URL', description: 'PostgreSQL/Neon connection string' },
  { key: 'JWT_SECRET', description: 'Secret key for signing auth JSON Web Tokens' },
];

const requiredInProduction = [
  { key: 'CLIENT_ORIGIN', description: 'Allowed frontend origin(s) for CORS' },
];

export function validateEnv(): void {
  const missingErrors: string[] = [];
  const missingWarnings: string[] = [];

  for (const item of requiredInAllEnvs) {
    if (!process.env[item.key]?.trim()) {
      missingErrors.push(`  ❌ ${item.key}: Missing required environment variable (${item.description})`);
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    for (const item of requiredInProduction) {
      if (!process.env[item.key]?.trim()) {
        missingWarnings.push(`  ⚠️  ${item.key}: Missing recommended production variable (${item.description})`);
      }
    }

    if (!process.env.SMTP_PASS?.trim()) {
      missingWarnings.push('  ⚠️  SMTP_PASS: Email delivery will be unavailable (password reset emails will fail)');
    }
    if (!process.env.GEMINI_API_KEY?.trim()) {
      missingWarnings.push('  ⚠️  GEMINI_API_KEY: AI Coach chat & food scanner features will be unavailable');
    }
  }

  if (missingErrors.length > 0) {
    console.error('\n======================================================');
    console.error('❌ FITTRACK SERVER STARTUP ERROR: Missing Required Environment Variables');
    console.error('======================================================');
    missingErrors.forEach((err) => console.error(err));
    console.error('\n👉 Solution: Provide the missing variables in server/.env or your deployment environment.');
    console.error('======================================================\n');
    throw new Error(`Startup failed: Missing required environment variables (${missingErrors.length})`);
  }

  if (missingWarnings.length > 0) {
    console.warn('\n======================================================');
    console.warn('⚠️  FITTRACK SERVER STARTUP NOTICE: Recommended Variables Not Set');
    console.warn('======================================================');
    missingWarnings.forEach((warn) => console.warn(warn));
    console.warn('======================================================\n');
  }
}

// Initial fail-fast validation on module import
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env');
}

export const jwtSecret = process.env.JWT_SECRET as string;
export const isProduction = process.env.NODE_ENV === 'production';