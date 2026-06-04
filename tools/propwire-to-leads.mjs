/* ─────────────────────────────────────────────────────────────────────────
   propwire-to-leads.mjs

   Converts raw rows scraped from Propwire into the lead shape the toolkit
   uses (the `SEED_LEADS` array in App.jsx).

   It does three jobs:
     1. Normalizes messy scraped values (equity as "100%" or 100, ownership
        as months / years+months / a purchase date) into clean fields.
     2. Scores each property by a motivated-seller heuristic (equity, length
        of ownership, out-of-state owner) and ranks them 1..N.
     3. Auto-writes the human notes the toolkit shows ("Owns 2 on this
        street", "Highest equity in list", etc.) and flags absentee owners.

   No network and no dependencies — this is pure data transformation. Feed it
   whatever a Propwire scrape produces; it does not care how the rows were
   obtained.

   ── Input contract ───────────────────────────────────────────────────────
   Each raw row should look like this (extra keys are ignored):

     {
       owner:        "Anthony Andrews",                  // required
       address:      "7868 Green Lawn Dr, Houston TX 77088", // required
       equityPercent: 100,        // number or "100%"      (optional)
       equityUsd:     180000,      // number or "$180,000"  (optional)
       ownedMonths:   370,         // OR ownedYears+ownedMonths OR purchasedOn
       ownedYears:    30,          //                        (optional)
       purchasedOn:  "1994-08-01", // ISO date              (optional)
       ownerState:   "CO",         // owner's mailing state  (optional)
       propertyState:"TX"          // defaults to "TX"       (optional)
     }

   ── CLI ──────────────────────────────────────────────────────────────────
     node tools/propwire-to-leads.mjs raw.json            # paste-ready JS
     node tools/propwire-to-leads.mjs raw.json --json     # JSON array
     node tools/propwire-to-leads.mjs raw.json --out leads.json
   ───────────────────────────────────────────────────────────────────────── */

const HOME_STATE = "TX";

/* ── small parsers ──────────────────────────────────────────────────────── */

// "100%" | 100 | "100" -> 100   (null if unknown)
function toPercent(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// "$180,000" | 180000 | "180k" -> 180000   (null if unknown)
function toUsd(v) {
  if (v == null || v === "") return null;
  let s = String(v).trim().toLowerCase().replace(/[$,\s]/g, "");
  let mult = 1;
  if (s.endsWith("k")) { mult = 1e3; s = s.slice(0, -1); }
  else if (s.endsWith("m")) { mult = 1e6; s = s.slice(0, -1); }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * mult) : null;
}

// Resolve ownership length (in whole months) from whichever field is present.
function toOwnedMonths(row, asOf = new Date()) {
  if (row.ownedMonths != null) return Math.max(0, Math.round(row.ownedMonths));
  if (row.ownedYears != null) {
    const extra = row.ownedMonthsExtra != null ? row.ownedMonthsExtra : 0;
    return Math.max(0, Math.round(row.ownedYears * 12 + extra));
  }
  if (row.purchasedOn) {
    const then = new Date(row.purchasedOn);
    if (!Number.isNaN(then.getTime())) {
      const months =
        (asOf.getFullYear() - then.getFullYear()) * 12 +
        (asOf.getMonth() - then.getMonth());
      return Math.max(0, months);
    }
  }
  return null;
}

// 370 -> "30 yrs 10 mo"  (matches the toolkit's `len` style)
function formatLen(months) {
  if (months == null) return "";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const yPart = `${y} yr${y === 1 ? "" : "s"}`;
  return m ? `${yPart} ${m} mo` : yPart;
}

// "7868 Green Lawn Dr, Houston TX 77088" -> "green lawn dr" (street, no number)
function streetKey(address) {
  const head = String(address).split(",")[0] || "";
  return head.replace(/^\s*\d+\s*/, "").trim().toLowerCase();
}

function normOwner(name) {
  return String(name).trim().replace(/\s+/g, " ").toLowerCase();
}

/* ── core conversion ────────────────────────────────────────────────────── */

