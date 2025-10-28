import axios from "axios";

const BASE_URL = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY!; // asegúrate de tenerla en .env

function partContent(contentDetails: boolean, statistics: boolean) {
  const parts = ["snippet"];
  if (contentDetails) parts.push("contentDetails");
  if (statistics) parts.push("statistics");
  return parts.join(",");
}

export async function fetchVideos(query: string, results: number, contentDetails = false, statistics = false) {
  try {
    
    const searchRes = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        maxResults: results,
        key: API_KEY,
      },
    });

    const videoIds = searchRes.data.items.map((item: any) => item.id.videoId).join(",");

    
    const detailsRes = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: partContent(contentDetails, statistics),
        id: videoIds,
        key: API_KEY,
      },
    });

    return detailsRes.data.items;

  } catch (err) {
    console.error("Error al buscar videos:", err);
    return [];
  }
}
