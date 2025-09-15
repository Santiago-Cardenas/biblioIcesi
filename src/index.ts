// src/index.ts
import express, { Express, Request, Response } from "express";

// Routers
import { router as authRouter } from "./routes/auth.routes";
import { router as userRouter } from "./routes/user.routes";
import { router as categoryRouter } from "./routes/category.routes";
import { router as bookRouter } from "./routes/book.routes";
import { router as copyRouter } from "./routes/copy.routes";
import { router as loanRouter } from "./routes/loan.routes";
import { router as reservationRouter } from "./routes/reservation.routes";
import googleBooksRouter from "./routes/googleBooks.routes";

// Carga .env solo en local (opcional)
if (!process.env.VERCEL) {
  try {
    // Disponible en Node 20; si no, usa dotenv
    // @ts-ignore
    process.loadEnvFile?.();
  } catch {}
}

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/books", bookRouter);
app.use("/api/copies", copyRouter);
app.use("/api/loans", loanRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/google-books", googleBooksRouter);

// Root
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "BiblioIcesi API - Sistema de Gestión de Biblioteca",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      categories: "/api/categories",
      books: "/api/books",
      copies: "/api/copies",
      loans: "/api/loans",
      reservations: "/api/reservations",
      googleBooks: "/api/google-books"
    },
    status: "Running"
  });
});

// Health
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      "/api/auth",
      "/api/users",
      "/api/categories",
      "/api/books",
      "/api/copies",
      "/api/loans",
      "/api/reservations",
      "/api/google-books"
    ]
  });
});

export default app;

// --- Solo LEVANTAR servidor localmente (no en Vercel) ---
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  // Carga conexión solo en local para dev server
  import("./config/database").then(({ connectDB }) => {
    connectDB().then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 BiblioIcesi API running on http://localhost:${PORT}`);
      });
    }).catch(err => {
      console.error("❌ Failed to connect DB in dev:", err);
      process.exit(1);
    });
  });
}
