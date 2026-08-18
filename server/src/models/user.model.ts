import { prisma } from '../config/db'
import { Goal } from '../generated/prisma'

export const findByEmail = (email: string) => {
    return prisma.user.findUnique({ where: { email } })
}

export const findById = (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            height: true,
            weight: true,
            age: true,
            goal: true,
            createdAt: true,
        },
    })
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

export const updateUser = (
    id: string,
    data: {
        firstName?: string;
        lastName?: string;
        height?: number;
        weight?: number;
        age?: number;
        goal?: Goal;
    }
) => {
    return prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            height: true,
            weight: true,
            age: true,
            goal: true,
            createdAt: true,
        },
    })
}