// api/index.ts
import serverless from "serverless-http";
import app from "../src/index";
import { connectDB } from "../src/config/database";

// Vercel invoca `default (req, res)`; conectamos DB por inicio de request.
// serverless-http convierte Express en handler compatible.
const expressHandler = serverless(app, {
  binary: ["image/*", "application/pdf"]
});

// Export default: ES LO QUE VERCEL ESPERA
export default async function handler(req: any, res: any) {
  await connectDB(); // singleton: no reabre en caliente
  return expressHandler(req, res);
}