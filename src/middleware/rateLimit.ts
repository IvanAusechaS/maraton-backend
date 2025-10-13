import { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // 5 intentos
  message: {
    error:
      "Demasiados intentos fallidos. Por favor, intente nuevamente en 10 minutos.",
  },
  standardHeaders: true, // Retorna info de rate limit en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
  skipSuccessfulRequests: true, // Cuenta tanto intentos exitosos como fallidos
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error:
        "Demasiados intentos de inicio de sesión. Por favor, intente nuevamente en 10 minutos.",
    });
  },
});

export default loginLimiter;
