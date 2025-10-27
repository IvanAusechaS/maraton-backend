import { Router } from "express";
import prisma from "../db/client";
import { globalErrorHandler } from "../error_manage/errorHandler";
//import { verify } from "crypto";
import verify from "../middleware/verifyToken";
import { error } from "console";
import { Gusto } from "@prisma/client";

const router = Router();

// GET /api/peliculas
/**
 * @route GET /api/peliculas
 * @desc Obtener todas las películas
 * @access Public
 *
 * @description
 * Movie retrieval flow:
 * 1. Executes Prisma findMany query to retrieve all movies
 * 2. Returns complete list of movies without filtering
 * 3. Sends 200 status code with movie array as JSON
 * 4. Delegates error handling to global error handler
 */
router.get("/", async (req, res) => {
  try {
    const peliculas = await prisma.pelicula.findMany({
      where: { disponible: true },
    });
    res.status(200).json(peliculas);
  } catch (error) {
    console.error("Error en /api/peliculas:", error);
    return globalErrorHandler(error, req, res);
    //next(error); // lo manda al globalErrorHandler
  }
});

// GET /api/peliculas/generos (auxiliar)
/**
 * @route GET /api/peliculas/generos
 * @desc Obtener todos los géneros de películas
 * @access Public
 * @description
 * Genre retrieval flow:
 * 1. Executes Prisma findMany query to retrieve all genres
 * 2. Returns complete list of genres without filtering
 * 3. Sends 200 status code with genre array as JSON
 * 4. Delegates error handling to global error handler
 */
router.get("/generos", async (req, res) => {
  try {
    const generos = await prisma.genero.findMany();
    res.status(200).json(generos);
  } catch (error) {
    console.error("Error en /api/peliculas/generos:", error);
    return globalErrorHandler(error, req, res);
  }
});

// GET /api/peliculas/:id
/**
 * @route GET /api/peliculas/:id
 * @desc Obtener una película por su ID
 * @access Public
 *
 * @description
 * Single movie retrieval flow:
 * 1. Extracts the movie ID from request parameters
 * 2. Executes Prisma findUnique query to retrieve the movie by ID
 * 3. If found, sends 200 status code with the movie object as JSON
 * 4. If not found, sends 404 status code with an error message
 * 5. Delegates error handling to global error handler
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pelicula = await prisma.pelicula.findUnique({
      where: { id: Number(id) },
    });
    if (pelicula) {
      res.status(200).json(pelicula);
    } else {
      res.status(404).json({ error: "Pelicula no encontrada" });
    }
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

// GET /api/peliculas/genero/:nombre
/**
 * @route GET /api/peliculas/genero/:nombre
 * @desc Obtener películas por nombre de género
 * @access Public
 *
 * @description
 * Movies by genre retrieval flow:
 * 1. Extracts the genre name from request parameters
 * 2. Executes Prisma findMany query to retrieve movies associated with the genre name
 * 3. If found, sends 200 status code with the array of movies as JSON
 * 4. If no movies found, sends 404 status code with an error message
 * 5. Delegates error handling to global error handler
 */
router.get("/genero/:nombre", async (req, res) => {
  const { nombre } = req.params;
  try {
    const peliculas = await prisma.pelicula.findMany({
      where: {
        catalogos: {
          some: {
            genero: {
              nombre: {
                equals: nombre,
                mode: "insensitive", // Hace la búsqueda case-insensitive
              },
            },
          },
        },
      },
    });

    if (peliculas.length === 0) {
      return res.status(404).json({
        message: `No se encontraron películas para el género "${nombre}"`,
      });
    }

    return res.status(200).json(peliculas);
  } catch (error) {
    console.error("Error fetching movies by genre name:", error);
    return globalErrorHandler(error, req, res);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pelicula = await prisma.pelicula.update({
      where: { id: Number(id) },
      data: {
        disponible: false,
      },
    });
    res.status(200).json(pelicula);
  } catch (error) {
    console.error("Error en /api/peliculas:", error);
    return globalErrorHandler(error, req, res);
  }
});

/**
 * POST /ratings
 * Crea la calificación de una película para el usuario autenticado.
 * La calificación debe estar entre 1 y 5.
 * Utiliza upsert para garantizar operación atómica.
 *
 * @route POST /ratings
 * @middleware verify - Middleware de autenticación JWT
 * @access Private
 *
 * @param {Request} req - Objeto de petición Express
 * @param {number} req.body.peliculaId - ID de la película a calificar
 * @param {number} req.body.calificacion - Calificación de 1 a 5
 * @param {number} req.user.userId - ID del usuario autenticado (agregado por middleware)
 * @param {Response} res - Objeto de respuesta Express
 *
 * @returns {Object} 200 - Calificación añadida o actualizada exitosamente
 * @returns {Object} 400 - Validación fallida (calificación fuera de rango o peliculaId faltante)
 * @returns {Object} 404 - Usuario o película no encontrados
 * @returns {Object} 500 - Error interno del servidor
 *
 **/
