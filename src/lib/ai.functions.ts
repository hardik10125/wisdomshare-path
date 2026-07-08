import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { gatewayChat } from "./ai-gateway.server";

const VerifyInput = z.object({
  dataUrl: z.string().min(20).max(15_000_000), // ~15MB base64
});

/**
 * Verify an uploaded image is study/education related using Gemini vision.
 * Returns { allowed: boolean, reason: string }
 */
export const verifyStudyImage = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => VerifyInput.parse(raw))
  .handler(async ({ data }) => {
    const content = await gatewayChat({
      model: "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a strict content classifier for an educational platform called Wisdom Share. " +
            "Decide whether the image is study/education related. " +
            "ACCEPT: handwritten notes, textbook pages, whiteboard, coding screenshots, IDE, terminal, " +
            "flowcharts, diagrams, math problems, formulas, PDFs of notes, educational infographics, " +
            "lecture slides, scientific figures. " +
            "REJECT: selfies, portraits, animals, cars/vehicles, food, memes, fashion, landscapes, " +
            "screenshots of games/social media/entertainment, nudity, weapons. " +
            'Reply ONLY as JSON: {"allowed": boolean, "reason": "short human-readable reason"}',
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Classify this image." },
            { type: "image_url", image_url: { url: data.dataUrl } },
          ],
        },
      ],
    });
    try {
      const parsed = JSON.parse(content) as { allowed: boolean; reason: string };
      return { allowed: !!parsed.allowed, reason: String(parsed.reason ?? "") };
    } catch {
      return { allowed: false, reason: "Could not verify the image. Please try another." };
    }
  });

const ChatInput = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(30),
});

export const aiChat = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ChatInput.parse(raw))
  .handler(async ({ data }) => {
    const reply = await gatewayChat({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are Wisdom Share AI — an educational study assistant. " +
            "You ONLY answer questions related to studying, learning, programming, mathematics, " +
            "science, engineering, notes, exam prep, career/interview prep, and general academic topics. " +
            "If the user asks something unrelated (dating, gossip, politics, entertainment, personal opinions, " +
            "etc.), politely reply exactly: 'I am an educational assistant. Please ask study-related questions.' " +
            "Format answers clearly with markdown. Use short code blocks for code.",
        },
        ...data.messages,
      ],
    });
    return { reply };
  });
