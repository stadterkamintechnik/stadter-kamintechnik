import { Buffer } from "node:buffer";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import {
  sendMicrosoftMail,
  type MailAttachment,
} from "../lib/microsoft/mail";
import {
  getProjectTypeLabel,
  projectRequestConfirmationMail,
  projectRequestInternalMail,
  type ProjectRequestMailData,
} from "../lib/mail/project-request-template";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 2_500_000;
const MAX_TOTAL_BYTES = 3_000_000;

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const optionalEmail = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.email("Bitte geben Sie eine gültige E-Mail-Adresse ein.").optional(),
);

const optionalText = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().trim().max(5000, "Die Beschreibung ist zu lang.").optional(),
);

const uploadedFiles = z.preprocess((value) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0,
  );
}, z.array(z.instanceof(File)).max(MAX_FILES, `Maximal ${MAX_FILES} Dateien erlaubt.`));

function safeFilename(filename: string): string {
  const cleaned = filename
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Anhang";
}

async function createAttachments(files: File[]): Promise<MailAttachment[]> {
  let totalBytes = 0;

  for (const file of files) {
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: `Die Datei „${file.name}“ hat ein nicht unterstütztes Format.`,
      });
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: `Die Datei „${file.name}“ ist zu groß.`,
      });
    }

    totalBytes += file.size;
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Die Anhänge sind zusammen zu groß.",
    });
  }

  return Promise.all(
    files.map(async (file) => ({
      name: safeFilename(file.name),
      contentType: file.type,
      contentBytes: Buffer.from(await file.arrayBuffer()).toString("base64"),
    })),
  );
}

export const server = {
  projectRequest: defineAction({
    accept: "form",
    input: z.object({
      projectType: z.enum(
        [
          "aussenkamin",
          "sanierung",
          "nachruesten",
          "verlaengern",
          "gewerbe",
          "industrie",
          "sonstiges",
        ],
        { error: "Bitte wählen Sie ein Projekt aus." },
      ),
      firstName: z
        .string()
        .trim()
        .min(2, "Bitte geben Sie Ihren Vornamen ein.")
        .max(80, "Der Vorname ist zu lang."),
      lastName: z
        .string()
        .trim()
        .min(2, "Bitte geben Sie Ihren Nachnamen ein.")
        .max(80, "Der Nachname ist zu lang."),
      phone: z
        .string()
        .trim()
        .min(6, "Bitte geben Sie eine Telefonnummer ein.")
        .max(40, "Die Telefonnummer ist zu lang.")
        .regex(
          /^[0-9+()\/\s.-]+$/,
          "Bitte geben Sie eine gültige Telefonnummer ein.",
        ),
      email: optionalEmail,
      postalCode: z
        .string()
        .trim()
        .regex(/^\d{5}$/, "Bitte geben Sie eine gültige fünfstellige PLZ ein."),
      city: z
        .string()
        .trim()
        .min(2, "Bitte geben Sie den Ort ein.")
        .max(120, "Der Ortsname ist zu lang."),
      message: optionalText,
      photos: uploadedFiles,
      privacy: z
        .boolean()
        .refine((value) => value, {
          message: "Bitte bestätigen Sie die Datenschutzerklärung.",
        }),
      website: z.preprocess(
        (value) => (value === null ? "" : value),
        z.string().max(0, "Spam erkannt."),
      ),
    }),

    handler: async (input) => {
      const mailData: ProjectRequestMailData = {
        projectType: input.projectType,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        postalCode: input.postalCode,
        city: input.city,
        message: input.message,
      };

      const mailbox = import.meta.env.MS_MAILBOX;
      const recipient = import.meta.env.PROJECT_REQUEST_RECIPIENT;

      if (!mailbox || !recipient) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Der Mailversand ist noch nicht vollständig konfiguriert.",
        });
      }

      try {
        const attachments = await createAttachments(input.photos);

        await sendMicrosoftMail({
          sender: mailbox,
          to: [recipient],
          subject: `Neue Projektanfrage: ${getProjectTypeLabel(input.projectType)} – ${input.firstName} ${input.lastName}`,
          html: projectRequestInternalMail(mailData),
          replyTo: input.email,
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
      } catch (error) {
        if (error instanceof ActionError) {
          throw error;
        }

        console.error("Projektanfrage konnte nicht versendet werden:", error);

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es erneut oder rufen Sie uns an.",
        });
      }

      return { success: true };
    },
  }),
};
