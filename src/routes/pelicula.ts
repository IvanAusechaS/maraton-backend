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

export default router;