export function convert(rawRows, opts = {}) {
  const asOf = opts.asOf ? new Date(opts.asOf) : new Date();
  const homeState = (opts.homeState || HOME_STATE).toUpperCase();

  // Pass 1 — normalize every row into a working record.
  const recs = rawRows
    .filter((r) => r && r.owner && r.address)
    .map((r) => {
      const months = toOwnedMonths(r, asOf);
      const propState = (r.propertyState || homeState).toUpperCase();
      const ownerState = r.ownerState ? String(r.ownerState).toUpperCase() : "";
      const oos = ownerState && ownerState !== propState ? ownerState : "";
      return {
        owner: String(r.owner).trim().replace(/\s+/g, " "),
        addr: String(r.address).trim().replace(/\s+/g, " "),
        months,
        eqPctNum: toPercent(r.equityPercent),
        eqUsd: toUsd(r.equityUsd),
        oos,
        _ownerKey: normOwner(r.owner),
        _street: streetKey(r.address),
      };
    });

  if (recs.length === 0) return [];

  // Reference maxima for normalizing the score (avoid divide-by-zero).
  const maxUsd = Math.max(1, ...recs.map((r) => r.eqUsd || 0));
  const maxMonths = Math.max(1, ...recs.map((r) => r.months || 0));
  const topUsd = Math.max(...recs.map((r) => r.eqUsd || 0));

  // Count how many properties each owner holds (drives the repeat-owner note).
  const byOwner = new Map();
  for (const r of recs) {
    if (!byOwner.has(r._ownerKey)) byOwner.set(r._ownerKey, []);
    byOwner.get(r._ownerKey).push(r);
  }

  // Motivated-seller score: equity gives you room to discount, long tenure
  // hints at a life event, an absentee owner is easier to acquire. Weights
  // are deliberately simple and overridable via opts.weights.
  const w = { equity: 0.45, tenure: 0.35, absentee: 0.2, ...(opts.weights || {}) };
  const score = (r) =>
    w.equity * ((r.eqUsd || 0) / maxUsd) +
    w.tenure * ((r.months || 0) / maxMonths) +
    w.absentee * (r.oos ? 1 : 0);

  // Pass 2 — sort by score, assign ranks, build display fields + notes.
  return recs
    .map((r) => ({ r, s: score(r) }))
    .sort((a, b) => b.s - a.s)
    .map(({ r }, i) => {
      const owned = byOwner.get(r._ownerKey);
      const note = buildNote(r, owned, topUsd);
      return {
        rank: i + 1,
        addr: r.addr,
        owner: r.owner,
        len: formatLen(r.months),
        eqPct: r.eqPctNum != null ? `${r.eqPctNum}%` : "",
        eqUsd: r.eqUsd != null ? r.eqUsd : 0,
        oos: r.oos,
        note,
      };
    });
}

function buildNote(rec, ownerProps, topUsd) {
  // Highest-priority note: this owner holds more than one property.
  if (ownerProps.length > 1) {
    const sameStreet = ownerProps.every((p) => p._street === ownerProps[0]._street);
    return sameStreet
      ? `Owns ${ownerProps.length} on this street`
      : `Owns ${ownerProps.length} properties`;
  }
  // The single biggest-equity property in the batch.
  if (rec.eqUsd != null && rec.eqUsd === topUsd && topUsd > 0) {
    return "Highest equity in list";
  }
  // Equity above 100% of assessed value.
  if (rec.eqPctNum != null && rec.eqPctNum > 100) {
    return "Equity exceeds assessed value";
  }
  return "";
}

/* ── output helpers ─────────────────────────────────────────────────────── */

// Render leads as a paste-ready JS array literal in the App.jsx style.
export function toJsLiteral(leads) {
  const q = (s) => JSON.stringify(s);
  const lines = leads.map(
    (l) =>
      `  { rank: ${l.rank}, addr: ${q(l.addr)}, owner: ${q(l.owner)}, ` +
      `len: ${q(l.len)}, eqPct: ${q(l.eqPct)}, eqUsd: ${l.eqUsd}, ` +
      `oos: ${q(l.oos)}, note: ${q(l.note)} },`
  );
  return `const SEED_LEADS = [\n${lines.join("\n")}\n];\n`;
}

/* ── CLI ────────────────────────────────────────────────────────────────── */

async function main(argv) {
  const args = argv.slice(2);
  const inFile = args.find((a) => !a.startsWith("--"));
  const asJson = args.includes("--json");
  const outIdx = args.indexOf("--out");
  const outFile = outIdx !== -1 ? args[outIdx + 1] : null;

  if (!inFile) {
    console.error(
      "Usage: node tools/propwire-to-leads.mjs <raw.json> [--json] [--out <file>]"
    );
    process.exit(1);
  }

  const fs = await import("node:fs/promises");
  const raw = JSON.parse(await fs.readFile(inFile, "utf8"));
  const rows = Array.isArray(raw) ? raw : raw.rows || [];
  const leads = convert(rows);
  const output = asJson ? JSON.stringify(leads, null, 2) + "\n" : toJsLiteral(leads);

  if (outFile) {
    await fs.writeFile(outFile, output);
    console.error(`Wrote ${leads.length} leads -> ${outFile}`);
  } else {
    process.stdout.write(output);
  }
}

// Run as a script (but stay importable for tests / the scraper).
if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
