import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set. Add it to your environment to enable AI features.");
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

/**
 * Sends a prompt to Claude and parses the response as JSON. Throws if the
 * model refuses to produce valid JSON after one repair attempt.
 *
 * Used for every structured AI task in the app (PDF parsing, recipe
 * normalization, diet plan generation) so parsing/retry logic lives in one
 * place.
 */
export async function askClaudeForJSON<T>(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<T> {
  const client = getClient();
  const { system, prompt, maxTokens = 4096 } = opts;

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: `${system}\n\nRespond with ONLY valid JSON. No markdown code fences, no commentary before or after.`,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const parsed = tryParseJSON<T>(text);
  if (parsed) return parsed;

  // One repair attempt: ask Claude to fix its own malformed output.
  const repair = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: "You output ONLY valid JSON, nothing else. Fix the JSON below so it parses with JSON.parse.",
    messages: [{ role: "user", content: text }],
  });
  const repairText = repair.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const repaired = tryParseJSON<T>(repairText);
  if (repaired) return repaired;

  throw new Error("Claude did not return parseable JSON after a repair attempt.");
}

function tryParseJSON<T>(text: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to salvage the largest {...} or [...] block in the text.
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
