import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
//import router from "./src/routes/routes";
import usuarioRoutes from './routes/usuario'
import peliculaRoutes from './routes/pelicula'
import authRoutes from "./routes/auth";
import { notFoundHandler, globalErrorHandler } from './error_manage/errorHandler';

const app = express();

// Trust proxy - Required for Render and other hosting platforms behind reverse proxies
app.set("trust proxy", 1);

// ✅ Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:5173',                    // Desarrollo local
  'http://localhost:5174',                    // Desarrollo local (puerto alternativo)
  'https://maraton-frontend.vercel.app',      // Producción Vercel
  process.env.FRONTEND_URL_DEV,               // Desde .env
  process.env.FRONTEND_URL_PROD,              // Desde .env
].filter(Boolean); // Filtrar valores undefined

// ✅ Configuración CORS correcta para cookies
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permitir requests sin origin (Postman, mobile apps, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si el origin está permitido
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS permitido para: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS bloqueado para: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // ✅ CRUCIAL: Permite cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Allow common request headers used by fetch and clients
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
};

// ✅ APLICAR MIDDLEWARES EN ESTE ORDEN (IMPORTANTE)
app.use(cors(corsOptions));        // 1️⃣ CORS primero
app.use(cookieParser());           // 2️⃣ Cookie parser segundo  
app.use(express.json());           // 3️⃣ JSON parser tercero
app.use(express.urlencoded({ extended: true }));
//app.use("/api", router); 
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/peliculas', peliculaRoutes)
app.use("/api/auth", authRoutes);

app.use(notFoundHandler);

app.use(globalErrorHandler);

app.get("/",(req: Request, res: Response) => res.send("Server is running"));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
