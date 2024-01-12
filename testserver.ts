import { Hono } from 'https://deno.land/x/hono@v3.12.2/mod.ts'
import {
    logger,
    serveStatic,
    cors
  } from "https://deno.land/x/hono@v3.12.2/middleware.ts";

import { HTMLRewriter } from "npm:html-rewriter-wasm";

const app = new Hono()

app.use("*", logger());
app.use('/api/*', cors())
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/pages/*', async (c) => {
    const OLD_URL = 'oldhost'
    const NEW_URL = 'newhost'
  
    class AttributeRewriter {
      constructor(attributeName) {
        this.attributeName = attributeName
      }
      element(element) {
        const attribute = element.getAttribute(this.attributeName)
        if (attribute) {
          element.setAttribute(this.attributeName,
        attribute.replace(OLD_URL, NEW_URL))
        }
      }
    }
  
    const rewriter = new HTMLRewriter().on('a', new AttributeRewriter('href'))
  
    const res = await fetch(c.req.raw)
    const contentType = res.headers.get('Content-Type')
  
    if (contentType.startsWith('text/html')) {
      return rewriter.transform(res)
    } else {
      return res
    }
})

Deno.serve(app.fetch)
