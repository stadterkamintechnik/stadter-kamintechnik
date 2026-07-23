export type ProjectRequestMailData = {
  projectType: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  postalCode: string;
  city: string;
  message?: string;
};

const PROJECT_LABELS: Record<string, string> = {
  aussenkamin: "Edelstahl-Außenkamin",
  sanierung: "Schornsteinsanierung",
  nachruesten: "Schornstein nachrüsten",
  verlaengern: "Schornstein verlängern",
  gewerbe: "Gewerbe",
  industrie: "Industrie",
  sonstiges: "Sonstiges",
};

const BRAND_RED = "#8f1d24";
const TEXT = "#111111";
const MUTED = "#6f6f73";
const LINE = "#dedede";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizePhoneHref(phone: string): string {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized.startsWith("+") ? normalized : normalized;
}

function paragraph(value?: string): string {
  if (!value?.trim()) {
    return `<span style="color:${MUTED};">Keine Beschreibung angegeben</span>`;
  }

  return escapeHtml(value.trim()).replaceAll("\n", "<br>");
}

function divider(spacing = 30): string {
  return `
    <div style="
      height:1px;
      margin:${spacing}px 0;
      background:${LINE};
      line-height:1px;
      font-size:1px;
    ">&nbsp;</div>
  `;
}

function eyebrow(value: string): string {
  return `
    <div style="
      margin:0 0 10px;
      color:${BRAND_RED};
      font-size:11px;
      line-height:1.3;
      font-weight:700;
      letter-spacing:.15em;
      text-transform:uppercase;
    ">${escapeHtml(value)}</div>
  `;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="
        width:145px;
        padding:7px 0;
        color:${MUTED};
        font-size:14px;
        line-height:1.5;
        vertical-align:top;
      ">${escapeHtml(label)}</td>
      <td style="
        padding:7px 0;
        color:${TEXT};
        font-size:15px;
        line-height:1.5;
        font-weight:600;
        vertical-align:top;
      ">${value}</td>
    </tr>
  `;
}

function shell(content: string, maxWidth = 700): string {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Stadter Kamintechnik</title>
</head>
<body style="
  margin:0;
  padding:0;
  background:#ffffff;
  color:${TEXT};
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;
  -webkit-text-size-adjust:100%;
">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#ffffff;">
    <tr>
      <td align="center" style="padding:42px 20px 36px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:${maxWidth}px;background:#ffffff;">
          <tr>
            <td style="padding:0;background:#ffffff;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getProjectTypeLabel(value: string): string {
  return PROJECT_LABELS[value] ?? value;
}

export function projectRequestInternalMail(data: ProjectRequestMailData): string {
  const projectLabel = getProjectTypeLabel(data.projectType);
  const customerName = `${data.firstName} ${data.lastName}`.trim();

  const emailValue = data.email?.trim()
    ? `<a href="mailto:${escapeHtml(data.email.trim())}" style="color:${TEXT};text-decoration:none;">${escapeHtml(data.email.trim())}</a>`
    : `<span style="color:${MUTED};font-weight:400;">Nicht angegeben</span>`;

  const phoneHref = normalizePhoneHref(data.phone);

  return shell(`
    <div style="
      margin:0 0 12px;
      color:${MUTED};
      font-size:11px;
      line-height:1.3;
      font-weight:700;
      letter-spacing:.15em;
      text-transform:uppercase;
    ">Stadter Kamintechnik</div>

    <h1 style="
      margin:0;
      color:${TEXT};
      font-size:34px;
      line-height:1.12;
      font-weight:700;
      letter-spacing:-.03em;
    ">Neue Projektanfrage</h1>

    ${divider(28)}

    ${eyebrow("Projekt")}
    <div style="
      margin:0;
      color:${TEXT};
      font-size:24px;
      line-height:1.35;
      font-weight:700;
      letter-spacing:-.015em;
    ">${escapeHtml(projectLabel)}</div>

    ${divider()}

    ${eyebrow("Kontakt")}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
      ${detailRow("Name", escapeHtml(customerName))}
      ${detailRow(
        "Telefon",
        `<a href="tel:${escapeHtml(phoneHref)}" style="color:${BRAND_RED};text-decoration:none;">${escapeHtml(data.phone)}</a>`
      )}
      ${detailRow("E-Mail", emailValue)}
    </table>

    ${divider()}

    ${eyebrow("Projektort")}
    <div style="
      margin:0;
      color:${TEXT};
      font-size:18px;
      line-height:1.55;
      font-weight:600;
    ">${escapeHtml(data.postalCode)} ${escapeHtml(data.city)}</div>

    ${divider()}

    ${eyebrow("Beschreibung")}
    <div style="
      margin:0;
      color:${TEXT};
      font-size:16px;
      line-height:1.75;
      font-weight:400;
    ">${paragraph(data.message)}</div>

    ${divider(32)}

    <div style="
      color:${MUTED};
      font-size:12px;
      line-height:1.65;
    ">
      Automatisch über das Projektformular der Website übermittelt.
    </div>
  `, 720);
}

export function projectRequestConfirmationMail(data: ProjectRequestMailData): string {
  const projectLabel = getProjectTypeLabel(data.projectType);
  const firstName = escapeHtml(data.firstName.trim());
  const lastName = escapeHtml(data.lastName.trim());

  return shell(`
    <div style="
      margin:0 0 12px;
      color:${MUTED};
      font-size:11px;
      line-height:1.3;
      font-weight:700;
      letter-spacing:.15em;
      text-transform:uppercase;
    ">Stadter Kamintechnik</div>

    <h1 style="
      margin:0;
      color:${TEXT};
      font-size:34px;
      line-height:1.12;
      font-weight:700;
      letter-spacing:-.03em;
    ">Anfrage erfolgreich übermittelt.</h1>

    ${divider(28)}

    <div style="
      color:${TEXT};
      font-size:17px;
      line-height:1.75;
    ">
      <p style="margin:0 0 20px;">Guten Tag ${firstName} ${lastName},</p>

      <p style="margin:0 0 20px;">
        Ihre Projektanfrage zum Thema
        <strong>${escapeHtml(projectLabel)}</strong>
        ist bei uns eingegangen.
      </p>

      <p style="margin:0;">
        Wir prüfen Ihr Projekt und melden uns anschließend persönlich bei Ihnen.
      </p>
    </div>

    ${divider()}

    ${eyebrow("Kontakt")}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
      ${detailRow(
        "Telefon",
        `<a href="tel:+4992289989000" style="color:${BRAND_RED};text-decoration:none;">09228 998900-0</a>`
      )}
      ${detailRow(
        "E-Mail",
        `<a href="mailto:info@stadter-kamin.de" style="color:${TEXT};text-decoration:none;">info@stadter-kamin.de</a>`
      )}
      ${detailRow(
        "Website",
        `<a href="https://www.stadter-kamin.de" style="color:${TEXT};text-decoration:none;">stadter-kamin.de</a>`
      )}
    </table>

    ${divider()}

    <div style="
      color:${TEXT};
      font-size:15px;
      line-height:1.7;
    ">
      Freundliche Grüße<br>
      <strong>Stadter Kamintechnik GmbH</strong>
    </div>

    <div style="
      margin-top:28px;
      color:${MUTED};
      font-size:12px;
      line-height:1.65;
    ">
      Schornsteine, die funktionieren.
    </div>
  `, 680);
}
