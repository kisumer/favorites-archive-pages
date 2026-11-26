import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const measurementId = process.env.GA4_MEASUREMENT_ID?.trim();
if (measurementId && !/^G-[A-Z0-9]+$/.test(measurementId)) {
  throw new Error("GA4_MEASUREMENT_ID must be a Google Analytics measurement ID starting with G-.");
}

await mkdir("dist/make", { recursive: true });
await copyFile("dist/index.html", "dist/404.html");

if (measurementId) {
  const html = await readFile("dist/index.html", "utf8");
  const tag = `    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
    </script>`;
  const closingHead = /<\/head>/i;
  if (!closingHead.test(html)) throw new Error("Cannot add Google Analytics without a closing head tag.");
  await writeFile("dist/index.html", html.replace(closingHead, `${tag}\n  </head>`));
}

await copyFile("dist/index.html", "dist/make/index.html");
await writeFile("dist/.nojekyll", "");
