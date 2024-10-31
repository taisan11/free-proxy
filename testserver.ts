import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { HTMLRewriter } from 'html-rewriter-wasm'

const app = new Hono()

const baseUrl =  Deno.env.get("BASE_URL")||"http://localhost:8000"

app.use('*', logger())
app.use('/api/*', cors())
app.get('/', (c) => {
  return c.text('Hello Hono!')
})
app.get("/manifest.json",(c)=>{return c.text("404",404)})

app.get('/*', async (c) => {
  // 新しいリクエストを作成してfetch
  const request = new Request(c.req.path.slice(1), {
    method: c.req.raw.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });
  const _res = await fetch(request);
  const res = new Response(_res.body, _res);
  const redirectDetect = res.headers.get('Location');
	if (redirectDetect && redirectDetect.includes(baseUrl)) {
		res.headers.set('Location', redirectDetect.replace(baseUrl, ''));
	}
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let output = "";
  const rewriter = new HTMLRewriter((outputChunk) => {
    output += decoder.decode(outputChunk);
  });
  rewriter.on("a",{
    element(element) {
      let newURL ="";
      const old = element.getAttribute("href") || "#";
      if (old.startsWith("http://")||old.startsWith("https://")) {
        newURL = baseUrl+"/"+old;
      } else {
        newURL = baseUrl+"/"+new URL(old, c.req.path.slice(1)).href;
      }
      element.removeAttribute("href");
      element.setAttribute("href", newURL);
    },
  })
  .on("img",{
    element(element) {
      let newURL ="";
      const old = element.getAttribute("src") || "#";
      if (old.startsWith("http://")||old.startsWith("https://")) {
        newURL = baseUrl+"/"+old;
      } else {
        newURL = baseUrl+"/"+new URL(old, c.req.path.slice(1)).href;
      }
      element.removeAttribute("src");
      element.setAttribute("src", newURL);
    },
  })
  .on("link",{
    element(element) {
      let newURL ="";
      const old = element.getAttribute("href") || "#";
      if (old.startsWith("http://")||old.startsWith("https://")) {
        newURL = baseUrl+"/"+old;
      } else {
        newURL = baseUrl+"/"+new URL(old, c.req.path.slice(1)).href;
      }
      element.removeAttribute("href");
      element.setAttribute("href", newURL);
    },
  })
  .on("script",{
    element(element) {
      let newURL ="";
      const old = element.getAttribute("src") || "#";
      if (old.startsWith("http://")||old.startsWith("https://")) {
        newURL = baseUrl+"/"+old;
      } else {
        newURL = baseUrl+"/"+new URL(old, c.req.path.slice(1)).href;
      }
      element.removeAttribute("src");
      element.setAttribute("src", newURL);
    },
  })
  try {
    await rewriter.write(encoder.encode(await res.text()));
    await rewriter.end();
    res.headers.set('access-control-allow-origin', '*');
    res.headers.forEach((value, key) => {
      c.header(key, value);
    })
    return c.body(output);
  } finally {
    rewriter.free(); // Remember to free memory
  }
});


Deno.serve(app.fetch)
