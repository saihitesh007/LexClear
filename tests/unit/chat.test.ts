import { expect, it } from "vitest";
import { buildChatPrompt } from "../../src/lib/gemini";
it("grounds chat", () =>
  expect(buildChatPrompt("doc", "question", [])).toContain("this isn't covered in the document"));
