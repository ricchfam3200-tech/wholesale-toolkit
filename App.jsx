import { useState, useEffect, useMemo } from "react";

/* ─────────────────────────────────────────────────────────────
   SHARED TOKENS & UTILITIES
───────────────────────────────────────────────────────────── */
const GOLD = "#c9a23f";

const fmt = (n) =>
  isNaN(n) || n === null
    ? "—"
    : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const card = {
  background: "#100e0a",
  border: "1px solid #26221a",
  borderRadius: 14,
};

const labelUC = {
  fontSize: 12,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#8a8577",
  fontWeight: 600,
};

const chip = {
  fontSize: 12.5,
  background: "#191610",
  border: "1px solid #2b271e",
  borderRadius: 6,
  padding: "4px 9px",
  color: "#cfc8b6",
};

/* ─────────────────────────────────────────────────────────────
   STORAGE — uses window.storage (claude.ai artifact API) when
   present, falls back to browser localStorage everywhere else.
───────────────────────────────────────────────────────────── */
const storage = {
  get: async (key) => {
    if (typeof window !== "undefined" && window.storage) {
      return window.storage.get(key);
    }
    try {
      const value = localStorage.getItem(key);
      return value != null ? { value } : null;
    } catch {
      return null;
    }
  },
  set: async (key, value) => {
    if (typeof window !== "undefined" && window.storage) {
      return window.storage.set(key, value);
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      /* quota exceeded or private-browsing restriction */
    }
  },
};

/* ─────────────────────────────────────────────────────────────
   SEED DATA  (shared by Leads and Mail)
───────────────────────────────────────────────────────────── */
const SEED_LEADS = [
  { rank: 1,  addr: "7868 Green Lawn Dr, Houston TX 77088",    owner: "Anthony Andrews",          len: "30 yrs 10 mo", eqPct: "100%", eqUsd: 180000, oos: "CO", note: "Owns 2 on this street" },
  { rank: 2,  addr: "8911 Lakeworth Dr, Houston TX 77088",     owner: "Joyce Breeler",             len: "30 yrs 3 mo",  eqPct: "100%", eqUsd: 221837, oos: "TN", note: "" },
  { rank: 3,  addr: "7609 Gleason Rd, Houston TX 77016",       owner: "Earl & Barbara Wheatfall",  len: "29 yrs 2 mo",  eqPct: "100%", eqUsd: 142637, oos: "WI", note: "" },
  { rank: 4,  addr: "975 Dolly Wright St, Houston TX 77088",   owner: "Jules Arceneau",            len: "28 yrs",       eqPct: "100%", eqUsd: 89000,  oos: "CA", note: "" },
  { rank: 5,  addr: "6107 Elkwood Forest Dr, Houston TX 77088",owner: "Deborah Lewis",             len: "27 yrs 3 mo",  eqPct: "100%", eqUsd: 222097, oos: "LA", note: "" },
  { rank: 6,  addr: "7227 Lockwood Dr, Houston TX 77016",      owner: "Earnest & Catherine Green", len: "26 yrs 3 mo",  eqPct: "100%", eqUsd: 88709,  oos: "CA", note: "" },
  { rank: 7,  addr: "7866 Green Lawn Dr, Houston TX 77088",    owner: "Anthony Andrews",           len: "26 yrs",       eqPct: "100%", eqUsd: 195768, oos: "CO", note: "Owns 2 on this street" },
  { rank: 8,  addr: "7326 Yoe St, Houston TX 77016",           owner: "Chimira Keener",            len: "32 yrs 5 mo",  eqPct: "100%", eqUsd: 158882, oos: "",   note: "" },
  { rank: 9,  addr: "6815 Hopper Rd, Houston TX 77016",        owner: "James & Patsy Laymond",     len: "32 yrs 4 mo",  eqPct: "100%", eqUsd: 97412,  oos: "",   note: "Owns 2 properties" },
  { rank: 10, addr: "10229 Royal Oaks Dr, Houston TX 77016",   owner: "Dorothy Jones",             len: "32 yrs 3 mo",  eqPct: "100%", eqUsd: 160000, oos: "",   note: "" },
  { rank: 11, addr: "9417 Camay Dr, Houston TX 77016",         owner: "Jose Bravo",                len: "32 yrs 1 mo",  eqPct: "100%", eqUsd: 119347, oos: "",   note: "" },
  { rank: 12, addr: "10342 Castleton St, Houston TX 77016",    owner: "Darryl Sloan",              len: "31 yrs 10 mo", eqPct: "100%", eqUsd: 166457, oos: "",   note: "" },
  { rank: 13, addr: "6603 Cobalt St, Houston TX 77016",        owner: "James & Patsy Laymond",     len: "31 yrs 9 mo",  eqPct: "100%", eqUsd: 134383, oos: "",   note: "Owns 2 properties" },
  { rank: 14, addr: "7226 Haverton Dr, Houston TX 77016",      owner: "Douglas & Marie George",    len: "26 yrs 7 mo",  eqPct: "103%", eqUsd: 227364, oos: "",   note: "Equity exceeds assessed value" },
  { rank: 15, addr: "5318 Pate Rd, Houston TX 77016",          owner: "Alberto Rico",              len: "25 yrs 11 mo", eqPct: "111%", eqUsd: 254207, oos: "",   note: "Highest equity in list" },
];

