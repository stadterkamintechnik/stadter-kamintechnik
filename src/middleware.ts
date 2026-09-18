import { defineMiddleware } from "astro:middleware";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "frame-src 'self' https://www.youtube-nocookie.com https://consentcdn.cookiebot.com",
  "img-src 'self' data: https://consent.cookiebot.com https://consentcdn.cookiebot.com https://imgsct.cookiebot.com",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://consent.cookiebot.com https://consentcdn.cookiebot.com",
  "connect-src 'self' https://consent.cookiebot.com https://consentcdn.cookiebot.com",
  "manifest-src 'self'",
  "media-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const REDIRECTS: Record<string, string> = {
  // Privat / Leistungen
  "/privat/leistungen/": "/",
  "/privat/b2c/": "/",
  "/privat/qualitaet/": "/unternehmen/",
  "/privat/geg/": "/wissen/",
  "/privat/mainfranken/": "/",
  "/privat/leistungen/kaminsanierung/": "/kaminsanierung/",
  "/privat/leistungen/doppelwandige-kamine/": "/aussenkamin/",
  "/privat/leistungen/kaminverlaengerung/": "/kaminverlaengerung/",
  "/privat/leistungen/kaminkopfmauern/": "/kaminkopfsanieren/",
  "/privat/leistungen/mehrschalige-schachtsysteme/": "/schornstein-im-gebaeude-nachruesten/",
  "/privat/leistungen/kaminfraesen/": "/kaminsanierung/",
  "/privat/leistungen/kamininnenabdichtung/": "/kaminsanierung/",
  "/privat/leistungen/partikelabscheider/": "/kaminsanierung/",
  "/privat/leistungen/sonderloesungen/": "/projekt-starten/",

  // Regionen
  "/privat/region-bamberg/": "/",
  "/privat/region-bayreuth/": "/",
  "/privat/region-coburg/": "/",
  "/privat/region-erlangen/": "/",
  "/privat/region-hof/": "/",
  "/privat/region-kronach/": "/",
  "/privat/region-lichtenfels/": "/",

  // Lösungsfinder
  "/loesungsfinder/": "/wissen/",
  "/loesungsfinder/kamin-zieht-schlecht/": "/lp/kamin-zieht-nicht/",
  "/loesungsfinder/kaminkehrermaengel/": "/bauliche-maengel-schornstein/",
  "/loesungsfinder/kaminnachruestung/": "/wissen/schornstein-nachruesten-aussen-oder-innen/",
  "/loesungsfinder/eine-neue-heizung/": "/wissen/neue-heizung-schornstein-sanieren/",
  "/loesungsfinder/loesungen-bei-kaminversottung/": "/wissen/versottung-schornstein-ursachen-sanierung/",
  "/loesungsfinder/loesungen-bei-kaminbrand/": "/wissen/risse-schaeden-schornstein-sanieren/",
  "/loesungsfinder/loesungen-bei-schallproblemen/": "/gewerbe-industrie/sonderanlagen/",

  // Industrie / Gewerbe
  "/industrie/": "/gewerbe-industrie/abgassysteme/",
  "/industrie/b2b/": "/gewerbe-industrie/abgassysteme/",
  "/industrie/kompetenzen/": "/gewerbe-industrie/abgassysteme/",
  "/industrie/kontakt-industrie/": "/projekt-starten/",
  "/industrie/leistungen-industrie/": "/gewerbe-industrie/abgassysteme/",
  "/industrie/leistungen-industrie/abgasleitungen/": "/gewerbe-industrie/abgassysteme/",
  "/industrie/leistungen-industrie/doppelwandige-kamine-industrie/": "/gewerbe-industrie/abgassysteme/",
  "/industrie/leistungen-industrie/freistehende-kamine/": "/gewerbe-industrie/stahlschornsteine/",
  "/industrie/leistungen-industrie/kaminfraesen-industrie/": "/gewerbe-industrie/sonderanlagen/",
  "/industrie/leistungen-industrie/kaminkopfmauern-industrie/": "/gewerbe-industrie/sonderanlagen/",
  "/industrie/leistungen-industrie/kaminsanierung-industrie/": "/gewerbe-industrie/abgassysteme/",
  "/industrie/leistungen-industrie/kaminverlaengerung-industrie/": "/gewerbe-industrie/stahlschornsteine/",
  "/industrie/leistungen-industrie/mehrschalige-schachtsysteme-industrie/": "/gewerbe-industrie/abgassysteme/",
  "/industrie/leistungen-industrie/schalldaempfer/": "/gewerbe-industrie/sonderanlagen/",
  "/industrie/leistungen-industrie/sonderloesungen-industrie/": "/gewerbe-industrie/sonderanlagen/",
  "/industrie/erfolgsgeschichten/": "/referenzen/",
  "/industrie/partner/": "/unternehmen/",
  "/industrie/blog/": "/wissen/",

  // Alte Erfolgsgeschichten -> neue Referenzen
  "/industrie/erfolgsgeschichten/blockheizkraftwerk/":
    "/referenzen/blockheizkraftwerk-schwarzenbach/",
  "/industrie/erfolgsgeschichten/abgassystem-fuer-einen-motorpruefstand/":
    "/referenzen/abgassystem-motorpruefstand/",
  "/industrie/erfolgsgeschichten/sanierung-der-abgasanlagen-einer-der-groessten-baustoffhersteller/":
    "/referenzen/abgasanlagen-baustoffhersteller/",
  "/industrie/erfolgsgeschichten/kaminaufrichtung-kulmbach/":
    "/referenzen/kaminaufrichtung-kulmbach/",
  "/industrie/erfolgsgeschichten/abgasanlage-kaminaufrichtung-fur-einen-hofer-automobilzulieferer/":
    "/referenzen/abgasanlage-automobilzulieferer-hof/",
  "/industrie/erfolgsgeschichten/neues-abgassystem-fur-denkmalgeschutzten-mauerwerkskamin/":
    "/referenzen/neues-abgassystem-denkmalgeschuetzter-mauerwerkskamin/",
  "/industrie/erfolgsgeschichten/freistehende-kaminanlage-fuer-ein-fuehrendes-unternehmen-der-textilindustrie/":
    "/gewerbe-industrie/stahlschornsteine/",

  // Alte Fachartikel
  "/gewerbe_aktuelles/industrie/kamindimensionierung-kamindurchmesser/":
    "/wissen/schornstein-durchmesser-querschnitt-berechnen/",
  "/gewerbe_aktuelles/industrie/kamindimensionierung-kaminhoehe/":
    "/wissen/schornsteinhoehe-bimschv-vdi-3781-4/",
  "/gewerbe_aktuelles/industrie/kamindimensionierung-schornsteinmaterial/":
    "/gewerbe-industrie/abgassysteme/",
  "/privat/aktuelles/neue-ableitbedingungen-fuer-feste-brennstoffe/":
    "/wissen/schornsteinhoehe-bimschv-vdi-3781-4/",
  "/privat/aktuelles/kaminnachruestung-wohnanlage-lichtenfels/":
    "/schornstein-im-gebaeude-nachruesten/",

  // Unternehmen / Kontakt
  "/ueber-uns/": "/unternehmen/",
  "/ueber-uns/team/": "/unternehmen/",
  "/ueber-uns/kontakt/": "/projekt-starten/",
};

