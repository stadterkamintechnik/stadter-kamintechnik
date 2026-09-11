import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = () => {
  const isStaging = import.meta.env.STAGING === "true";
  const body = isStaging
    ? "User-agent: *\nDisallow: /\n"
    : "User-agent: *\nAllow: /\n";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