router.post("/ratings", verify, async (req, res) => {
  const movieId: number = Number(req.body.peliculaId);
  const userId: number = Number(req.user.userId);
  const rating: number = Number(req.body.calificacion);

  try {
    if (!(rating >= 1 && rating <= 5)) {
      return res
        .status(400)
        .json({ error: "La calificación debe ser de 1 a 5" });
    }

    // Validar entrada
    if (!movieId) {
      return res.status(400).json({ error: "peliculaId es requerido" });
    }

    // Verificar que el usuario existe
    const user = await prisma.usuario.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar que la película existe
    const movie = await prisma.pelicula.findUnique({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      return res.status(404).json({ error: "Pelicula no encontrada" });
    }

    //evitar duplicados
    const gusto = await prisma.gusto.upsert({
      where: {
        usuarioId_peliculaId: {
          usuarioId: userId,
          peliculaId: movieId,
        },
      },
      update: {
        calificacion: rating,
      },
      create: {
        usuarioId: userId,
        peliculaId: movieId,
        calificacion: rating,
      },
    });

    res.status(200).json({ message: "Calificación añadida", gusto });
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

/**
 * GET /ratings/:movieId
 * Obtiene todas las calificaciones y estadísticas de una película específica.
 * Calcula el total de calificaciones y el promedio.
 *
 * @route GET /ratings/:movieId
 * @middleware verify - Middleware de autenticación JWT
 * @access Private
 *
 * @param {Request} req - Objeto de petición Express
 * @param {string} req.params.movieId - ID de la película
 * @param {Response} res - Objeto de respuesta Express
 *
 * @returns {Object} 200 - Calificaciones y estadísticas obtenidas exitosamente
 * @returns {Object} 500 - Error interno del servidor
 **/
router.get("/ratings/:movieId", verify, async (req, res) => {
  const movieId: string = req.params.movieId;

  try {
    const preferences = await prisma.pelicula.findUnique({
      where: {
        id: Number(movieId),
      },
      select: {
        gustos: {
          where: {
            calificacion: { not: null },
          },
          select: {
            calificacion: true,
          },
        },
      },
    });

    const ratings: number[] =
      preferences?.gustos
        .map((g) => g.calificacion)
        .filter((c): c is number => c !== null) || [];

    const statistics = {
      ratings: ratings,
      total: ratings.length,
      average:
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0,
    };

    res.status(200).json({ Calificaciones: statistics });
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

/**
 * PUT /ratings/:movieId
 * Actualiza la calificación existente de una película para el usuario autenticado.
 * Requiere que ya exista un registro de Gusto previo.
 *
 * @route PUT /ratings/:movieId
 * @middleware verify - Middleware de autenticación JWT
 * @access Private
 *
 * @param {Request} req - Objeto de petición Express
 * @param {string} req.params.movieId - ID de la película
 * @param {number} req.body.calificacion - Nueva calificación (1-5)
 * @param {string} req.user.userId - ID del usuario autenticado (agregado por middleware)
 * @param {Response} res - Objeto de respuesta Express
 *
 * @returns {Object} 200 - Calificación actualizada exitosamente
 * @returns {Object} 404 - Película no encontrada o gusto no existe
 * @returns {Object} 500 - Error interno del servidor
 **/
router.put("/ratings/:movieId", verify, async (req, res) => {
  const newRating: number = Number(req.body.calificacion);
  const movieId: string = req.params.movieId;
  const userId: number = Number(req.user.userId);

  try {
    const existenceMovie = await prisma.pelicula.findUnique({
      where: {
        id: Number(movieId),
      },
    });

    if (existenceMovie) {
      const updatedPreference = await prisma.gusto.update({
        where: {
          usuarioId_peliculaId: {
            usuarioId: userId,
            peliculaId: Number(movieId),
          },
        },
        data: {
          calificacion: newRating,
        },
      });

      res
        .status(200)
        .json({ message: "Calificación actualizada", updatedPreference });
    } else {
      return res.status(404).json({
        message: "Pelicula no encontrada, intentalo de nuevo mas tarde.",
      });
    }
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

/**
 * DELETE /ratings/:movieId
 * Elimina la calificación de una película para el usuario autenticado.
 * Establece el campo calificacion en null pero mantiene el registro de Gusto.
 *
 * @route DELETE /ratings/:movieId
 * @middleware verify - Middleware de autenticación JWT
 * @access Private
 *
 * @param {Request} req - Objeto de petición Express
 * @param {string} req.params.movieId - ID de la película
 * @param {string} req.user.userId - ID del usuario autenticado (agregado por middleware)
 * @param {Response} res - Objeto de respuesta Express
 *
 * @returns {Object} 200 - Calificación eliminada exitosamente
 * @returns {Object} 404 - Película no encontrada o gusto no existe
 * @returns {Object} 500 - Error interno del servidor
 **/
router.delete("/ratings/:movieId", verify, async (req, res) => {
  const movieId: string = req.params.movieId;
  const userId: number = Number(req.user.userId);

  try {
    const existenceMovie = await prisma.pelicula.findUnique({
      where: {
        id: Number(movieId),
      },
    });

    if (existenceMovie) {
      const updatedPreference = await prisma.gusto.update({
        where: {
          usuarioId_peliculaId: {
            usuarioId: userId,
            peliculaId: Number(movieId),
          },
        },
        data: {
          calificacion: null,
        },
      });

      res
        .status(200)
        .json({ message: "Calificación eliminada", updatedPreference });
    } else {
      return res.status(404).json({
        message: "Pelicula no encontrada, intentalo de nuevo mas tarde.",
      });
    }
  } catch (error) {
    return globalErrorHandler(error, req, res);
  }
});

export default router;
