import prisma from "../db/client";
import { YoutubeTranscript } from "youtube-transcript";
import youtubedl from "youtube-dl-exec";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


/**
 * Genera subtítulos aleatorios por idioma en el formato requerido.
 * Duración total aproximada: 60 segundos.
 */
export function generarSubtitulosAleatorios(videoId: string) {
  // Definimos los idiomas de forma tipada
  const idiomas = ["es", "en", "pt-BR"] as const;
  type Idioma = typeof idiomas[number];

  const resultados: {
    videoId: string;
    subtitulos: {
      idioma: string;
      lineas: { text: string; start: number; duration: number }[];
    }[];
  } = {
    videoId,
    subtitulos: [],
  };

  const textos: Record<Idioma, string[]> = {
    es: [
      "Hola a todos",
      "Bienvenidos al canal",
      "Esto es una prueba de subtítulos",
      "El sistema está funcionando correctamente",
      "Gracias por ver este video",
      "Suscríbete para más contenido",
      "Este es un texto generado aleatoriamente",
      "Estamos probando el sistema",
      "Ya casi terminamos",
      "Fin de la transmisión",
    ],
    en: [
      "Hello everyone",
      "Welcome to the channel",
      "This is a subtitle test",
      "The system is working fine",
      "Thank you for watching",
      "Subscribe for more content",
      "This is randomly generated text",
      "We are testing the system",
      "Almost done now",
      "End of transmission",
    ],
    "pt-BR": [
      "Olá a todos",
      "Bem-vindos ao canal",
      "Isto é um teste de legendas",
      "O sistema está funcionando corretamente",
      "Obrigado por assistir",
      "Inscreva-se para mais conteúdo",
      "Texto gerado aleatoriamente",
      "Estamos testando o sistema",
      "Quase terminando",
      "Fim da transmissão",
    ],
  };

  for (const idioma of idiomas) {
    const duracionTotal = 60; // segundos totales
    let tiempoActual = 0;
    const lineas: { text: string; start: number; duration: number }[] = [];

    while (tiempoActual < duracionTotal) {
      const duracion = Math.min(Math.random() * 5 + 2, duracionTotal - tiempoActual);
      const texto =
        textos[idioma][Math.floor(Math.random() * textos[idioma].length)];
      lineas.push({
        text: texto,
        start: parseFloat(tiempoActual.toFixed(2)),
        duration: parseFloat(duracion.toFixed(2)),
      });
      tiempoActual += duracion;
    }

    resultados.subtitulos.push({ idioma, lineas });
  }

  console.log(`🎬 Subtítulos falsos generados para video ${videoId}`);
  return resultados;
}

/**
 * Convierte un video descargado en audio .mp3
 */
function convertirVideoAAudio(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .save(audioPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
}

/**
 * Genera subtítulos con Whisper si YouTube no los tiene.
 */
async function generarSubtitulosConWhisper(videoId: string, idioma: string) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const tempVideo = `/tmp/${videoId}.mp4`;
  const audioPath = `/tmp/${videoId}.mp3`;

  try {
    console.log(`🎬 Descargando audio de YouTube (${idioma})...`);

    // 1️⃣ Descargar el mejor audio disponible
    await youtubedl(videoUrl, {
      output: tempVideo,
      format: "bestaudio/best",
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addMetadata: true,
    });

    // 2️⃣ Convertir a .mp3 con ffmpeg
    console.log("🎧 Convirtiendo a MP3...");
    await convertirVideoAAudio(tempVideo, audioPath);

    // 3️⃣ Enviar el audio a Whisper
    console.log("🧠 Enviando audio a Whisper...");
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      language: idioma.startsWith("es") ? "es" : "en",
    });

    const texto = response.text.trim();
    console.log(`✅ Whisper generó subtítulos (${idioma}): ${texto.slice(0, 100)}...`);

    // 4️⃣ Convertir texto a formato tipo YouTube
    const lineas = texto
      .split(/\. |\n/)
      .filter(Boolean)
      .map((sentence, i) => ({
        text: sentence,
        start: i * 4,
        duration: 4,
      }));

    return lineas;
  } catch (err) {
    console.error(`❌ Error generando subtítulos con Whisper para ${videoId}:`, err);
    return [];
  } finally {
    // 5️⃣ Limpieza de archivos temporales
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);
  }
}

/**
 * Obtiene subtítulos en varios idiomas, o los genera con Whisper si no existen.
 */
export async function obtenerSubtitulos(movieId: string) {
  const idiomas = await prisma.idioma.findMany({
    select: { nombre: true },
  });

  const resultados: {
    idioma: string;
    lineas: { text: string; start: number; duration: number }[];
  }[] = [];

  for (const { nombre } of idiomas) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(movieId, { lang: nombre });
      const lineas = transcript.map((t: any) => ({
        text: t.text,
        start: t.offset ?? t.start ?? 0,
        duration: t.duration ?? 0,
      }));

      resultados.push({ idioma: nombre, lineas });
      console.log(`✅ Subtítulos oficiales encontrados en ${nombre}`);
    } catch {
      console.log(`⚠️ No hay subtítulos en ${nombre}, usando Whisper...`);
      const lineas = await generarSubtitulosConWhisper(movieId, nombre);
      if (lineas.length > 0) resultados.push({ idioma: nombre, lineas });
    }
  }

  return resultados;
}
