import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const layoutPath = path.join(root, "src", "layouts", "BaseLayout.astro");
const componentSource = path.join(root, "stadter-favicon-v1", "src", "components", "FaviconHead.astro");
const publicSource = path.join(root, "stadter-favicon-v1", "public");

if (!fs.existsSync(layoutPath)) {
  console.error("BaseLayout.astro wurde nicht gefunden:", layoutPath);
  process.exit(1);
}

const targetComponentDir = path.join(root, "src", "components");
const targetPublicDir = path.join(root, "public");
fs.mkdirSync(targetComponentDir, { recursive: true });
fs.mkdirSync(targetPublicDir, { recursive: true });

fs.copyFileSync(componentSource, path.join(targetComponentDir, "FaviconHead.astro"));
for (const file of fs.readdirSync(publicSource)) {
  fs.copyFileSync(path.join(publicSource, file), path.join(targetPublicDir, file));
}

let source = fs.readFileSync(layoutPath, "utf8");

if (!source.includes('import FaviconHead from "../components/FaviconHead.astro";')) {
  const frontmatterEnd = source.indexOf("---", 3);
  if (frontmatterEnd === -1) {
    console.error("Astro-Frontmatter konnte nicht erkannt werden.");
    process.exit(1);
  }
  source =
    source.slice(0, frontmatterEnd) +
    'import FaviconHead from "../components/FaviconHead.astro";\n' +
    source.slice(frontmatterEnd);
}

if (!source.includes("<FaviconHead />")) {
  source = source.replace(
    /(<meta\s+name=["']viewport["'][^>]*\/?>)/,
    '$1\n    <FaviconHead />'
  );
}

fs.writeFileSync(layoutPath, source, "utf8");
console.log("Favicon-Paket erfolgreich installiert.");
