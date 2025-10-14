import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db/client";
import loginLimiter from "../middleware/rateLimit";
import verify from "../middleware/verifyToken";
import sendEmail from "../utils/sendEmail";

const router = Router();

// POST /auth/register - Registro de usuario
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, username, birth_date } = req.body;
    //console.log({ email, password, username, birth_date })

    // Validación de campos requeridos
    if (!email || !password || !username || !birth_date) {
      return res.status(400).json({
        error:
          "Todos los campos son requeridos (email, password, username, fecha_nacimiento)",
      });
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }

    console.log("Password recibido:", password);



    // Validación de longitud de contraseña
    const passRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/; // Son validos los puntos para las contraseñas
    console.log("Regex test:", passRegex.test(password));
    if (!passRegex.test(password)) {
      return res.status(400).json({
        error: "La contraseña no cumple con los requerimientos",
      });
    }

    // Verificar si el email ya existe
    const existentUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existentUser) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Convertir fecha_nacimiento a Date
    const birthDate = new Date(birth_date);

    // Validar que la fecha sea válida
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        error: "Formato de fecha inválido. Use formato ISO: YYYY-MM-DD",
      });
    }

    const age: Number = new Date().getFullYear() - birthDate.getFullYear();

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        username: username.trim(),
        fecha_nacimiento: birthDate,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fecha_nacimiento: true,
      },
    });

    Object.assign(nuevoUsuario, { edad: age });

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      usuario: nuevoUsuario,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      error: "Error al registrar usuario, intentalo de nuevo mas tarde",
    });
  }
});

// POST /auth/login - Inicio de sesión
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validación de campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        error: "Email y contraseña son requeridos",
      });
    }

    // Buscar usuario por email
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!usuario) {
      return res.status(401).json({
        error: "Correo o contraseña invalidos",
      });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({
        error: "Correo o contraseña invalidos",
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: usuario.id.toString(),
        email: usuario.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );

    // ✅ GUARDAR TOKEN EN COOKIE HTTP-ONLY
    res.cookie('authToken', token, {
      httpOnly: true,  // ✅ NO accesible desde JavaScript (previene XSS)
      secure: process.env.NODE_ENV === 'production', // ✅ Solo HTTPS en producción
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ Para CORS
      maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
      path: '/',
    });

    // ✅ NO ENVIAR EL TOKEN EN EL JSON (solo datos del usuario)
    res.status(200).json({
      message: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        email: usuario.email,
        username: usuario.username,
        fecha_nacimiento: usuario.fecha_nacimiento,
      },
      // ❌ NO incluir "token" aquí
    });
  } catch (error) {
    console.error("Error en login:", error);
    res
      .status(500)
      .json({ error: "Error al iniciar sesión, intentalo de nuevo mas tarde" });
  }
});

// POST /auth/logout - Cierre de sesión
router.post("/logout", verify, async (req: Request, res: Response) => {
  // ✅ Limpiar la cookie HTTP-only
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  
  return res.status(200).json({ message: "Sesión cerrada correctamente" });
});

// POST /auth/recover - Solicitar restablecimiento de contraseña
router.post("/recover", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validación de campo requerido
    if (!email) {
      return res.status(400).json({ error: "El email es requerido" });
    }

    /**
     * Find user by email.
     * May throw error if user doesn't exist.
     */
    const user = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    /**
     * Return generic message if user not found.
     * Prevents email enumeration attacks.
     */
    if (!user) {
      return res.status(202).json({
        message: "Si el correo es válido recibirá instrucciones",
      });
    }

    /**
     * Generate secure reset token.
     * Token expires in 1 hour for security.
     */
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    /**
     * Store reset token and expiration in user document.
     * Token expires in 1 hour (3600000 ms).
     */
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        resetPasswordExpires: resetPasswordExpires,
        resetPasswordToken: resetToken,
      },
    });

    /**
     * Create password reset URL.
     * Points to frontend recovery page.
     */
    const resetUrl = `http://localhost:5174/restablecer?token=${resetToken}`;

    /**
     * Send reset email with instructions.
     * Uses email utility service.
     */
    await sendEmail(
      user.email,
      "Restablecer contraseña",
      `Haz clic en este enlace para restablecer tu contraseña: ${resetUrl}`
    );

    /**
     * Return success confirmation.
     */
    return res.status(200).json({
      message: "Revisa tu correo para continuar",
    });
  } catch (error) {
    console.error("Error en recover:", error);
    return res.status(500).json({
      message: "Inténtalo de nuevo más tarde",
    });
  }
});

// POST /auth/reset/:token - Restablecer contraseña
router.post("/reset/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validación de campos requeridos
    if (!password || !confirmPassword) {
      return res.status(400).json({
        error: "La contraseña y confirmación son requeridas",
      });
    }

    /**
     * Validate password confirmation match.
     */
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Las contraseñas no coinciden",
      });
    }

    /**
     * Validate password strength requirements.
     * Must contain: 8+ chars, uppercase, lowercase, number, special char.
     */
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/; // Son validos los puntos para las contraseñas
    if (!regex.test(password)) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial",
      });
    }

    /**
     * Verify and decode reset token.
     * Throws error if token is invalid or expired.
     */
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    /**
     * Find user with valid reset token.
     * Ensures token hasn't been used and hasn't expired.
     */
    const user = await prisma.usuario.findFirst({
      where: {
        id: decoded.userId,
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Greater than current date
        },
      },
    });

    /**
     * Reject if user not found or token invalid.
     */
    if (!user) {
      return res.status(400).json({
        message: "Token inválido o expirado",
      });
    }

    /**
     * Hash new password.
     * Password will be securely hashed before storage.
     */
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    /**
     * Update user password and invalidate reset token.
     * Prevents token reuse for security.
     */
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    /**
     * Return success confirmation.
     */
    return res.status(200).json({
      message: "Contraseña actualizada",
    });
  } catch (error) {
    console.error("Error en reset:", error);
    return res.status(500).json({
      message: "Inténtalo de nuevo más tarde",
    });
  }
});

export default router;
