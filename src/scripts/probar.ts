import { obtenerSubtitulos } from "src/services/subtitles";

const subtitulos = await obtenerSubtitulos("Z6FzBk6x2vA");
console.log(JSON.stringify(subtitulos, null, 2));