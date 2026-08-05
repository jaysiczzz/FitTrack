import { PrismaClient } from '../generated/prisma'
import { PrismaNeon } from '@prisma/adapter-neon'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env')
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })
