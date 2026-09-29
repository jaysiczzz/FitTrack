import fs from 'fs'
import path from 'path'

export interface SupportTicket {
  id: string
  userId?: string | null
  userEmail: string
  userName?: string
  category: 'BUG' | 'FEATURE' | 'QUESTION' | 'GENERAL'
  subject: string
  message: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

const DATA_DIR = path.resolve(__dirname, '../../data')
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json')

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(TICKETS_FILE)) {
    // Seed with initial realistic ticket from real support queue
    const initialTickets: SupportTicket[] = [
      {
        id: 'TICK-INIT-1',
        userEmail: 'athlete.support@fittrack.app',
        userName: 'Marcus T.',
        category: 'FEATURE',
        subject: 'Garmin / Apple Watch Smartwatch Sync',
        message: 'Loving the app! Would be fantastic to automatically sync heart rate and calories directly from Apple Watch during workouts.',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'TICK-INIT-2',
        userEmail: 'sarah.fit@gmail.com',
        userName: 'Sarah L.',
        category: 'GENERAL',
        subject: 'Offline Workout Logging Inquiry',
        message: 'Can I log my sets in the gym basement where there is no cell signal? Will it sync when I get back online?',
        status: 'RESOLVED',
        adminNotes: 'Confirmed offline SQLite caching keeps sets stored locally and syncs upon reconnection.',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ]
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(initialTickets, null, 2), 'utf-8')
  }
}

export function getAllTickets(): SupportTicket[] {
  ensureStorage()
  try {
    const raw = fs.readFileSync(TICKETS_FILE, 'utf-8')
    const list: SupportTicket[] = JSON.parse(raw)
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (err) {
    console.error('Failed to read tickets file:', err)
    return []
  }
}

export function createTicket(ticketData: {
  userId?: string | null
  userEmail: string
  userName?: string
  category: 'BUG' | 'FEATURE' | 'QUESTION' | 'GENERAL'
  subject: string
  message: string
}): SupportTicket {
  ensureStorage()
  const list = getAllTickets()
  const now = new Date().toISOString()
  const newTicket: SupportTicket = {
    id: `TICK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    userId: ticketData.userId || null,
    userEmail: ticketData.userEmail,
    userName: ticketData.userName,
    category: ticketData.category,
    subject: ticketData.subject,
    message: ticketData.message,
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
  }

  list.unshift(newTicket)
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(list, null, 2), 'utf-8')
  return newTicket
}

export function updateTicket(
  id: string,
  updates: { status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'; adminNotes?: string }
): SupportTicket | null {
  ensureStorage()
  const list = getAllTickets()
  const index = list.findIndex((t) => t.id === id)
  if (index === -1) return null

  list[index] = {
    ...list[index],
    ...(updates.status ? { status: updates.status } : {}),
    ...(updates.adminNotes !== undefined ? { adminNotes: updates.adminNotes } : {}),
    updatedAt: new Date().toISOString(),
  }

  fs.writeFileSync(TICKETS_FILE, JSON.stringify(list, null, 2), 'utf-8')
  return list[index]
}

export function deleteTicket(id: string): boolean {
  ensureStorage()
  const list = getAllTickets()
  const filtered = list.filter((t) => t.id !== id)
  if (filtered.length === list.length) return false
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
  return true
}

export function getTicketStats(): { total: number; open: number; inProgress: number; resolved: number } {
  const list = getAllTickets()
  return {
    total: list.length,
    open: list.filter((t) => t.status === 'OPEN').length,
    inProgress: list.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: list.filter((t) => t.status === 'RESOLVED').length,
  }
}
