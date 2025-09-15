import express, { Express, Request, Response } from 'express';
import { connectDB } from './config/database';

// Importar routers
import { router as authRouter } from './routes/auth.routes';
import { router as userRouter } from './routes/user.routes';
import { router as categoryRouter } from './routes/category.routes';
import { router as bookRouter } from './routes/book.routes';
import { router as copyRouter } from './routes/copy.routes';
import { router as loanRouter } from './routes/loan.routes';
import { router as reservationRouter } from './routes/reservation.routes';
import googleBooksRouter from './routes/googleBooks.routes';

const app: Express = express();
process.loadEnvFile();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Usar rutas
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/books", bookRouter);
app.use("/api/copies", copyRouter);
app.use("/api/loans", loanRouter);
app.use("/api/reservations", reservationRouter);
app.use("/api/google-books", googleBooksRouter);

// Ruta principal
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'BiblioIcesi API - Sistema de Gestión de Biblioteca',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            categories: '/api/categories',
            books: '/api/books',
            copies: '/api/copies',
            loans: '/api/loans',
            reservations: '/api/reservations',
            googleBooks: '/api/google-books'
        },
        status: 'Running'
    });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Middleware para rutas no encontradas
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableEndpoints: [
            '/api/auth',
            '/api/users',
            '/api/categories',
            '/api/books',
            '/api/copies',
            '/api/loans',
            '/api/reservations',
            '/api/google-books'
        ]
    });
});

// Export app for Vercel
export default app;

// Inicializar servidor solo si no es Vercel
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    const startServer = async () => {
        try {
            await connectDB();
            
            app.listen(PORT, () => {
                console.log(`🚀 BiblioIcesi API running on port ${PORT}`);
                console.log(`📚 API Documentation: http://localhost:${PORT}/`);
                console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            });
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    };

    startServer();
}
