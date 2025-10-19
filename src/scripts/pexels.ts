import prisma from "../db/client";
import { fetchVideos } from "../services/pexels";


async function create_catalog_register(
    peliculaId: number,
    generoQuery: string,
    genres_id: Record<string, number | undefined>
  ) {
    const genreMap: Record<string, string> = {
      "horror short film": "Terror",
      "romantic short film": "Romance",
      "action short film": "Acción",
      "adventure short film": "Aventura",
    };
  
    const genero = genreMap[generoQuery];
    const generoId = genero ? genres_id[genero] : undefined;
  
    if (!generoId) {
      console.warn(`Género no encontrado para '${generoQuery}'`);
      return;
    }
  
    await prisma.catalogo.create({
      data: {
        peliculaId,
        generoId, 
      },
    });
  }
  

export async function importarVideos(genres: any, page: number) {

  let genres_id: Record<string, any> = {}; // para obtener el id

  for (const {name,query} of genres){

    let id = await prisma.genero.findUnique({
        where: {nombre: name},
    });

    genres_id[name] = id?.id;

  }

  for (const {name, query } of genres) {

    const videos = await fetchVideos("/videos/search", query, 5, page);

    for (const video of videos) {
      const videoUrl = video.video_files.find((v: any) => v.quality === "hd")?.link || video.video_files[0]?.link;

      if (!videoUrl) continue;

      // Verificar si ya existe
      const exists = await prisma.pelicula.findUnique({
        where: { largometraje: videoUrl },
      });

      if (exists) {
        console.log(`Ya existe: ${videoUrl}`);
        continue;
      }

      // Crear película
      const pelicula = await prisma.pelicula.create({
        data: {
          titulo: `Pexels Video ${video.id}`,
          duracion: video.duration,
          largometraje: videoUrl,
          actores: "Desconocido",
          año: 2025,
          disponible: true,
          sinopsis: "Corto obtenido automáticamente desde Pexels.",
          trailer: video.url, 
          director: video.user.name || "Autor anónimo",
          portada: video.image,
          idiomaId: 1,
        },
      });

      create_catalog_register(pelicula.id, query, genres_id);

      console.log(`Insertada: ${pelicula.titulo}`);
    }
  }

  console.log("Importación completada.");
}

// generos a buscar, también se pueden usar querys como:

/* 
const genres = [
  { name: "Terror", query: "scary short film" },
  { name: "Romance", query: "love short film" },
  { name: "Acción", query: "fight short film" },
  { name: "Aventura", query: "exploration short film" },
];

o solo definir un genero de forma que :

const genres = [
  { name: "Terror", query: "scary short film" },
];

*/

const genres = [
    {name: "Terror", query: "horror short film" },
    {name: "Romance", query: "romantic short film" },
    {name: "Acción", query: "action short film" },
    {name: "Aventura", query: "adventure short film" },
  ];

// pages usados 1 y 2

importarVideos(genres,2);