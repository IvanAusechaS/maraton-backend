import prisma from "../db/client";
import { fetchVideos } from "../services/youtube";

async function createCatalogRegister(peliculaId: number, genero: string) {
    const generoObject = await prisma.genero.findUnique({
      where: { nombre: genero },
    });
  
    if (!generoObject) {
      console.error(`El género "${genero}" no existe.`);
      return;
    }
  
    await prisma.catalogo.create({
      data: {
        peliculaId,
        generoId: generoObject.id,
      },
    });
  
    console.log(`Registro creado: Película ${peliculaId} → Género ${genero}`);
  }

function generarActoresAleatorios(cantidad = 3): string {
    const nombres = ["Juan", "María", "Carlos", "Sofía", "Andrés", "Camila", "Luis", "Valentina", "Andrey", "Ivan", "Miguel", "Juan Jose"];
    const apellidos = ["García", "Rodríguez", "López", "Martínez", "Gómez", "Vargas", "Hernández", "Quiceno", "Ausecha", "Casanova", "Peralta"];
  
    const actores = Array.from({ length: cantidad }, () => {
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      return `${nombre} ${apellido}`;
    });
  
    return actores.join(", ");
  }

function parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");
    return hours * 3600 + minutes * 60 + seconds;
  }

export async function importarVideosYoutube(query: string, genero: string, results: number, contentDetails = true, statistics = true) {

    try{

        const videos = await fetchVideos(query, results, contentDetails, statistics);

        for (const v of videos) {
            const snippet = v.snippet;
            const content = v.contentDetails;

            const idiomaDetectado =
            snippet?.defaultLanguage ||
            snippet?.defaultAudioLanguage ||
            "desconocido";

            const idioma = await prisma.idioma.upsert({
                where: { nombre: idiomaDetectado },
                update: {},
                create: { nombre: idiomaDetectado },
              });
    
            const pelicula = {
            duracion: parseDuration(content?.duration || "PT0S"),
            largometraje: `https://www.youtube.com/watch?v=${v.id}`,
            actores: generarActoresAleatorios(), // Dado que no se tienen actores o no se sabe
            año: new Date(snippet.publishedAt).getFullYear(),
            disponible: true,
            sinopsis: snippet.description || "Sin descripción",
            trailer: `https://www.youtube.com/watch?v=${v.id}`,
            titulo: snippet.title,
            director: snippet.channelTitle,
            portada: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
            idiomaId: idioma.id,
            };

            const peliculaResponse = await prisma.pelicula.upsert({
                where: { largometraje: pelicula.largometraje },
                update: pelicula,
                create: pelicula,
            });

            createCatalogRegister(peliculaResponse.id, genero);

            console.log(`Pelicula Guardada: ${pelicula.titulo}`);
        }
    } catch(err: any){
        console.error("Error al guardar videos:", err.message);
    }   
  
}

importarVideosYoutube("Cuentos para niños", "Familiar", 30);
