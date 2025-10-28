import { Router, Request, Response } from "express";
import prisma from "../db/client";
import { globalErrorHandler } from "../error_manage/errorHandler";
import verify from "../middleware/verifyToken";

const router = Router();

/**
 * POST /api/comments
 * Crea un nuevo comentario asociado a una película.
 * Soporta comentarios principales y respuestas (comentarios anidados).
 *
 * @route POST /api/comments
 * @middleware verify - Middleware de autenticación JWT
 * @access Private
 *
 * @param {Request} req - Objeto de petición Express
 * @param {number} req.body.peliculaId - ID de la película a comentar
 * @param {string} req.body.mensaje - Contenido del comentario
 * @param {number} [req.body.comentarioPadreId] - ID del comentario padre (opcional, para respuestas)
 * @param {number} req.user.userId - ID del usuario autenticado (agregado por middleware)
 * @param {Response} res - Objeto de respuesta Express
 *
 * @returns {Object} 201 - Comentario creado exitosamente
 * @returns {Object} 400 - Validación fallida (campos requeridos faltantes)
 * @returns {Object} 404 - Película o comentario padre no encontrados
 * @returns {Object} 500 - Error interno del servidor
 */
router.post("/", verify, async (req: Request, res: Response) => {
  const { peliculaId, mensaje, comentarioPadreId } = req.body;
  const userId: number = req.user.userId; // ✅ Ya viene como número del JWT

  try {
    // Validar entrada
    if (!peliculaId || !mensaje) {
      return res.status(400).json({
        error: "peliculaId y mensaje son campos requeridos",
      });
    }

    if (!mensaje.trim()) {
      return res.status(400).json({
        error: "El mensaje no puede estar vacío",
      });
    }

    // Verificar que la película existe
    const pelicula = await prisma.pelicula.findUnique({
      where: { id: Number(peliculaId) },
    });

    if (!pelicula) {
      return res.status(404).json({
        error: "Película no encontrada",
      });
    }

    // Si es una respuesta, verificar que el comentario padre existe
    if (comentarioPadreId) {
      const comentarioPadre = await prisma.comentario.findUnique({
        where: { id: Number(comentarioPadreId) },
      });

      if (!comentarioPadre) {
        return res.status(404).json({
          error: "Comentario padre no encontrado",
        });
      }

      // Verificar que el comentario padre pertenece a la misma película
      if (comentarioPadre.peliculaId !== Number(peliculaId)) {
        return res.status(400).json({
          error: "El comentario padre no pertenece a esta película",
        });
      }
    }

    // Crear el comentario
    const nuevoComentario = await prisma.comentario.create({
      data: {
        mensaje: mensaje.trim(),
        usuarioId: Number(userId),
        peliculaId: Number(peliculaId),
        comentarioPadreId: comentarioPadreId ? Number(comentarioPadreId) : null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Comentario creado exitosamente",
      comentario: nuevoComentario,
    });
  } catch (error) {
    console.error("Error al crear comentario:", error);
    return globalErrorHandler(error, req, res);
  }
});

/**
 * GET /api/comments/:movieId
 * Obtiene todos los comentarios de una película específica.
 * Incluye comentarios principales y sus respuestas anidadas.
 *
 * @route GET /api/comments/:movieId
 * @access Public
 *
 * @param {Request} req - Objeto de petición Express
 * @param {string} req.params.movieId - ID de la película
 * @param {Response} res - Objeto de respuesta Express
 *
 * @returns {Object} 200 - Lista de comentarios obtenida exitosamente
 * @returns {Object} 404 - Película no encontrada
 * @returns {Object} 500 - Error interno del servidor
 */
router.get("/:movieId", async (req: Request, res: Response) => {
  const { movieId } = req.params;

  try {
    // Verificar que la película existe
    const pelicula = await prisma.pelicula.findUnique({
      where: { id: Number(movieId) },
    });

    if (!pelicula) {
      return res.status(404).json({
        error: "Película no encontrada",
      });
    }

    // Obtener todos los comentarios principales (sin padre) con sus respuestas anidadas
    const comentarios = await prisma.comentario.findMany({
      where: {
        peliculaId: Number(movieId),
        comentarioPadreId: null, // Solo comentarios principales
      },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        respuestas: {
          include: {
            usuario: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            respuestas: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc", // Más recientes primero
      },
    });

    res.status(200).json({
      peliculaId: Number(movieId),
      total: comentarios.length,
      comentarios,
    });
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    return globalErrorHandler(error, req, res);
  }
});

/**
 * PUT /api/comments/:id
 * Actualiza un comentario existente.
 * Solo el autor del comentario puede editarlo.
 *
 * @route PUT /api/comments/:id
 * @middleware verify - Middleware de autenticación JWT
 * @access Private
 *
 * @param {Request} req - Objeto de petición Express
 * @param {string} req.params.id - ID del comentario a actualizar
 * @param {string} req.body.mensaje - Nuevo contenido del comentario
 * @param {number} req.user.userId - ID del usuario autenticado (agregado por middleware)
 * @param {Response} res - Objeto de respuesta Express
 *
 * @returns {Object} 200 - Comentario actualizado exitosamente
 * @returns {Object} 400 - Validación fallida (mensaje vacío)
 * @returns {Object} 403 - No autorizado (no es el autor del comentario)
 * @returns {Object} 404 - Comentario no encontrado
 * @returns {Object} 500 - Error interno del servidor
 */
router.put("/:id", verify, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { mensaje } = req.body;
  const userId: number = req.user.userId; // ✅ Ya viene como número del JWT

  try {
    // Validar entrada
    if (!mensaje) {
      return res.status(400).json({
        error: "El mensaje es requerido",
      });
    }

    if (!mensaje.trim()) {
      return res.status(400).json({
        error: "El mensaje no puede estar vacío",
      });
    }

    // Verificar que el comentario existe
    const comentarioExistente = await prisma.comentario.findUnique({
      where: { id: Number(id) },
    });

    if (!comentarioExistente) {
      return res.status(404).json({
        error: "Comentario no encontrado",
      });
    }

    // Verificar que el usuario es el autor del comentario
    if (comentarioExistente.usuarioId !== Number(userId)) {
      return res.status(403).json({
        error: "No tienes permiso para editar este comentario",
      });
    }

    // Actualizar el comentario
    const comentarioActualizado = await prisma.comentario.update({
      where: { id: Number(id) },
      data: {
        mensaje: mensaje.trim(),
      },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Comentario actualizado exitosamente",
      comentario: comentarioActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar comentario:", error);
    return globalErrorHandler(error, req, res);
  }
});

/**
 * DELETE /api/comments/:id
 * Elimina un comentario existente.
 * Solo el autor del comentario puede eliminarlo.
 * Si el comentario tiene respuestas, también se eliminarán (cascade).
 *
 * @route DELETE /api/comments/:id
 * @middleware verify - Middleware de autenticación JWT
 * @access Private
 *
 * @param {Request} req - Objeto de petición Express
 * @param {string} req.params.id - ID del comentario a eliminar
 * @param {number} req.user.userId - ID del usuario autenticado (agregado por middleware)
 * @param {Response} res - Objeto de respuesta Express
 *
 * @returns {Object} 200 - Comentario eliminado exitosamente
 * @returns {Object} 403 - No autorizado (no es el autor del comentario)
 * @returns {Object} 404 - Comentario no encontrado
 * @returns {Object} 500 - Error interno del servidor
 */
router.delete("/:id", verify, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId: number = req.user.userId; // ✅ Ya viene como número del JWT

  try {
    // Verificar que el comentario existe
    const comentarioExistente = await prisma.comentario.findUnique({
      where: { id: Number(id) },
      include: {
        respuestas: true,
      },
    });

    if (!comentarioExistente) {
      return res.status(404).json({
        error: "Comentario no encontrado",
      });
    }

    // Verificar que el usuario es el autor del comentario
    if (comentarioExistente.usuarioId !== Number(userId)) {
      return res.status(403).json({
        error: "No tienes permiso para eliminar este comentario",
      });
    }

    // Eliminar el comentario (las respuestas se eliminarán en cascada según el schema)
    await prisma.comentario.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({
      message: "Comentario eliminado exitosamente",
      comentarioId: Number(id),
    });
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    return globalErrorHandler(error, req, res);
  }
});

export default router;
