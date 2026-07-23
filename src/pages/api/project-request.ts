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

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

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
  phone: z
    .string()
    .trim()
    .min(6)
    .max(40)
    .regex(/^[0-9+()\/\s.-]+$/),
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
    .trim();

  return cleaned || "Anhang";
}

function errorRedirect(message: string): Response {
  const target = new URL("/projekt-starten", "http://localhost");
  target.searchParams.set("fehler", message);
  return Response.redirect(target, 303);
}

async function createAttachments(files: File[]): Promise<MailAttachment[]> {
  if (files.length > MAX_FILES) {
    throw new Error(`Maximal ${MAX_FILES} Dateien sind erlaubt.`);
  }

  let totalBytes = 0;

  for (const file of files) {
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      throw new Error(`Die Datei „${file.name}“ hat ein nicht unterstütztes Format.`);
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`Die Datei „${file.name}“ ist zu groß.`);
    }

    totalBytes += file.size;
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error("Die Anhänge sind zusammen zu groß.");
  }

  return Promise.all(
    files.map(async (file) => ({
      name: safeFilename(file.name),
      contentType: file.type,
      contentBytes: Buffer.from(await file.arrayBuffer()).toString("base64"),
    })),
  );
}

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
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
      console.error("Formularvalidierung fehlgeschlagen:", parsed.error.flatten());
      return errorRedirect("Bitte prüfen Sie Ihre Angaben.");
    }

    const files = formData
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    console.info(
      "Projektanfrage – empfangene Anhänge:",
      files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    );

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
      throw new Error("Der Mailversand ist noch nicht vollständig konfiguriert.");
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

    console.info(`Projektanfrage versendet – ${attachments.length} Anhang/Anhänge.`);
    return redirect("/danke", 303);
  } catch (error) {
    console.error("Projektanfrage konnte nicht versendet werden:", error);

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Ihre Anfrage konnte gerade nicht übermittelt werden.";

    return errorRedirect(message);
  }
};
