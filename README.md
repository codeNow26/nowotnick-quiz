# Nowotnick Quiz

Eine Quiz-App für gemeinsame Spielrunden mit eigenen Kategorien, Fragen und Medien.
Entwickelt mit React, TypeScript, TanStack Router/Start und Supabase.

**Website:** https://www.nowotnick-quiz.de

## Lokal entwickeln

Voraussetzungen: Node.js 24 und npm.

```sh
git clone https://github.com/codeNow26/nowotnick-quiz.git
cd nowotnick-quiz
npm ci
npm run dev
```

## Prüfen und bauen

```sh
npx tsc --noEmit
npm run test:quizzes
npm run test:autosave
npm run build
```

Der Produktionsbuild verwendet Vite und Nitro mit dem Vercel-Preset.
Vercel veröffentlicht das Projekt über die bestehende GitHub-Anbindung.
