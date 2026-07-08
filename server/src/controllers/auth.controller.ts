import { Request, Response } from 'express'
import * as userModel from '../models/user.model'
import { hashPassword, comparePassword } from '../utils/password.utils'
import { signToken } from '../utils/jwt.utils'

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await userModel.findByEmail(email)
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken({ id: user.id })

    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        },
    })
}