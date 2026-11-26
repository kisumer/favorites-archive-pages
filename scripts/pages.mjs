import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const token = process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim();
if (token && !/^[a-zA-Z0-9_-]+$/.test(token)) {
  throw new Error("CLOUDFLARE_WEB_ANALYTICS_TOKEN must contain only the site token.");
}

await mkdir("dist/make", { recursive: true });
await copyFile("dist/index.html", "dist/404.html");

if (token) {
  const html = await readFile("dist/index.html", "utf8");
  const beacon = `    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}","spa":true}'></script>`;
  const closingBody = /<\/body>/i;
  if (!closingBody.test(html)) throw new Error("Cannot add Web Analytics without a closing body tag.");
  await writeFile("dist/index.html", html.replace(closingBody, `${beacon}\n  </body>`));
}

await copyFile("dist/index.html", "dist/make/index.html");
await writeFile("dist/.nojekyll", "");
