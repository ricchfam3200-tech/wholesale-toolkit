# tools/

Helper scripts for the wholesale toolkit.

## propwire-to-leads.mjs

Converts raw property rows (e.g. scraped from Propwire) into the lead shape
used by `SEED_LEADS` in `App.jsx`. It ranks leads by a motivated-seller score,
flags out-of-state owners, and writes the "Owns N on this street" /
"Highest equity in list" notes automatically.

### Usage

```bash
# paste-ready JS array (drop into App.jsx)
node tools/propwire-to-leads.mjs raw.json

# JSON array
node tools/propwire-to-leads.mjs raw.json --json

# write to a file
node tools/propwire-to-leads.mjs raw.json --out leads.json
```

Try it on the bundled example:

```bash
node tools/propwire-to-leads.mjs tools/sample-propwire.json
```

### Input contract (what a scraper should emit)

An array of rows. Only `owner` and `address` are required; everything else is
parsed if present, skipped if not.

| field            | example                              | notes                                  |
| ---------------- | ------------------------------------ | -------------------------------------- |
| `owner`          | `"Anthony Andrews"`                  | required                               |
| `address`        | `"7868 Green Lawn Dr, Houston TX …"` | required                               |
| `equityPercent`  | `100` or `"100%"`                    | number or string                       |
| `equityUsd`      | `180000` or `"$180,000"` or `"180k"` | number or string                       |
| `ownedMonths`    | `370`                                | OR use the two fields below            |
| `ownedYears`     | `30` (+ `ownedMonthsExtra: 10`)      | OR use `ownedMonths` / `purchasedOn`   |
| `purchasedOn`    | `"1994-08-01"`                       | ISO date; tenure computed from "today" |
| `ownerState`     | `"CO"`                               | owner's mailing state                  |
| `propertyState`  | `"TX"`                               | defaults to `TX`; drives out-of-state  |

If `ownerState` differs from `propertyState`, the lead's `oos` field is set to
that state (the toolkit's out-of-state flag for absentee-owner letters).

### Scoring

`score = 0.45·equity + 0.35·tenure + 0.20·absentee` (each term normalized
0–1 across the batch). Override via the `weights` option when calling
`convert()` directly. The score only sets the display `rank` order — no lead is
dropped.

### Where the data comes from

The scrape itself runs through `agent-browser` against a logged-in Propwire
session. That step needs the site reachable (it is blocked inside the Claude
Code cloud sandbox by the network allowlist; run it where you're logged in, or
allowlist `propwire.com`). This converter is the network-free half: feed it the
rows once you have them.
