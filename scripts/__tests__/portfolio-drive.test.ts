import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { clearPreviews } from "../portfolio/drive";

describe("clearPreviews", () => {
  it("smaže jen NNN.jpg a map.json, cizí soubory nechá", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pv-"));
    for (const f of ["001.jpg", "123.jpg", "map.json", "keep.txt", "photo.jpg"]) {
      await fs.writeFile(path.join(dir, f), "x");
    }
    await clearPreviews(dir);
    expect((await fs.readdir(dir)).sort()).toEqual(["keep.txt", "photo.jpg"]);
    await fs.rm(dir, { recursive: true });
  });
  it("neexistující složku vytvoří", async () => {
    const dir = path.join(os.tmpdir(), `pv-new-${Date.now()}`);
    await clearPreviews(dir);
    expect(await fs.readdir(dir)).toEqual([]);
    await fs.rm(dir, { recursive: true });
  });
});
