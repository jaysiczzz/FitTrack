import { Request, Response, NextFunction } from 'express'
import { ZodTypeAny, ZodError } from 'zod'

/**
 * Express middleware that validates the incoming request against a Zod schema.
 * Replaces req.body, req.query, or req.params with the parsed/sanitized data.
 */
export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed: any = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      // Replace with strictly parsed and sanitized data (strips unknown fields)
      if (parsed?.body !== undefined) req.body = parsed.body
      if (parsed?.query !== undefined) req.query = parsed.query
      if (parsed?.params !== undefined) req.params = parsed.params

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.flatten().fieldErrors
        const firstMessage =
          Object.values(fieldErrors).flat().filter(Boolean)[0] || 'Validation failed'

        return res.status(400).json({
          error: firstMessage,
          details: fieldErrors,
        })
      }
      next(error)
    }
  }
}
