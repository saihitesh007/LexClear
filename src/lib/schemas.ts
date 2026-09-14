import { z } from "zod";
export const documentTextSchema = z.string().trim().min(20).max(60_000);
export const simplifySchema = z.object({ title: z.string().trim().max(120).default("Uploaded document"), text: documentTextSchema });
export const compareSchema = z.object({ first: documentTextSchema, second: documentTextSchema });
export const chatSchema = z.object({ documentText: documentTextSchema, question: z.string().trim().min(3).max(500) });
export const translateSchema = z.object({ text: z.string().trim().min(1).max(20_000), target: z.enum(["hi", "ta", "te", "bn", "mr"]) });
export const ocrSchema = z.object({ title: z.string().trim().max(120).default("Scanned document"), imageBase64: z.string().min(1).max(14_000_000), mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"]) });