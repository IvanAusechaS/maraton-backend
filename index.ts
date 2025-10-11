import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import router from "./src/routes/routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use("/api", router); 

app.get("/",(req: Request, res: Response) => res.send("Server is running"));

if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}