import { copyFile, mkdir, writeFile } from "node:fs/promises";

await mkdir("dist/make", { recursive: true });
await copyFile("dist/index.html", "dist/make/index.html");
await copyFile("dist/index.html", "dist/404.html");
await writeFile("dist/.nojekyll", "");
