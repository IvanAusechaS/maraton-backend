import { Router } from 'express'
import prisma from '../db/client'
import { globalErrorHandler, notFoundHandler } from '../error_manage/errorHandler';

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
router.get('/', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany()
    res.status(200).json(usuarios)
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
})

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
router.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
    })
    if (usuario) {
      res.status(200).json(usuario)
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' })
    }
} catch (error) {
    return globalErrorHandler(error, req, res);
  }
})

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
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { email, username, fecha_nacimiento} = req.body
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
    })
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    if (!email && !username && !fecha_nacimiento) {
      return res.status(400).json({ error: 'Al menos un campo debe llenarse' })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }
    const existentUser = await prisma.usuario.findUnique({
      where: { email },
    });
    if (existentUser) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    const birthDate = new Date(fecha_nacimiento);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        error: "Formato de fecha inválido. Use formato ISO: YYYY-MM-DD",
      });
    }
    const updatedUsuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { email: email.toLowerCase().trim(), username: username.trim(), fecha_nacimiento: birthDate },
    });
    res.status(200).json(updatedUsuario);
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
})

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
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
    }) 
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    await prisma.usuario.delete({
      where: { id: Number(id) },
    })
    res.status(204).send()
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

export default router;
