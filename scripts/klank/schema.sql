-- ============================================================
-- D1 schema voor Vocaal Ensemble Klank-reserveringen
-- ============================================================
--
-- Eénmalig draaien tegen de KLANK_DB-database:
--   wrangler d1 execute klank --remote --file=scripts/klank/schema.sql
-- (en/of --local voor lokale dev met wrangler pages dev)

CREATE TABLE IF NOT EXISTS reservaties (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ref         TEXT    NOT NULL UNIQUE,
  concert     TEXT    NOT NULL DEFAULT 'midzomer-2026',
  naam        TEXT    NOT NULL,
  woonplaats  TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  aantal      INTEGER NOT NULL CHECK (aantal > 0 AND aantal <= 10),
  bedrag_cent INTEGER NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  ip          TEXT,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_reservaties_concert_created
  ON reservaties (concert, created_at);

CREATE INDEX IF NOT EXISTS idx_reservaties_email
  ON reservaties (email);
