import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  throw new Error('DATABASE_URL is not defined in .env')
}

// Log connection pooling topology advisory for high-concurrency production deployments
if (process.env.NODE_ENV === 'production' && dbUrl.includes('neon.tech') && !dbUrl.includes('-pooler')) {
  console.warn(
    '⚠️  [Database Notice] Neon database connection is using direct endpoint. For 10,000+ concurrent users, switch to the Neon PgBouncer pooled endpoint (hostname containing "-pooler").'
  )
}

const adapter = new PrismaNeon({ connectionString: dbUrl })
export const prisma = new PrismaClient({ adapter })
