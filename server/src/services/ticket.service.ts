import { prisma } from '../config/db'
import { TicketCategory, TicketStatus } from '@prisma/client'

export interface SupportTicket {
  id: string
  userId?: string | null
  userEmail: string
  userName?: string
  category: TicketCategory
  subject: string
  message: string
  status: TicketStatus
  adminNotes?: string | null
  createdAt: string
  updatedAt: string
}

export async function getAllTickets(statusFilter?: TicketStatus): Promise<SupportTicket[]> {
  const where: any = {}
  if (statusFilter && ['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(statusFilter)) {
    where.status = statusFilter
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return tickets.map((t) => ({
    id: t.id,
    userId: t.userId,
    userEmail: t.userEmail,
    userName: t.userName || undefined,
    category: t.category,
    subject: t.subject,
    message: t.message,
    status: t.status,
    adminNotes: t.adminNotes || undefined,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))
}

export async function createTicket(ticketData: {
  userId?: string | null
  userEmail: string
  userName?: string
  category: TicketCategory
  subject: string
  message: string
}): Promise<SupportTicket> {
  const t = await prisma.supportTicket.create({
    data: {
      userId: ticketData.userId || null,
      userEmail: ticketData.userEmail,
      userName: ticketData.userName,
      category: ticketData.category,
      subject: ticketData.subject,
      message: ticketData.message,
      status: 'OPEN',
    },
  })

  return {
    id: t.id,
    userId: t.userId,
    userEmail: t.userEmail,
    userName: t.userName || undefined,
    category: t.category,
    subject: t.subject,
    message: t.message,
    status: t.status,
    adminNotes: t.adminNotes || undefined,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

export async function updateTicket(
  id: string,
  updates: { status?: TicketStatus; adminNotes?: string }
): Promise<SupportTicket | null> {
  try {
    const t = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.adminNotes !== undefined ? { adminNotes: updates.adminNotes } : {}),
      },
    })

    return {
      id: t.id,
      userId: t.userId,
      userEmail: t.userEmail,
      userName: t.userName || undefined,
      category: t.category,
      subject: t.subject,
      message: t.message,
      status: t.status,
      adminNotes: t.adminNotes || undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }
  } catch {
    return null
  }
}

export async function deleteTicket(id: string): Promise<boolean> {
  try {
    await prisma.supportTicket.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}

export async function getTicketStats(): Promise<{ total: number; open: number; inProgress: number; resolved: number }> {
  const [total, open, inProgress, resolved] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
  ])

  return { total, open, inProgress, resolved }
}
