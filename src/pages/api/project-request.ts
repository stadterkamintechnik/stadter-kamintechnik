import { Buffer } from "node:buffer";
import type { APIRoute } from "astro";
import { z } from "astro/zod";
import {
  sendMicrosoftMail,
  type MailAttachment,
} from "../../lib/microsoft/mail";
import {
  getProjectTypeLabel,
  projectRequestConfirmationMail,
  projectRequestInternalMail,
  type ProjectRequestMailData,
} from "../../lib/mail/project-request-template";

export const prerender = false;

const MAX_FILES = 5;
const MAX_FILE_BYTES = 2_500_000;
const MAX_TOTAL_BYTES = 3_000_000;
const MAX_REQUEST_BYTES = 4_500_000;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

class PublicFormError extends Error {}

const fieldsSchema = z.object({
  projectType: z.enum([
    "aussenkamin",
    "sanierung",
    "nachruesten",
    "verlaengern",
    "gewerbe",
    "industrie",
    "sonstiges",
  ]),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(40).regex(/^[0-9+()\/\s.-]+$/),
  email: z.union([z.literal(""), z.email()]),
  postalCode: z.string().trim().regex(/^\d{5}$/),
  city: z.string().trim().min(2).max(120),
  message: z.string().trim().max(5000),
  privacy: z.literal("on"),
  website: z.string().max(0),
});

const stringValue = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

function safeFilename(filename: string): string {
  const cleaned = filename
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return cleaned || "Anhang";
}

function publicRedirect(
  redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308) => Response,
  message: string,
): Response {
  return redirect(`/projekt-starten?fehler=${encodeURIComponent(message)}`, 303);
}

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
}

function enforceRateLimit(request: Request): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) rateLimitStore.delete(key);
  }

  const key = getClientKey(request);
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new PublicFormError(
      "Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es später erneut.",
    );
  }

  current.count += 1;
}

function enforceAllowedOrigin(request: Request): void {
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    throw new PublicFormError("Die Anfrage konnte nicht verifiziert werden.");
  }

  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    throw new PublicFormError("Die Anfrage konnte nicht verifiziert werden.");
  }

  const configuredOrigins = (import.meta.env.ALLOWED_FORM_ORIGINS || "")
    .split(",")
    .map((value: string) => value.trim())
    .filter(Boolean);

  if (configuredOrigins.length > 0) {
    const allowed = configuredOrigins.some((value: string) => {
      try {
        return new URL(value).origin === origin.origin;
      } catch {
        return false;
      }
    });

    if (!allowed) {
      throw new PublicFormError("Die Anfrage konnte nicht verifiziert werden.");
    }
    return;
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin.origin !== requestOrigin) {
    throw new PublicFormError("Die Anfrage konnte nicht verifiziert werden.");
  }
}

function matchesFileSignature(type: string, bytes: Uint8Array): boolean {
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length &&
      signature.every((value, index) => bytes[index] === value);
  }

  if (type === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }

  if (type === "application/pdf") {
    return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  }

  return false;
}

async function createAttachments(files: File[]): Promise<MailAttachment[]> {
  if (files.length > MAX_FILES) {
    throw new PublicFormError(`Maximal ${MAX_FILES} Dateien sind erlaubt.`);
  }

  let totalBytes = 0;
  const attachments: MailAttachment[] = [];

  for (const file of files) {
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      throw new PublicFormError("Mindestens eine Datei hat ein nicht unterstütztes Format.");
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new PublicFormError("Mindestens eine Datei ist zu groß. Maximal 2,5 MB pro Datei.");
    }

    totalBytes += file.size;
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new PublicFormError("Die Anhänge sind zusammen zu groß. Maximal 3 MB insgesamt.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (!matchesFileSignature(file.type, bytes)) {
      throw new PublicFormError(
        "Mindestens eine Datei konnte nicht als gültiges Bild oder PDF erkannt werden.",
      );
    }

    attachments.push({
      name: safeFilename(file.name),
      contentType: file.type,
      contentBytes: Buffer.from(arrayBuffer).toString("base64"),
    });
  }

  return attachments;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    enforceAllowedOrigin(request);
    enforceRateLimit(request);

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > MAX_REQUEST_BYTES) {
      throw new PublicFormError("Die Anfrage ist insgesamt zu groß.");
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      throw new PublicFormError("Ungültige Formulardaten.");
    }

    const formData = await request.formData();

    const parsed = fieldsSchema.safeParse({
      projectType: stringValue(formData, "projectType"),
      firstName: stringValue(formData, "firstName"),
      lastName: stringValue(formData, "lastName"),
      phone: stringValue(formData, "phone"),
      email: stringValue(formData, "email"),
      postalCode: stringValue(formData, "postalCode"),
      city: stringValue(formData, "city"),
      message: stringValue(formData, "message"),
      privacy: stringValue(formData, "privacy"),
      website: stringValue(formData, "website"),
    });

    if (!parsed.success) {
      console.warn("Projektformular: Validierung fehlgeschlagen.");
      return publicRedirect(redirect, "Bitte prüfen Sie Ihre Angaben.");
    }

    const files = formData
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const attachments = await createAttachments(files);
    const input = parsed.data;

    const mailData: ProjectRequestMailData = {
      projectType: input.projectType,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email || undefined,
      postalCode: input.postalCode,
      city: input.city,
      message: input.message || undefined,
    };

    const mailbox = import.meta.env.MS_MAILBOX;
    const recipient = import.meta.env.PROJECT_REQUEST_RECIPIENT;

    if (!mailbox || !recipient) {
      throw new Error("Mail-Konfiguration unvollständig.");
    }

    await sendMicrosoftMail({
      sender: mailbox,
      to: [recipient],
      subject: `Neue Projektanfrage: ${getProjectTypeLabel(input.projectType)} – ${input.firstName} ${input.lastName}`,
      html: projectRequestInternalMail(mailData),
      replyTo: input.email || undefined,
      attachments,
    });

    if (input.email) {
      await sendMicrosoftMail({
        sender: mailbox,
        to: [input.email],
        subject: "Vielen Dank für Ihre Projektanfrage",
        html: projectRequestConfirmationMail(mailData),
        replyTo: recipient,
      });
    }

    console.info(`Projektformular: Anfrage erfolgreich versendet (${attachments.length} Anhang/Anhänge).`);
    return redirect("/danke", 303);
  } catch (error) {
    if (error instanceof PublicFormError) {
      console.warn(`Projektformular: ${error.message}`);
      return publicRedirect(redirect, error.message);
    }

    console.error("Projektformular: interner Fehler.", error);
    return publicRedirect(
      redirect,
      "Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns telefonisch.",
    );
  }
};
