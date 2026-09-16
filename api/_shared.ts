import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ZodError, type ZodType } from "zod";

const visits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;

export function allowRequest(req: VercelRequest, res: VercelResponse): boolean {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const record = visits.get(ip);
  if (!record || record.resetAt < now) {
    visits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
    return false;
  }
  return true;
}

export function postOnly(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === "POST") return true;
  res.setHeader("Allow", "POST");
  res.status(405).json({ error: "Method not allowed" });
  return false;
}

export function parseBody<T>(schema: ZodType<T>, req: VercelRequest, res: VercelResponse): T | null {
  try {
    return schema.parse(req.body);
  } catch (error) {
    const message = error instanceof ZodError ? error.issues.map((issue) => issue.message).join("; ") : "Invalid request";
    res.status(400).json({ error: message });
    return null;
  }
}

