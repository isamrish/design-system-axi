import { writeFileSync } from "node:fs";
import { type Server, createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isUrl, readJson } from "../../src/adapters/read-json.js";
import { tmpDir } from "../helpers/tmp.js";

describe("readJson from files", () => {
  it("parses a JSON file", async () => {
    const file = join(tmpDir(), "a.json");
    writeFileSync(file, '{"ok":true}');
    expect(await readJson(file)).toEqual({ ok: true });
  });

  it("reports a missing file", async () => {
    const file = join(tmpDir(), "missing.json");
    await expect(readJson(file)).rejects.toMatchObject({
      code: "SOURCE_UNREACHABLE",
      message: `cannot read ${file} (file not found)`,
    });
  });

  it("reports a non-JSON file", async () => {
    const file = join(tmpDir(), "page.html");
    writeFileSync(file, "<html></html>");
    await expect(readJson(file)).rejects.toMatchObject({
      code: "SOURCE_UNREACHABLE",
      message: `cannot read ${file} (not JSON)`,
    });
  });
});

describe("readJson from URLs", () => {
  let server: Server;
  let base: string;

  beforeEach(async () => {
    server = createServer((req, res) => {
      if (req.url === "/ok.json")
        return res
          .writeHead(200, { "content-type": "application/json" })
          .end('{"v":0}');
      if (req.url === "/html")
        return res
          .writeHead(200, { "content-type": "text/html" })
          .end("<!doctype html>");
      res.writeHead(404).end("missing");
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("detects URLs", () => {
    expect(isUrl(base)).toBe(true);
    expect(isUrl("./storybook-static")).toBe(false);
  });

  it("parses a JSON response", async () => {
    expect(await readJson(`${base}/ok.json`)).toEqual({ v: 0 });
  });

  it("reports HTTP errors", async () => {
    await expect(readJson(`${base}/nope`)).rejects.toMatchObject({
      code: "SOURCE_UNREACHABLE",
      message: `cannot read ${base}/nope (HTTP 404)`,
    });
  });

  it("reports HTML served with 200", async () => {
    await expect(readJson(`${base}/html`)).rejects.toMatchObject({
      code: "SOURCE_UNREACHABLE",
      message: `cannot read ${base}/html (not JSON)`,
    });
  });
});
