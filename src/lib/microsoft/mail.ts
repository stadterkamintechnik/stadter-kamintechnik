import { getMicrosoftGraphToken, getRequiredEnv } from "./graph";

type Recipient = { emailAddress: { address: string; name?: string } };

export type MailAttachment = {
  name: string;
  contentType: string;
  contentBytes: string;
};

type SendMailOptions = {
  sender?: string;
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

const recipient = (address: string): Recipient => ({
  emailAddress: { address },
});

export async function sendMicrosoftMail({
  sender = getRequiredEnv("MS_MAILBOX"),
  to,
  subject,
  html,
  replyTo,
  attachments = [],
}: SendMailOptions): Promise<void> {
  const token = await getMicrosoftGraphToken();

  const message: {
    subject: string;
    body: { contentType: "HTML"; content: string };
    toRecipients: Recipient[];
    replyTo?: Recipient[];
    attachments?: Array<{
      "@odata.type": "#microsoft.graph.fileAttachment";
      name: string;
      contentType: string;
      contentBytes: string;
    }>;
  } = {
    subject,
    body: { contentType: "HTML", content: html },
    toRecipients: to.map(recipient),
  };

  if (replyTo) {
    message.replyTo = [recipient(replyTo)];
  }

  if (attachments.length > 0) {
    message.attachments = attachments.map((attachment) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: attachment.name,
      contentType: attachment.contentType,
      contentBytes: attachment.contentBytes,
    }));
  }

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        saveToSentItems: true,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Microsoft Graph Mailversand fehlgeschlagen: HTTP ${response.status} ${response.statusText} ${body}`,
    );
  }
}
