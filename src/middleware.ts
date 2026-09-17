import { defineMiddleware } from "astro:middleware";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "frame-src https://www.youtube-nocookie.com",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "media-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  if (!import.meta.env.DEV) {
    response.headers.set(
      "Content-Security-Policy",
      CONTENT_SECURITY_POLICY,
    );
  }

  if (context.url.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000",
    );
  }

  if (import.meta.env.STAGING === "true") {
    response.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive",
    );
  }

  return response;
});
