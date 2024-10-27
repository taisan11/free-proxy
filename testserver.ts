import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import {parseHost} from "ufo"
import { HTMLRewriter } from 'html-rewriter-wasm'

const app = new Hono()

app.use('*', logger())
app.use('/api/*', cors())
app.get('/', (c) => {
  return c.text('Hello Hono!')
})
app.get("/manifest.json",(c)=>{return c.text("404",404)})

function addDefaultHost(url:string, defaultHost:string) {
  try {
    // URLオブジェクトを使って検証
    const parsedUrl = new URL(url);
    return parsedUrl.href;
  } catch (e) {
    // 無効なURLの場合、デフォルトのホストを追加
    return `${defaultHost}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}

app.get('/*', async (c) => {
  // 新しいリクエストを作成してfetch
  const request = new Request(c.req.path.slice(1), {
    method: c.req.raw.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });
  const res = await fetch(request);
  const decoder = new TextDecoder();

  let output = await res.text();
  const rewriter = new HTMLRewriter((outputChunk) => {
    output += decoder.decode(outputChunk);
  });
  rewriter.on("a",{
    element(element) {
      const old = element.getAttribute("href") || "#";
      const host = parseHost(c.req.path.slice(1));
      console.log(host);
      const newUrl = new URL(old, addDefaultHost(old, host.hostname+":"+host.port)).toString();
      element.setAttribute("href", newUrl);
    },

  })
  try {
    await rewriter.end();
  } finally {
    rewriter.free(); // Remember to free memory
  }
  return c.html(output);
});


Deno.serve(app.fetch)
