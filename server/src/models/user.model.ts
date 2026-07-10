import { prisma } from '../config/db'
import { Goal } from '../generated/prisma'

export const findByEmail = (email: string) => {
    return prisma.user.findUnique({ where: { email } })
}

export const createUser = (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    height: number;
    weight: number;
    age: number;
    goal: Goal;
}) => {
    return prisma.user.create({ data })
}