const GONE_PATHS = new Set([
  "/privat/gewinnspiel/",

  "/ueber-uns/karriere/bewerbung-abgeschickt/",
  "/ueber-uns/kontakt/360-kontaktformular-abgeschickt/",
  "/ueber-uns/kontakt/kontaktformular-abgeschickt/",
  "/ueber-uns/kontakt/kontaktformular-abgeschickt-b2b/",

  "/ueber-uns/karriere/",
  "/job/",
  "/job/schornstein-und-feuerungsmaurer/",
  "/job/kaminbauer/",
  "/job/dachdecker-zimmerer/",
  "/job/kauffrau-mann-bueromanagement/",
  "/job/schlosser-metallbauer/",

  "/privat/aktuelles/",
  "/privat_aktuelles/frohe-weihnachten-von-stadter-kamintechnik/",
  "/privat_aktuelles/fuhrparkerweiterung-unser-neuer-lkw/",
  "/privat_aktuelles/schulung-hoehenrettungskonzept/",
  "/privat_aktuelles/gewinnuebergabe_kaminseidla/",
  "/privat_aktuelles/betriebsurlaub-das-stadter-team-macht-pause/",
  "/privat_aktuelles/frohe-ostern/",
  "/privat_aktuelles/technischer-workshop-beim-fachverband-schornsteintechnik-e-v/",
  "/privat_aktuelles/betriebsausflug_schulung_bei_jeremias/",
  "/privat_aktuelles/5000-euro-fuer-die-geschwister-gummi-stiftung/",
  "/privat_aktuelles/zertifizierte-ausbildung-zum-fuehren-von-hubarbeitsbuehnen/",
  "/privat_aktuelles/ausbildung-psaga/",
  "/privat_aktuelles/gewinnuebergabe-redcircle/",
  "/privat_aktuelles/frohe-ostern-2022/",
  "/privat_aktuelles/stadter-in-der-baeckerei/",
  "/privat_aktuelles/weihnachtsgruss-2021/",
  "/privat_aktuelles/weihnachtsgruss-2020/",
  "/privat_aktuelles/corona-info/",
  "/privat_aktuelles/neue-webseite/",
  "/privat_aktuelles/ausstellung-zum-kaminkehrerhandwerk-in-hof-ein-voller-erfolg/",
  "/privat_aktuelles/ausstellung-kaminkehrerhandwerk-in-hof/",
  "/privat_aktuelles/erfolgreiche-uebergabe-gewinnspiel-redcircle/",
  "/privat_aktuelles/spatenstich-fuer-unsere-lagerhalle/",
  "/privat_aktuelles/der-naechste-schritt-in-richtung-nachhaltiges-unternehmen-aktuelles/",

  "/gewerbe_aktuelles/industrie/technischer-workshop-beim-fachverband-schornsteintechnik-e-v-2/",
]);

function normalizePath(pathname: string) {
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function applySecurityHeaders(response: Response, url: URL) {
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

  if (url.protocol === "https:") {
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
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = normalizePath(context.url.pathname);

  const redirectTarget = REDIRECTS[pathname];

  if (redirectTarget) {
    const targetUrl = new URL(redirectTarget, context.url);
    targetUrl.search = context.url.search;

    const response = new Response(null, {
      status: 301,
      headers: {
        Location: targetUrl.toString(),
      },
    });

    return applySecurityHeaders(response, context.url);
  }

  if (GONE_PATHS.has(pathname)) {
    const response = new Response("Gone", {
      status: 410,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

    return applySecurityHeaders(response, context.url);
  }

  const response = await next();
  return applySecurityHeaders(response, context.url);
});
