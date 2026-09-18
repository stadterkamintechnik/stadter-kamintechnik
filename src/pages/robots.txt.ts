import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = () => {
  const isStaging = import.meta.env.STAGING === "true";

  const body = isStaging
    ? [
        "User-agent: *",
        "Disallow: /",
        "",
      ].join("\n")
    : [
        "User-agent: *",
        "Allow: /",
        "",
        "Sitemap: https://stadter-kamin.de/sitemap-index.xml",
        "",
      ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
