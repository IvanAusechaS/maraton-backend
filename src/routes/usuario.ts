import { Router } from "express";
import prisma from "../db/client";
import {
  globalErrorHandler,
  notFoundHandler,
} from "../error_manage/errorHandler";
import bcrypt from "bcrypt";

const router = Router();

// GET /api/usuarios
/**
 * @route GET /api/usuarios
 * @desc Obtener todos los usuarios
 * @access Public
 *
 * @description
 * User retrieval flow:
 * 1. Executes Prisma findMany query to retrieve all users
 * 2. Returns complete list of users without filtering
 * 3. Sends 200 status code with user array as JSON
 * 4. Delegates error handling to global error handler
 */
router.get("/", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany();
    res.status(200).json(usuarios);
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

/**
 * @route GET /api/usuarios/:id
 * @desc Obtener un usuario por ID
 * @access Public
 *
 * @description
 * User retrieval flow:
 * 1. Extracts user ID from URL parameters
 * 2. Converts string ID to number for Prisma query
 * 3. Executes Prisma findUnique query with ID filter
 * 4. If user found: Returns 200 with complete user object
 * 5. If user not found: Returns 404 with Spanish error message
 * 6. On database error: Delegates to global error handler
 *
 */
// GET /api/usuarios/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
    });
    if (usuario) {
      res.status(200).json(usuario);
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

// PUT /api/usuarios/:id
/**
 * @route PUT /api/usuarios/:id
 * @desc Actualizar un usuario por ID
 * @access Public
 *
 * @description
 * User update flow:
 * 1. Extracts user ID from URL parameters
 * 2. Validates presence of at least one updatable field in request body
 * 3. Validates email format if email is provided
 * 4. Checks for email uniqueness if email is provided
 * 5. Validates date format if fecha_nacimiento is provided
 * 6. Executes Prisma update query with provided fields
 * 7. If user not found: Returns 404 with Spanish error message
 * 8. On success: Returns 200 with updated user object
 * 9. On validation error: Returns 400 or 409 with specific Spanish error message
 * 10. On database error: Delegates to global error handler
 *
 */

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { email, username, fecha_nacimiento } = req.body;

  try {
    const userId = Number(id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar que venga al menos un campo a actualizar
    if (
      email === undefined &&
      username === undefined &&
      fecha_nacimiento === undefined
    ) {
      return res.status(400).json({ error: "Al menos un campo debe llenarse" });
    }

    // Construir objeto de datos de forma condicional
    const data: Record<string, any> = {};

    // Validar email solo si viene
    if (email !== undefined) {
      const emailTrimmed = String(email).toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        return res.status(400).json({ error: "Formato de email inválido" });
      }

      // Comprobar que el email no esté usado por otro usuario (ignorar el actual)
      const existentUser = await prisma.usuario.findFirst({
        where: {
          email: emailTrimmed,
          NOT: { id: userId },
        },
      });

      if (existentUser) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }

      data.email = emailTrimmed;
    }

    // Validar username solo si viene
    if (username !== undefined) {
      const usernameTrimmed = String(username).trim();
      if (usernameTrimmed.length === 0) {
        return res.status(400).json({ error: "Username no puede estar vacío" });
      }
      data.username = usernameTrimmed;
    }

    // Validar fecha_nacimiento solo si viene
    if (fecha_nacimiento !== undefined) {
      const birthDate = new Date(fecha_nacimiento);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          error: "Formato de fecha inválido. Use formato ISO: YYYY-MM-DD",
        });
      }
      data.fecha_nacimiento = birthDate;
    }

    // Si por alguna razón data quedó vacío (redundante porque ya chequeamos arriba), evitar update innecesario
    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({ error: "No hay campos válidos para actualizar" });
    }

    const updatedUsuario = await prisma.usuario.update({
      where: { id: userId },
      data,
    });

    return res.status(200).json(updatedUsuario);
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

// PUT /api/usuarios/:id/change-password
/**
 * @route PUT /api/usuarios/:id/change-password
 * @desc Cambiar contraseña de un usuario
 * @access Public
 *
 * @description
 * Password change flow:
 * 1. Extracts user ID from URL parameters
 * 2. Validates presence of currentPassword and newPassword in request body
 * 3. Validates new password format (min 8 chars, uppercase, lowercase, number, special char)
 * 4. Retrieves user from database
 * 5. Verifies current password matches stored hash
 * 6. Hashes new password with bcrypt
 * 7. Updates user password in database
 * 8. Returns success message
 * 9. On validation error: Returns 400 with specific error message
 * 10. On authentication error: Returns 401 for wrong current password
 * 11. On database error: Delegates to global error handler
 */
router.put("/:id/change-password", async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    const userId = Number(id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    // Validar que vengan los campos requeridos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Contraseña actual y nueva contraseña son requeridas",
      });
    }

    // Buscar el usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar que la contraseña actual sea correcta
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      usuario.password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "La contraseña actual es incorrecta" });
    }

    // Validar formato de la nueva contraseña
    const passRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/;
    if (!passRegex.test(newPassword)) {
      return res.status(400).json({
        error:
          "La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&#.)",
      });
    }

    // Hash de la nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar la contraseña en la base de datos
    await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

// DELETE /api/usuarios/:id
/**
 * @route DELETE /api/usuarios/:id
 * @desc Eliminar un usuario por ID
 * @access Public
 *
 * @description
 * User deletion flow:
 * 1. Extracts user ID from URL parameters
 * 2. Converts string ID to number for Prisma query
 * 3. Executes Prisma findUnique query to check if user exists
 * 4. If user not found: Returns 404 with Spanish error message
 * 5. If user found: Executes Prisma delete query
 * 6. On success: Returns 204 No Content status
 * 7. On database error: Delegates to global error handler
 *
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
    });
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    await prisma.usuario.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

export default router;
