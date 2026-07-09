import { Hono } from 'hono';
import { renderHTML } from './ui/template.js';

const app = new Hono();

app.get('/', (c) => {
  return c.html(renderHTML());
});

export default app;
