import { describe, it, expect, vi } from "vitest";
import { suggestTexts } from "../claude";

describe("suggestTexts", () => {
  it("maps parsed output to unapproved ai text entries", async () => {
    const fakeClient = {
      messages: {
        parse: vi.fn(async () => ({
          parsed_output: {
            c: { headline: "Světlo\na stín.", sub: "Portréty s náladou." },
            d: { words: ["Portréty.", "Eventy.", "Svatby."], subHeadline: "Guth Pictures" },
          },
        })),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await suggestTexts(["portréty", "svatby"], fakeClient as any);
    expect(result).toHaveLength(2);
    const c = result.find(t => t.template === "C")!;
    expect(c).toMatchObject({ headline: "Světlo\na stín.", source: "ai", approved: false });
    const d = result.find(t => t.template === "D")!;
    expect(d.words).toHaveLength(3);
  });
});
