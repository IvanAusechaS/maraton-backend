import { Router } from "express";
import prisma from "../db/client";
import {
  globalErrorHandler
} from "../error_manage/errorHandler";

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
    const peliculas = await prisma.pelicula.findMany();
    res.status(200).json(peliculas);
  } catch (error) {
    console.error('❌ Error en /api/peliculas:', error);
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
    console.error('❌ Error en /api/peliculas/generos:', error);
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
                mode: 'insensitive' // Hace la búsqueda case-insensitive
              }
            }
          }
        }
      },
    });

    if (peliculas.length === 0) {
      return res.status(404).json({
        message: `No se encontraron películas para el género "${nombre}"`
      });
    }

    return res.status(200).json(peliculas);
  } catch (error) {
    console.error('❌ Error fetching movies by genre name:', error);
    return globalErrorHandler(error, req, res);
  }
});

export default router;