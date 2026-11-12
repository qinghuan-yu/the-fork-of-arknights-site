import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// 本地静态预览，支持音视频拖动所需的 Range 请求。
const directory = path.dirname(fileURLToPath(import.meta.url));
export const buildRoot = path.resolve(directory, "..", "dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
};

export function createPreviewServer(root = buildRoot) {
  root = path.resolve(root);
  return http.createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
    } catch {
      response.writeHead(400).end();
      return;
    }
    const target = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!target.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    fs.stat(target, (error, stat) => {
      if (error || !stat.isFile()) {
        response
          .writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
          .end("文件不存在");
        return;
      }
      const headers = {
        "Content-Type":
          mime[path.extname(target)] || "application/octet-stream",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      };
      let start = 0,
        end = stat.size - 1,
        status = 200;
      if (request.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
        if (!range || (!range[1] && !range[2])) {
          response
            .writeHead(416, { "Content-Range": `bytes */${stat.size}` })
            .end();
          return;
        }
        if (!range[1]) start = Math.max(0, stat.size - Number(range[2]));
        else {
          start = Number(range[1]);
          if (range[2]) end = Math.min(end, Number(range[2]));
        }
        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start > end ||
          start >= stat.size
        ) {
          response
            .writeHead(416, { "Content-Range": `bytes */${stat.size}` })
            .end();
          return;
        }
        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
      }
      headers["Content-Length"] = Math.max(0, end - start + 1);
      response.writeHead(status, headers);
      if (request.method === "HEAD" || stat.size === 0) {
        response.end();
        return;
      }
      const stream = fs.createReadStream(target, { start, end });
      stream.on("error", () => response.destroy());
      response.on("close", () => stream.destroy());
      stream.pipe(response);
    });
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  if (!fs.existsSync(path.join(buildRoot, "index.html"))) {
    console.error("缺少本地构建，请先运行 npm run build。");
    process.exitCode = 1;
  } else {
    const port = Number(process.env.PORT || 4173);
    const server = createPreviewServer();
    server.on("error", (error) => {
      console.error(
        error.code === "EADDRINUSE"
          ? `端口 ${port} 已被占用，请关闭其他服务或设置 PORT。`
          : error.message,
      );
      process.exitCode = 1;
    });
    server.listen(port, "127.0.0.1", () =>
      console.log(
        `明日方舟本地预览：http://127.0.0.1:${server.address().port}/`,
      ),
    );
  }
}
