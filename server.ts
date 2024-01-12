import { Hono } from "https://deno.land/x/hono@v3.12.2/mod.ts";
import {
  logger,
  serveStatic,
} from "https://deno.land/x/hono@v3.12.2/middleware.ts";

const app = new Hono();
// logと404
app.use("*", logger());
app.notFound((c) => {
  return c.text("404のっとふぁうんど", 404);
});
// app.get('/', (c) => {
//   return c.html(`<p>hono-proxy</p>`)
// })
//メインページ
app.get("/", serveStatic({ path: "./index.html" }));
// app.get('/access.js', serveStatic({ path: './access.js' }))
// メイン処理
app.get("/*", async (c) => {
  const url = c.req.path.substring(1, c.req.path.length); //urlの取得?
  const headers = c.req.headers; // headerの取得

  let sendURL = "";

  try {
    sendURL = new URL(url).origin;
  } catch (_e) {
    return new Response("Required URL");
  }

  const sendHeaders = new Headers(headers);
  // mask
  sendHeaders.delete("x-real-ip");
  sendHeaders.delete("x-forwarded-for");

  const resp = await fetch(sendURL, sendHeaders as any); // 取得したURLかあら取得
  // ここをいじる
  if (resp.headers.get("Content-Type")?.includes("html")) {
    // url置き換え
    let html = await resp.text() + `
        <script>
            console.log("HonoProxy : https://github.com/EdamAme-x/hono-proxy")
        </script>
        `; // DOMParse => ...
    return c.html(html);
  }

  return resp;
});

Deno.serve(app.fetch);
