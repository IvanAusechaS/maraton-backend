import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://api.pexels.com';
const API_KEY = process.env.PEXELS_API_KEY;

export async function fetchVideos(route = '/videos/search', query = 'short film', perPage = 5, page = 1) {

    const completeRoute = BASE_URL + route;

    try {
        const response = await axios.get(completeRoute, {
        headers: { Authorization: API_KEY },
        params: { query, per_page: perPage, page },
        });
        return response.data.videos;
    } catch (error) {
        console.error('Error al consultar Pexels:', error);
        throw error;
    }
}