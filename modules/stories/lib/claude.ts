import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AutoParseableOutputFormat } from "@anthropic-ai/sdk/lib/parser";
import type { StoryTextEntry } from "./types";

type Parsed = {
  c: { headline: string; sub: string };
  d: { words: string[]; subHeadline: string };
};

const SCHEMA: { [key: string]: unknown } = {
  type: "object",
  properties: {
    c: {
      type: "object",
      properties: { headline: { type: "string" }, sub: { type: "string" } },
      required: ["headline", "sub"],
      additionalProperties: false,
    },
    d: {
      type: "object",
      properties: {
        words: { type: "array", items: { type: "string" } },
        subHeadline: { type: "string" },
      },
      required: ["words", "subHeadline"],
      additionalProperties: false,
    },
  },
  required: ["c", "d"],
  additionalProperties: false,
};

const OUTPUT_FORMAT: AutoParseableOutputFormat<Parsed> = {
  type: "json_schema",
  schema: SCHEMA,
  parse: (content: string): Parsed => JSON.parse(content) as Parsed,
};

const SYSTEM = `Píšeš krátké české texty na Instagram stories fotografa (Guth Pictures — portréty, svatby, eventy, larpy; Praha).
Tón: sebevědomý, úsporný, bez emoji, bez vykřičníků. Headline max 2 krátká slova na řádek (zlom řádku znakem \\n), sub max 8 slov. Words: 3-4 jednoslovné údery zakončené tečkou.`;

/** Vrátí 2 neschválené AI návrhy textů (1× šablona C, 1× D). */
export async function suggestTexts(
  categories: string[],
  client: Pick<Anthropic, "messages"> = new Anthropic(),
): Promise<StoryTextEntry[]> {
  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{
      role: "user",
      content: `Navrhni texty pro stories z fotek kategorií: ${categories.join(", ")}.`,
    }],
    output_config: { format: OUTPUT_FORMAT },
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error("Claude returned no parsed output");

  const stamp = Date.now();
  return [
    { id: `ai-c-${stamp}`, template: "C", headline: parsed.c.headline, sub: parsed.c.sub, source: "ai", approved: false },
    { id: `ai-d-${stamp}`, template: "D", words: parsed.d.words, subHeadline: parsed.d.subHeadline, source: "ai", approved: false },
  ];
}
