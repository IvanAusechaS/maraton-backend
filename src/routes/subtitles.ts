import { Router } from "express";
import prisma from "../db/client";
import { obtenerSubtitulos } from "../services/subtitles";

const router = Router();


router.get("/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;

    const subtitulos = await prisma.subtitulo.findMany({
      where: { peliculaId: Number(movieId) },
      select: { contenido: true }, // SOLO el contenido
    });

    if (!subtitulos || subtitulos.length === 0) {
      return res.status(404).json({ error: "No se encontraron subtítulos" });
    }
    const contenidoSubtitulos = subtitulos.map((s) => s.contenido);

    res.json(contenidoSubtitulos);

  } catch (error) {
    console.error("Error al obtener subtítulos:", error);
    res.status(500).json({ error: "Error interno al obtener subtítulos" });
  }
});





/**
 * Actualiza el estado (por ejemplo, habilitado/deshabilitado) de los subtítulos
 * de un idioma específico para una película.
 *
 * Espera en el body:
 * {
 *   "idiomaId": 2,
 *   "estado": true
 * }
 */
router.patch("/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;
    const { idiomaId, estado } = req.body;

    if (!idiomaId || typeof estado !== "boolean") {
      return res.status(400).json({ error: "Se requiere idiomaId y estado (booleano)" });
    }

    const subtituloActualizado = await prisma.subtitulo.update({
      where: {
        peliculaId_idiomaId: {
          peliculaId: Number(movieId),
          idiomaId: Number(idiomaId),
        },
      },
      data: { estado },
      include: { idioma: true },
    });

    res.json({
      message: "Subtítulo actualizado correctamente",
      subtitulo: subtituloActualizado,
    });
  } catch (error: any) {
    console.error("Error al actualizar subtítulo:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Subtítulo no encontrado" });
    }
    res.status(500).json({ error: "Error interno al actualizar subtítulo" });
  }
});


export default router;
