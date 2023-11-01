import { Hono } from "https://deno.land/x/hono@v3.9.1/mod.ts";
import { logger } from 'https://deno.land/x/hono@v3.9.1/middleware.ts'

const app = new Hono();

app.use('*', logger())
app.notFound((c) => {
    return c.text('404のっとふぁうんど', 404)
  })  
  app.get('/', (c) => {
    return c.htpl(`The current router is ${app.routerName}`)
  })
app.get("/*", async (c) => {
    const url = c.req.path.substring(1, c.req.path.length);
    const headers = c.req.headers;

    let sendURL = "";

    try {
        sendURL = new URL(url).origin;
    }catch(_e) {
        return new Response("Required URL")
    }

    const sendHeaders = new Headers(headers)
    // mask
    sendHeaders.delete("x-real-ip")
    sendHeaders.delete("x-forwarded-for")

    const resp = await fetch(sendURL, sendHeaders as any);

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