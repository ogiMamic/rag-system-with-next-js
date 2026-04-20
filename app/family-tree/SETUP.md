# Porodično Stablo — Lokalno pokretanje

## 1. Kloniraj granu i instaliraj

```bash
git clone https://github.com/ogiMamic/rag-system-with-next-js.git
cd rag-system-with-next-js
git checkout claude/interactive-family-tree-3d-VFA3g
pnpm install
```

Ako nemaš `pnpm`: `npm i -g pnpm` (ili koristi `npm install` umjesto `pnpm install`).

## 2. Otvori u VS Code

```bash
code .
```

## 3. Supabase projekat (besplatno)

1. Idi na <https://supabase.com> i registruj se
2. "New Project" — odaberi naziv, password baze, region (najbliži: Frankfurt)
3. Sačekaj 1-2 min dok se provisiona
4. U lijevom meniju: **Settings → API**
   - `Project URL` → kopiraj
   - `anon public` key → kopiraj

## 4. Environment varijable

```bash
cp .env.local.example .env.local
```

Otvori `.env.local` u VS Code i popuni:

```
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
```

(`OPENAI_API_KEY` i `SUPABASE_SERVICE_ROLE_KEY` trebaš samo ako koristiš RAG dio — za family tree možeš ostaviti prazno.)

## 5. Pokreni SQL migraciju

1. U Supabase dashboardu, lijevi meni → **SQL Editor** → **New query**
2. Otvori fajl `supabase/migrations/0001_family_tree.sql` u VS Code
3. Kopiraj cijeli sadržaj → paste u SQL Editor → klik **Run**
4. Trebao bi vidjeti "Success. No rows returned"

Ovo pravi 3 tabele, RLS policies, i `tree-photos` storage bucket.

## 6. (Opcionalno) Google OAuth

Samo ako želiš "Prijavi se sa Google" dugme da radi:

1. Supabase → **Authentication → Providers → Google** → Enable
2. Slijedi upute (OAuth client u Google Cloud Console)

Ako preskočiš ovaj korak, **email/password prijava radi odmah**.

## 7. Pokreni dev server

U VS Code terminalu:

```bash
pnpm dev
```

Otvori <http://localhost:3000/family-tree>

## 8. Test flow

1. `/family-tree/signup` → registruj se emailom
2. Provjeri email za potvrdu (u Supabase: **Authentication → Users** — možeš ručno potvrditi ako ne dobiješ email, ili isključi email confirm u **Settings → Auth**)
3. Nakon prijave završavaš na `/family-tree/dashboard`
4. "Novo stablo" → unesi naziv → otvara se 3D prikaz
5. Klikni "Dodaj osobu" i dodaj par članova
6. Klikni na list u 3D sceni → kamera leti do osobe, detalji se otvaraju s desne strane

## Česti problemi

- **"Failed to fetch Geist from Google Fonts"** pri buildu — ignoriši, samo problem kad sandbox nema internet; `pnpm dev` radi.
- **Prazan dashboard nakon kreiranja stabla** — osvježi stranicu; vjerovatno ti email nije potvrđen.
- **"Row level security" greške u konzoli** — znači SQL migracija nije pokrenuta, pogledaj korak 5.
- **Lišće se ne vidi** — otvori DevTools konzolu, traži WebGL greške; na starijim GPU-ima može se desiti.

## VS Code preporučene ekstenzije

- Tailwind CSS IntelliSense
- ESLint
- Prettier
- TypeScript Importer