/* ─────────────────────────────────────────────────────────────
   START HERE
───────────────────────────────────────────────────────────── */
function StartHere() {
  const Section = ({ kicker, title, children }) => (
    <div style={{ ...card, padding: "20px 20px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 8 }}>{kicker}</div>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: "#f3eee0", margin: "0 0 10px", fontWeight: 600 }}>{title}</h3>
      <div style={{ color: "#b8b2a2", fontSize: 14.5, lineHeight: 1.62 }}>{children}</div>
    </div>
  );

  return (
    <div>
      <Section kicker="The Basics" title="What wholesaling actually is">
        You find a motivated seller, get their house under contract at a low price, then sell that{" "}
        <em>contract</em> (not the house) to a cash buyer for a fee. You never own the property. Your profit
        is the assignment fee — often $5k–$15k a deal. You're a paid middleman who finds deals.
      </Section>

      <Section kicker="Texas Law" title="The rules you can't skip">
        You don't need a license to wholesale in Texas (Occupations Code 1101.0045). But you{" "}
        <strong style={{ color: "#e8e2d2" }}>must disclose in writing</strong> to the seller that you're
        acquiring an equitable interest and intend to assign the contract — Property Code 5.0205, in effect
        since Sept 2024. And you can sell <em>your own contract</em>, but you can't market the property
        itself for the seller — that's licensed activity. Have a Texas attorney review your contract
        template once.
      </Section>

      <Section kicker="The Loop" title="How a deal actually flows">
        <div style={{ display: "grid", gap: 8 }}>
          {[
            "Find & qualify a motivated seller (Call Guide tab)",
            "Pull comps → estimate ARV",
            "Run the numbers (Analyzer tab)",
            "Get it under contract with disclosure",
            "Assign to a verified cash buyer (Buyers tab)",
            "Buyer closes → you collect your fee (Checklist tab)",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ color: GOLD, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{i + 1}.</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="Skill #1" title="Estimating ARV with comps">
        ARV = what the house sells for <em>fixed up</em>, so comp against{" "}
        <strong style={{ color: "#e8e2d2" }}>renovated</strong> homes — not tired ones (the #1 beginner
        mistake). Good comps are: <strong style={{ color: "#e8e2d2" }}>sold</strong> in the last 3–6 months,
        within ~½ mile, similar size (±20%), same type/era, updated condition. Pull 3–5, take the median,
        adjust for differences, and lean to the low end. Filter Zillow/Redfin to "Sold" to start; graduate
        to MLS data later.
      </Section>

      <Section kicker="Skill #2" title="Finding motivated sellers">
        Pick two channels and go deep:{" "}
        <strong style={{ color: "#e8e2d2" }}>driving for dollars</strong> (log distressed houses, find
        owners via the county appraisal district) and{" "}
        <strong style={{ color: "#e8e2d2" }}>targeted calling/texting</strong> (verify Do-Not-Call / TCPA
        rules first). Direct mail, networking with REIAs and investor-friendly agents come next. Motivation
        beats everything — chase problems a fast cash sale solves.
      </Section>

      <div style={{ ...card, padding: "18px 20px", background: "rgba(201,162,63,0.07)", borderColor: "#403517" }}>
        <p style={{ color: "#cfc8b6", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Knowledge gets you to the starting line. Your first deal comes from reps — driving a neighborhood,
          making calls, being a little uncomfortable, and hearing a lot of no's. That's the job, not a sign
          you're failing.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANALYZER
───────────────────────────────────────────────────────────── */
function Field({ label, hint, value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ ...labelUC, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", background: "#13110d", border: "1px solid #2b271e", borderRadius: 8, overflow: "hidden" }}>
        <span style={{ padding: "0 12px", color: "#6f6a5c", fontFamily: "'DM Mono', monospace", fontSize: 17 }}>$</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f3eee0", fontFamily: "'DM Mono', monospace", fontSize: 19, padding: "12px 14px 12px 0" }}
        />
      </div>
      {hint && <p style={{ margin: "6px 2px 0", fontSize: 12.5, color: "#6f6a5c", lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

function Analyzer() {
  const [arv, setArv]       = useState("");
  const [repairs, setRepairs] = useState("");
  const [fee, setFee]       = useState("10000");
  const [asking, setAsking] = useState("");
  const [pct, setPct]       = useState(70);

  const n = (v) => (v === "" ? 0 : parseFloat(v));
  const arvN = n(arv), repN = n(repairs), feeN = n(fee), askN = n(asking);
  const buyerAllIn = useMemo(() => arvN * (pct / 100), [arvN, pct]);
  const mao        = useMemo(() => buyerAllIn - repN - feeN, [buyerAllIn, repN, feeN]);
  const hasInputs  = arvN > 0;
  const dealWorks  = hasInputs && askN > 0 && askN <= mao;
  const spread     = mao - askN;

  return (
    <div>
      <div style={{ ...card, padding: "22px 20px" }}>
        <Field label="After Repair Value (ARV)" hint="What it sells for fixed up. Use renovated comps." value={arv} onChange={setArv} />
        <Field label="Estimated Repairs" hint="Your buyer's rehab cost. Estimate high when unsure." value={repairs} onChange={setRepairs} />
        <Field label="Your Assignment Fee" hint="Your payday. $5k–$15k is typical early on." value={fee} onChange={setFee} />
        <div style={{ marginBottom: 20 }}>
          <label style={{ ...labelUC, display: "block", marginBottom: 10 }}>Buyer's Rule: {pct}% of ARV</label>
          <input type="range" min={60} max={80} value={pct} onChange={(e) => setPct(+e.target.value)} style={{ width: "100%", accentColor: GOLD }} />
          <p style={{ margin: "6px 2px 0", fontSize: 12.5, color: "#6f6a5c", lineHeight: 1.5 }}>
            Flippers want to be all-in at ~70% of ARV. Hot markets stretch to 75%; cautious buyers want 65%.
          </p>
        </div>
        <Field label="Seller's Asking Price" hint="Compare against your max below." value={asking} onChange={setAsking} />
      </div>

      {hasInputs && (
        <div style={{ ...card, marginTop: 16, overflow: "hidden" }}>
          <div style={{ padding: 20, borderBottom: "1px solid #1f1c15" }}>
            <div style={{ ...labelUC, marginBottom: 6 }}>Your Maximum Offer (MAO)</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 40, color: mao > 0 ? "#f3eee0" : "#c2503f", fontWeight: 600, lineHeight: 1 }}>
              {fmt(mao)}
            </div>
            <div style={{ fontSize: 13, color: "#6f6a5c", marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
              ({fmt(buyerAllIn)} − {fmt(repN)} repairs − {fmt(feeN)} fee)
            </div>
          </div>
          {askN > 0 && (
            <div style={{ padding: 20, background: dealWorks ? "rgba(64,120,70,0.10)" : "rgba(160,60,45,0.10)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: dealWorks ? "#7fc488" : "#e07a68" }}>
                  {dealWorks ? "✓ This deal has room" : "✕ Numbers don't work yet"}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#8a8577" }}>
                  {spread >= 0 ? "+" : ""}{fmt(spread)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: "#9b9587", lineHeight: 1.55 }}>
                {dealWorks
                  ? `Asking is at or below your max — ${fmt(spread)} of cushion to negotiate.`
                  : `Seller wants ${fmt(askN - mao)} more than your max. Negotiate down or walk. Never force a deal.`}
              </p>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 12, color: "#5a554a", lineHeight: 1.6, marginTop: 16, textAlign: "center" }}>
        A learning tool, not financial/legal advice.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BUYERS
───────────────────────────────────────────────────────────── */
const B_KEY = "toolkit:buyers";
const emptyBuyer = { id: "", name: "", contact: "", areas: "", types: "", priceRange: "", criteria: "", funds: "unverified", notes: "" };
const fundLabels = {
  unverified: { t: "Proof unverified",         c: "#8a8577", bg: "rgba(138,133,119,0.12)" },
  verified:   { t: "✓ Proof of funds verified", c: "#7fc488", bg: "rgba(64,120,70,0.14)"  },
};

function Buyers() {
  const [buyers,  setBuyers]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    (async () => {
      try { const r = await storage.get(B_KEY); if (r?.value) setBuyers(JSON.parse(r.value)); } catch {}
      setLoading(false);
    })();
  }, []);

  const persist = async (list) => {
    setBuyers(list);
    try { await storage.set(B_KEY, JSON.stringify(list)); } catch (e) { console.error(e); }
  };

  const save = () => {
    if (!editing.name.trim()) return;
    const list = editing.id
      ? buyers.map((b) => (b.id === editing.id ? editing : b))
      : [...buyers, { ...editing, id: Date.now().toString() }];
    persist(list);
    setEditing(null);
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", background: "#13110d", border: "1px solid #2b271e",
    borderRadius: 8, color: "#f3eee0", fontFamily: "'Outfit', sans-serif", fontSize: 15,
    padding: "11px 13px", outline: "none", marginTop: 6,
  };
  const fieldLabel = { ...labelUC, display: "block", marginTop: 16 };

  if (loading) return <p style={{ color: "#6f6a5c" }}>Loading…</p>;

  if (editing) {
    return (
      <div style={{ ...card, padding: "8px 20px 22px" }}>
        <label style={fieldLabel}>Name / Company *</label>
        <input style={inputStyle} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Lone Star Flips LLC" />
        <label style={fieldLabel}>Contact</label>
        <input style={inputStyle} value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} placeholder="phone / email" />
        <label style={fieldLabel}>Target Areas</label>
        <input style={inputStyle} value={editing.areas} onChange={(e) => setEditing({ ...editing, areas: e.target.value })} placeholder="East Dallas, 75218" />
        <label style={fieldLabel}>Property Types</label>
        <input style={inputStyle} value={editing.types} onChange={(e) => setEditing({ ...editing, types: e.target.value })} placeholder="SFH 3/2, small multifamily" />
        <label style={fieldLabel}>Price Range</label>
        <input style={inputStyle} value={editing.priceRange} onChange={(e) => setEditing({ ...editing, priceRange: e.target.value })} placeholder="$150k–$300k" />
        <label style={fieldLabel}>Buy Criteria</label>
        <input style={inputStyle} value={editing.criteria} onChange={(e) => setEditing({ ...editing, criteria: e.target.value })} placeholder="70% ARV, takes heavy rehab" />
        <label style={fieldLabel}>Notes</label>
        <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
        <label style={fieldLabel}>Proof of Funds</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {["unverified", "verified"].map((k) => (
            <button key={k} onClick={() => setEditing({ ...editing, funds: k })} style={{ flex: 1, padding: 10, borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif", border: editing.funds === k ? `1px solid ${GOLD}` : "1px solid #2b271e", background: editing.funds === k ? "rgba(201,162,63,0.12)" : "#13110d", color: editing.funds === k ? GOLD : "#8a8577" }}>
              {k === "verified" ? "Verified" : "Unverified"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={save} style={{ flex: 1, background: GOLD, color: "#100e0a", border: "none", borderRadius: 9, padding: 13, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Save buyer</button>
          <button onClick={() => setEditing(null)} style={{ background: "transparent", color: "#8a8577", border: "1px solid #2b271e", borderRadius: 9, padding: "13px 18px", fontSize: 15, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setEditing({ ...emptyBuyer })} style={{ width: "100%", background: GOLD, color: "#100e0a", border: "none", borderRadius: 9, padding: 13, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", marginBottom: 16 }}>
        + Add a cash buyer
      </button>
      {buyers.length === 0 && (
        <div style={{ ...card, borderStyle: "dashed", padding: "36px 22px", textAlign: "center" }}>
          <p style={{ color: "#9b9587", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            Build this list <em>before</em> you hunt for deals. When you know what your buyers want, you know
            exactly what to look for.
          </p>
        </div>
      )}
      {buyers.map((b) => (
        <div key={b.id} style={{ ...card, padding: "18px 20px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: "#f3eee0", fontWeight: 600 }}>{b.name}</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setEditing(b)} style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>Edit</button>
              <button onClick={() => persist(buyers.filter((x) => x.id !== b.id))} style={{ background: "none", border: "none", color: "#7a5048", cursor: "pointer", fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>Delete</button>
            </div>
          </div>
          {b.contact && <div style={{ color: "#9b9587", fontSize: 14, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{b.contact}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {b.areas     && <span style={chip}>📍 {b.areas}</span>}
            {b.types     && <span style={chip}>🏠 {b.types}</span>}
            {b.priceRange && <span style={chip}>💲 {b.priceRange}</span>}
          </div>
          {b.criteria && <div style={{ color: "#9b9587", fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>{b.criteria}</div>}
          {b.notes    && <div style={{ color: "#6f6a5c", fontSize: 13, marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>{b.notes}</div>}
          <div style={{ marginTop: 12, display: "inline-block", fontSize: 12, fontWeight: 600, color: fundLabels[b.funds].c, background: fundLabels[b.funds].bg, borderRadius: 6, padding: "4px 10px" }}>
            {fundLabels[b.funds].t}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CALL GUIDE
───────────────────────────────────────────────────────────── */
const pillars = [
  { key: "C", word: "Condition", color: GOLD,      q: "Tell me about the house — what kind of shape is it in? Anything that needs work?",  why: "For your repair estimate. Let them talk. Listen for roof, foundation, HVAC, kitchens/baths — the expensive stuff." },
  { key: "M", word: "Motivation", color: "#7fb0c4", q: "What's got you thinking about selling?",                                             why: "THE key question. A real reason = a real deal. 'Just seeing what I can get' = move on." },
  { key: "T", word: "Timeline",   color: "#b48fc4", q: "If we agreed on a price, how soon would you want to close?",                          why: "Fast = motivated. Your whole edge is speed and certainty." },
  { key: "P", word: "Price",      color: "#7fc488", q: "Do you have a number in mind that'd make this work for you?",                         why: "Let THEM name a number first. Also ask what's still owed on the mortgage — it sets the floor." },
];

const objections = [
  { o: "“Your offer is too low.”",   a: "I hear you. It's based on buying as-is, all cash, no repairs on your end, closing on your timeline — that convenience is what I'm paying for. With time to list and repair, an agent might get more." },
  { o: "“I need to think about it.”", a: "Totally fair. What specifically would you want to think over? Sometimes I can answer it right now." },
  { o: "“Are you an agent?”",         a: "I'm an investor, not an agent. I buy directly and may bring in a partner or assign the contract — I'll put exactly that in writing for you." },
];

function CallGuide() {
  const [open, setOpen] = useState(0);

  return (
    <div>
      <div style={{ ...card, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ ...labelUC, marginBottom: 8 }}>Open warm, not salesy</div>
        <p style={{ color: "#e8e2d2", fontSize: 15.5, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
          "Hi, is this [name]? I'm [you], a local investor — I came across your property on [street] and
          wanted to see if you'd consider an offer. Did I catch you at an okay time?"
        </p>
      </div>

      <div style={{ ...labelUC, color: GOLD, marginBottom: 12 }}>The 4 things to learn — C.M.T.P.</div>
      {pillars.map((p, i) => (
        <div key={p.key} onClick={() => setOpen(open === i ? -1 : i)} style={{ ...card, padding: "16px 18px", marginBottom: 10, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 8, background: p.color + "22", border: `1px solid ${p.color}55`, color: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{p.key}</span>
            <span style={{ fontSize: 17, color: "#f3eee0", fontWeight: 600, flex: 1, fontFamily: "'Outfit', sans-serif" }}>{p.word}</span>
            <span style={{ color: "#6f6a5c", fontSize: 18 }}>{open === i ? "–" : "+"}</span>
          </div>
          {open === i && (
            <div style={{ marginTop: 14, paddingLeft: 42 }}>
              <p style={{ color: "#e8e2d2", fontSize: 15, lineHeight: 1.55, margin: "0 0 10px", fontStyle: "italic" }}>"{p.q}"</p>
              <p style={{ color: "#9b9587", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{p.why}</p>
            </div>
          )}
        </div>
      ))}

      <div style={{ ...card, padding: "18px 20px", margin: "20px 0", background: "rgba(201,162,63,0.07)", borderColor: "#403517" }}>
        <div style={{ ...labelUC, color: GOLD, marginBottom: 8 }}>Don't offer on the spot</div>
        <p style={{ color: "#e8e2d2", fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          "This is really helpful — let me run the numbers and come back with my best cash offer. Good time to
          talk tomorrow?" Then pull comps and use the Analyzer before committing.
        </p>
      </div>

      <div style={{ ...labelUC, color: GOLD, marginBottom: 12 }}>Common objections</div>
      {objections.map((ob, i) => (
        <div key={i} style={{ ...card, padding: "16px 18px", marginBottom: 10 }}>
          <p style={{ color: "#e07a68", fontSize: 14.5, fontWeight: 600, margin: "0 0 8px", fontFamily: "'Outfit', sans-serif" }}>{ob.o}</p>
          <p style={{ color: "#cfc8b6", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{ob.a}</p>
        </div>
      ))}

      <div style={{ ...card, padding: "16px 18px", marginTop: 20, background: "rgba(64,120,70,0.10)", borderColor: "rgba(127,196,136,0.3)" }}>
        <p style={{ color: "#cfe8d2", fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: "#7fc488" }}>Texas rule:</strong> Tell the seller you're an investor who
          may assign the contract — and put it in writing (Property Code 5.0205). Honesty protects you and
          builds trust.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CHECKLIST
───────────────────────────────────────────────────────────── */
const C_KEY = "toolkit:checklist";
const steps = [
  { t: "Get it under contract",             d: "Use a purchase agreement with (1) an assignment clause, (2) an option/inspection period so you can back out, and (3) the written disclosure that you intend to assign. Have a Texas attorney review this template once — then reuse it." },
  { t: "Open title & deposit earnest money", d: "Take the signed contract to a title company or real estate attorney to open escrow. Earnest money (can be small) shows you're serious. Texas closings typically run through title companies." },
  { t: "Do due diligence in your option period", d: "Confirm ARV with fresh comps, get a real repair estimate (walk it with a contractor if you can), and check title for liens. This window is your safety net — use it." },
  { t: "Send the deal to your buyers list",  d: "Match it to verified cash buyers (Buyers tab). Share the address, ARV, repair estimate, your price, and your assignment fee. Best deals move in hours, so know your buyers cold." },
  { t: "Sign an assignment agreement",       d: "Your chosen buyer signs an Assignment of Contract, stepping into your shoes for your fee. Collect a non-refundable deposit from them so they're committed." },
  { t: "Buyer closes — you get paid",        d: "The buyer closes directly with the seller at the title company; your assignment fee is paid out at closing. Keep copies of everything for your records and taxes." },
];

function Checklist() {
  const [done,    setDone]    = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await storage.get(C_KEY); if (r?.value) setDone(JSON.parse(r.value)); } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async (i) => {
    const next = { ...done, [i]: !done[i] };
    setDone(next);
    try { await storage.set(C_KEY, JSON.stringify(next)); } catch {}
  };

  if (loading) return <p style={{ color: "#6f6a5c" }}>Loading…</p>;

  const count = Object.values(done).filter(Boolean).length;

  return (
    <div>
      <div style={{ ...card, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ ...labelUC, marginBottom: 6 }}>From "yes" to "paid" · {count}/{steps.length} done</div>
        <p style={{ color: "#9b9587", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          Check these off as you work a live deal. Tap a step for the detail.
        </p>
      </div>
      {steps.map((s, i) => (
        <div key={i} onClick={() => toggle(i)} style={{ ...card, padding: "16px 18px", marginBottom: 10, cursor: "pointer", opacity: done[i] ? 0.6 : 1 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 6, border: `1px solid ${done[i] ? "#7fc488" : "#3a352a"}`, background: done[i] ? "rgba(64,120,70,0.2)" : "transparent", color: "#7fc488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginTop: 1 }}>
              {done[i] ? "✓" : ""}
            </span>
            <div>
              <div style={{ fontSize: 16, color: "#f3eee0", fontWeight: 600, textDecoration: done[i] ? "line-through" : "none" }}>
                <span style={{ color: GOLD, fontFamily: "'DM Mono', monospace", fontSize: 13, marginRight: 8 }}>{i + 1}</span>
                {s.t}
              </div>
              <div style={{ color: "#9b9587", fontSize: 13.5, lineHeight: 1.55, marginTop: 6 }}>{s.d}</div>
            </div>
          </div>
        </div>
      ))}
      <p style={{ fontSize: 12, color: "#5a554a", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        Saved on this device. Educational only — have a Texas attorney review your contract and assignment
        templates before your first live deal.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AI AGENT
───────────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `You are the AI Deal Assistant inside a Texas real estate wholesaling toolkit, helping a brand-new wholesaler. Be concise, practical, skimmable, and honest — never hype, never promise easy money.

Core formula: Max Allowable Offer (MAO) = (ARV x 0.70) - repair costs - assignment fee. Show the arithmetic when you analyze a deal.

You can: analyze a deal and flag red flags, sanity-check numbers, estimate rough repair ranges, draft seller outreach or buyer blasts, and coach on the next concrete step.

Texas rules: no license needed to wholesale, BUT the wholesaler must DISCLOSE IN WRITING to the seller that they are acquiring an equitable interest and intend to assign the contract (Texas Property Code 5.0205). Surface this whenever a contract or offer comes up. You are NOT a lawyer — tell the user to have a Texas attorney review their contract and assignment templates once. Keep replies short.`;

const QUICK_PROMPTS = [
  "Analyze a deal for me",
  "Draft a text to a motivated seller",
  "Sanity-check my numbers",
  "What should I do next?",
];

function AIAgent() {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");

  const send = async (text) => {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError("The live AI agent can't run inside the mobile preview. Open this toolkit on desktop claude.ai and it'll work — or just ask Claude in the main chat to analyze your deal.");
        setBusy(false);
        return;
      }
      const txt = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("").trim();
      setMessages([...next, { role: "assistant", content: txt || "(no response)" }]);
    } catch {
      setError("The live AI agent can't run inside the mobile preview. Open this toolkit on desktop claude.ai and it'll work — or just ask Claude in the main chat to analyze your deal.");
    }
    setBusy(false);
  };

  return (
    <div>
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ ...labelUC, color: GOLD, marginBottom: 6 }}>AI Deal Assistant · live</div>
        <p style={{ color: "#9b9587", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          Describe a property, paste seller details, or ask for help. It knows your deal math and the Texas rules.
        </p>
      </div>

      <div style={{ ...card, padding: "8px 8px", minHeight: 220, marginBottom: 12 }}>
        {messages.length === 0 && (
          <div style={{ padding: "20px 12px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {QUICK_PROMPTS.map((q) => (
                <button key={q} onClick={() => send(q)} style={{ background: "#191610", border: "1px solid #2b271e", borderRadius: 100, color: "#cfc8b6", fontSize: 13, padding: "8px 13px", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", padding: "6px 6px" }}>
            <div style={{ maxWidth: "85%", background: m.role === "user" ? GOLD : "#191610", color: m.role === "user" ? "#100e0a" : "#e8e2d2", border: m.role === "user" ? "none" : "1px solid #2b271e", borderRadius: 12, padding: "10px 13px", fontSize: 14.5, lineHeight: 1.55, whiteSpace: "pre-wrap", fontFamily: "'Outfit', sans-serif" }}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div style={{ padding: "10px 12px", color: "#6f6a5c", fontSize: 13.5, fontStyle: "italic" }}>Thinking…</div>}
      </div>

      {error && <p style={{ color: "#e07a68", fontSize: 13, margin: "0 0 10px" }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="e.g. 3/2 in Garland, ARV ~280k, needs ~45k work, seller wants 175k…"
          rows={2}
          style={{ flex: 1, boxSizing: "border-box", background: "#13110d", border: "1px solid #2b271e", borderRadius: 10, color: "#f3eee0", fontFamily: "'Outfit', sans-serif", fontSize: 14.5, padding: "11px 13px", outline: "none", resize: "none" }}
        />
        <button onClick={() => send(input)} disabled={busy} style={{ background: GOLD, color: "#100e0a", border: "none", borderRadius: 10, padding: "0 18px", fontSize: 15, fontWeight: 600, cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1, fontFamily: "'Outfit', sans-serif" }}>
          Send
        </button>
      </div>
      <p style={{ fontSize: 12, color: "#5a554a", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
        AI guidance, not legal or financial advice. Verify comps and have a Texas attorney review contracts.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LEADS
───────────────────────────────────────────────────────────── */
const L_KEY = "toolkit:leadstatus";
const STAGES = ["New", "Mailed", "Called", "Talking", "Appt", "Dead"];
const stageColor = { New: "#8a8577", Mailed: "#7fb0c4", Called: "#c9a23f", Talking: "#b48fc4", Appt: "#7fc488", Dead: "#7a5048" };

function Leads() {
  const [status,     setStatus]     = useState({});
  const [loading,    setLoading]    = useState(true);
  const [copiedAddr, setCopiedAddr] = useState("");

  useEffect(() => {
    (async () => {
      try { const r = await storage.get(L_KEY); if (r?.value) setStatus(JSON.parse(r.value)); } catch {}
      setLoading(false);
    })();
  }, []);

  const copyAddr = async (addr) => {
    try { await navigator.clipboard.writeText(addr); setCopiedAddr(addr); setTimeout(() => setCopiedAddr(""), 1500); } catch {}
  };

  const cycle = (addr) => {
    const cur       = status[addr] || "New";
    const nextStage = STAGES[(STAGES.indexOf(cur) + 1) % STAGES.length];
    const map       = { ...status, [addr]: nextStage };
    setStatus(map);
    storage.set(L_KEY, JSON.stringify(map)).catch(() => {});
  };

  if (loading) return <p style={{ color: "#6f6a5c" }}>Loading…</p>;

  const worked = SEED_LEADS.filter((l) => (status[l.addr] || "New") !== "New").length;

  return (
    <div>
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ ...labelUC, color: GOLD, marginBottom: 6 }}>Seller Leads · {worked}/{SEED_LEADS.length} contacted</div>
        <p style={{ color: "#9b9587", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          High-equity, long-tenure owners in NW/NE Houston. Tap a status pill to advance a lead through your
          pipeline (New → Mailed → Called → Talking → Appt → Dead).
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <a href="https://propwire.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "#100e0a", background: GOLD, textDecoration: "none", borderRadius: 8, padding: "8px 13px", fontFamily: "'Outfit', sans-serif" }}>
            ↗ Open Propwire (data + skip trace)
          </a>
          <a href="https://taxsales.lgbs.com/map" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: GOLD, textDecoration: "none", border: `1px solid ${GOLD}55`, borderRadius: 8, padding: "8px 13px", fontFamily: "'Outfit', sans-serif" }}>
            ↗ Tax-sale map
          </a>
        </div>
      </div>

      {SEED_LEADS.map((l) => {
        const st = status[l.addr] || "New";
        return (
          <div key={l.rank} style={{ ...card, padding: "16px 18px", marginBottom: 10, opacity: st === "Dead" ? 0.55 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontSize: 15.5, color: "#f3eee0", fontWeight: 600, lineHeight: 1.3 }}>
                  <span style={{ color: GOLD, fontFamily: "'DM Mono', monospace", fontSize: 12, marginRight: 7 }}>#{l.rank}</span>
                  {l.addr}
                </div>
                <div style={{ color: "#9b9587", fontSize: 13.5, marginTop: 3 }}>{l.owner} · {l.len}</div>
              </div>
              <button onClick={() => cycle(l.addr)} style={{ flexShrink: 0, background: stageColor[st] + "22", border: `1px solid ${stageColor[st]}66`, color: stageColor[st], borderRadius: 100, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                {st}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12, alignItems: "center" }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: "#7fc488", fontWeight: 600 }}>{fmt(l.eqUsd)}</span>
              <span style={chip}>{l.eqPct} equity</span>
              {l.oos
                ? <span style={{ ...chip, color: "#e0a868", borderColor: "#5a4628" }}>✈ Out of state ({l.oos})</span>
                : <span style={chip}>📍 Local TX</span>}
              {l.note && <span style={chip}>{l.note}</span>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => copyAddr(l.addr)} style={{ flex: 1, background: copiedAddr === l.addr ? "rgba(64,120,70,0.18)" : "#191610", border: `1px solid ${copiedAddr === l.addr ? "rgba(127,196,136,0.4)" : "#2b271e"}`, color: copiedAddr === l.addr ? "#7fc488" : "#cfc8b6", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "9px 10px", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                {copiedAddr === l.addr ? "✓ Copied" : "Copy address"}
              </button>
              <a href="https://search.hcad.org/" target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", background: "#191610", border: "1px solid #2b271e", color: "#cfc8b6", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: "9px 10px", textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>
                ↗ Look up on HCAD
              </a>
            </div>
          </div>
        );
      })}

      <p style={{ fontSize: 12, color: "#5a554a", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        Workflow: Copy address → open HCAD → grab the owner's mailing address for the Mail tab. Links work on
        desktop and may be blocked in the mobile preview; copy always works. Status saved on this device.
        These owners haven't said they want to sell — that's discovered on the call.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIL
───────────────────────────────────────────────────────────── */
const MY_KEY = "toolkit:myinfo";

const greetName  = (owner) => owner.split(" ").slice(0, -1).join(" ") || owner;
const ownerAddrs = (owner) => SEED_LEADS.filter((l) => l.owner === owner).map((l) => l.addr);

function letterFor(lead, me, kind) {
  const name  = me.name  || "[Your Name]";
  const phone = me.phone || "[your phone]";
  const email = me.email || "[your email]";
  const greet = greetName(lead.owner);
  const addrs = ownerAddrs(lead.owner);
  const multi = addrs.length > 1;
  const oos   = lead.oos ? `, and I know managing a property from out of state isn't always easy` : ``;

  if (kind === "first") {
    if (multi) {
      return `Hi ${greet},

My name is ${name} and I'm a local real estate investor here in Houston. I noticed you own two homes on the same street — ${addrs.join(" and ")} — and have for quite a while${oos}.

I buy houses directly in this area as-is, for cash, with no repairs and no agent commissions on your end. Since your two are right by each other, I could keep it simple: one cash offer, one closing, on whatever timeline works for you.

There's no pressure and no cost to talk. If you'd ever consider selling either or both, I'd welcome a quick conversation.

You can reach me anytime at ${phone} or ${email}.

Thanks for your time,
${name}

P.S. I'm an investor, not an agent — so there are no fees or commissions on your side.`;
    }
    return `Hi ${greet},

My name is ${name} and I'm a local real estate investor here in Houston. I noticed you've owned the home at ${addrs[0]} for ${lead.len}${oos}.

I buy houses directly in this neighborhood as-is, for cash, with no repairs and no agent commissions on your end. If you'd ever consider selling, I'd be glad to put together a no-obligation cash offer.

There's no pressure and no cost to talk. If now isn't the right time, I completely understand.

You can reach me anytime at ${phone} or ${email}.

Thanks for your time,
${name}

P.S. I'm an investor, not an agent — so there are no fees or commissions on your side.`;
  }

  const what = multi
    ? `your properties on ${addrs[0].split(",")[0]}'s street`
    : `your property at ${addrs[0]}`;
  return `Hi ${greet},

I reached out a few weeks back about ${what} — just following up in case my note got buried.

I'm still interested, and my offer to buy as-is for cash (no repairs, no commissions) stands. Even if you're only curious what a cash offer might look like, I'm happy to run the numbers with no obligation.

I won't keep pestering you — but I'd genuinely welcome a quick call whenever it suits you.

${phone} · ${email}

Best,
${name}`;
}

function Mail() {
  const [me,      setMe]      = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [rank,    setRank]    = useState(1);
  const [kind,    setKind]    = useState("first");
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    (async () => {
      try { const r = await storage.get(MY_KEY); if (r?.value) setMe(JSON.parse(r.value)); } catch {}
      setLoading(false);
    })();
  }, []);

  const update = (k, v) => {
    const next = { ...me, [k]: v };
    setMe(next);
    storage.set(MY_KEY, JSON.stringify(next)).catch(() => {});
  };

  const lead   = SEED_LEADS.find((l) => l.rank === rank);
  const letter = lead ? letterFor(lead, me, kind) : "";

  const copy = async () => {
    try { await navigator.clipboard.writeText(letter); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", background: "#13110d", border: "1px solid #2b271e",
    borderRadius: 8, color: "#f3eee0", fontFamily: "'Outfit', sans-serif", fontSize: 15,
    padding: "10px 12px", outline: "none", marginTop: 6,
  };

  if (loading) return <p style={{ color: "#6f6a5c" }}>Loading…</p>;

  return (
    <div>
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ ...labelUC, color: GOLD, marginBottom: 8 }}>Your info — fill once, fills every letter</div>
        <input style={inputStyle} value={me.name}  onChange={(e) => update("name",  e.target.value)} placeholder="Your name" />
        <input style={inputStyle} value={me.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Your phone" />
        <input style={inputStyle} value={me.email} onChange={(e) => update("email", e.target.value)} placeholder="Your email" />
      </div>

      <div style={{ ...card, padding: "16px 20px", marginBottom: 14 }}>
        <label style={{ ...labelUC, display: "block", marginBottom: 6 }}>Lead</label>
        <select value={rank} onChange={(e) => setRank(+e.target.value)} style={{ ...inputStyle, marginTop: 0, appearance: "none" }}>
          {SEED_LEADS.map((l) => (
            <option key={l.rank} value={l.rank} style={{ background: "#13110d" }}>
              #{l.rank} · {l.owner} · {l.addr.split(",")[0]}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {[["first", "First touch"], ["follow", "Follow-up"]].map(([k, lbl]) => (
            <button key={k} onClick={() => setKind(k)} style={{ flex: 1, padding: 10, borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif", border: kind === k ? `1px solid ${GOLD}` : "1px solid #2b271e", background: kind === k ? "rgba(201,162,63,0.12)" : "#13110d", color: kind === k ? GOLD : "#8a8577" }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, padding: "18px 20px" }}>
        <div style={{ color: "#e8e2d2", fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "'Outfit', sans-serif" }}>{letter}</div>
        <button onClick={copy} style={{ width: "100%", marginTop: 16, background: copied ? "rgba(64,120,70,0.2)" : GOLD, color: copied ? "#7fc488" : "#100e0a", border: copied ? "1px solid rgba(127,196,136,0.4)" : "none", borderRadius: 9, padding: 13, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
          {copied ? "✓ Copied to clipboard" : "Copy letter"}
        </button>
      </div>

      <p style={{ fontSize: 12, color: "#5a554a", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        Mail to the owner's mailing address (often out of state), not the property. Only promise what you can
        deliver. Handwritten-style with a real stamp gets opened more.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SHELL
───────────────────────────────────────────────────────────── */
const TABS = [
  { id: "agent",    label: "✦ AI Agent", C: AIAgent    },
  { id: "leads",    label: "Leads",      C: Leads      },
  { id: "mail",     label: "Mail",       C: Mail       },
  { id: "start",    label: "Start Here", C: StartHere  },
  { id: "analyze",  label: "Analyzer",   C: Analyzer   },
  { id: "buyers",   label: "Buyers",     C: Buyers     },
  { id: "call",     label: "Call Guide", C: CallGuide  },
  { id: "checklist",label: "Checklist",  C: Checklist  },
];

export default function App() {
  const [tab, setTab] = useState("mail");
  const Active = TABS.find((t) => t.id === tab).C;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 20% 0%, #1d1a12 0%, #0c0b08 60%)", fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Outfit:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>
      <div style={{ maxWidth: 580, margin: "0 auto", padding: "28px 18px 60px" }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 6 }}>
            Texas Wholesaling Toolkit
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, lineHeight: 1, color: "#f3eee0", margin: 0, fontWeight: 600 }}>
            Your whole operation, one place
          </h1>
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14, marginBottom: 18, WebkitOverflowScrolling: "touch" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ whiteSpace: "nowrap", padding: "9px 15px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", border: tab === t.id ? `1px solid ${GOLD}` : "1px solid #2b271e", background: tab === t.id ? GOLD : "#13110d", color: tab === t.id ? "#100e0a" : "#8a8577" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Active />
      </div>
    </div>
  );
}
