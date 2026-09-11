import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  if (context.url.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  }

  if (import.meta.env.STAGING === "true") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
});
