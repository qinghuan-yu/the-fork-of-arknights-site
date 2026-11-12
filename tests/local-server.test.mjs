import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, access } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { once } from "node:events";
import test from "node:test";
import { buildRoot, createPreviewServer } from "../scripts/serve.mjs";

test("local preview serves pages, modern images and seekable media", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "arknights-preview-"));
  const server = createPreviewServer(root);
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });
  await Promise.all([
    writeFile(path.join(root, "index.html"), "<h1>local preview</h1>"),
    writeFile(path.join(root, "clip.mp4"), "0123456789"),
    writeFile(path.join(root, "image.webp"), "webp"),
    writeFile(path.join(root, "empty.txt"), ""),
  ]);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;
  let response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(await response.text(), "<h1>local preview</h1>");
  response = await fetch(origin + "/image.webp");
  assert.equal(response.headers.get("content-type"), "image/webp");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  await response.arrayBuffer();
  for (const [range, body, contentRange] of [
    ["bytes=2-5", "2345", "bytes 2-5/10"],
    ["bytes=7-", "789", "bytes 7-9/10"],
    ["bytes=-3", "789", "bytes 7-9/10"],
    ["bytes=8-99", "89", "bytes 8-9/10"],
  ]) {
    response = await fetch(origin + "/clip.mp4", { headers: { Range: range } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("content-range"), contentRange);
    assert.equal(response.headers.get("content-type"), "video/mp4");
    assert.equal(await response.text(), body);
  }
  response = await fetch(origin + "/clip.mp4", {
    method: "HEAD",
    headers: { Range: "bytes=2-5" },
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-length"), "4");
  assert.equal(await response.text(), "");
  for (const range of [
    "bytes=10-",
    "bytes=5-2",
    "bytes=-0",
    "bytes=-",
    "bytes=0-1,4-5",
    "bytes=bad",
  ]) {
    response = await fetch(origin + "/clip.mp4", { headers: { Range: range } });
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get("content-range"), "bytes */10");
    await response.arrayBuffer();
  }
  response = await fetch(origin + "/empty.txt");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-length"), "0");
  assert.equal(await response.text(), "");
  for (const [pathname, options, status] of [
    ["/missing.webp", {}, 404],
    ["/", { method: "POST" }, 405],
    ["/%ZZ", {}, 400],
    ["/%2e%2e%2fpackage.json", {}, 403],
  ]) {
    response = await fetch(origin + pathname, options);
    assert.equal(response.status, status, pathname);
    await response.arrayBuffer();
  }
});

test("standard Vite output contains the local app", async () => {
  await access(path.join(buildRoot, "index.html"));
  await access(path.join(buildRoot, "assets"));
});
