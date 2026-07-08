import { prisma } from '../config/db'

export const findByEmail = (email: string) => {
    return prisma.user.findUnique({ where: { email } })
}

export const createUser = (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}) => {
    return prisma.user.create({ data })
}