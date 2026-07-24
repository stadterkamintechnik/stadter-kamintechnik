# Projektstruktur

## Verbindlicher Standard

- `src/components/layout/`: globale Layout-Komponenten wie Header, Footer und Favicon.
- `src/components/sections/`: wiederverwendbare Inhaltsbereiche der Website.
- `src/components/project/`: Komponenten der Projektanfrage.
- `src/components/reference/`: Komponenten der Referenzseiten.
- `src/components/<leistung>/`: jede Leistungsseite in einem eigenen Ordner.
- `src/pages/`: flache Astro-Routen; Routendateien bleiben klein und importieren ihre Seitenkomponente.
- `src/styles/layout/`: Styles für globale Layout-Komponenten.
- `src/styles/sections/`: Styles für wiederverwendbare Inhaltsbereiche.
- `src/styles/project/`: Styles der Projektanfrage.
- `src/styles/reference/`: Styles der Referenzseiten.
- `src/styles/pages/`: seitenspezifische Styles.
- `public/images/<leistung>/`: Bilder nach Leistung geordnet.

## Namenskonventionen

- Komponenten: PascalCase, zum Beispiel `KaminverlaengerungPage.astro`.
- Ordner und URLs: kleingeschrieben mit Bindestrichen.
- Jede neue Leistung erhält direkt einen eigenen Komponenten- und Bildordner.
- Bestehende Struktur wird nicht ohne vollständige Anpassung aller Imports geändert.
