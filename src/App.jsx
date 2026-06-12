import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────
   ADOVIO v3 — McKinsey Design Language
   Sharp · Authoritative · Data-forward · Zero emoji
───────────────────────────────────────────────────────────── */

const T = {
  // Neutrals
  white:   "#FFFFFF",
  paper:   "#FAFAF9",
  smoke:   "#F4F3F1",
  rule:    "#E5E4E0",
  border:  "#D1CFC9",
  muted:   "#9B9890",
  mid:     "#6B6860",
  body:    "#2C2B28",
  ink:     "#111110",
  // Charcoal primary
  char:    "#1A1917",
  charMid: "#2E2C28",
  charL:   "#3D3B36",
  // Accent — restrained forest
  forest:  "#1B4332",
  sage:    "#2D6A4F",
  mint:    "#52B788",
  teal:    "#1A3C34",
  // Data colours (for score bands)
  red:     "#B91C1C",
  amber:   "#B45309",
  gold:    "#92400E",
  green:   "#166534",
  // Light versions
  redL:    "#FEF2F2",
  amberL:  "#FFFBEB",
  goldL:   "#FEF3C7",
  greenL:  "#F0FDF4",
};

/* ── Questions ─────────────────────────────────────────────── */
const CHANGE_Qs = [
  { id:"c1",  cat:"Leadership",    text:"Senior leaders are personally visible in this change — speaking about it, showing up, modelling it — not just approving the budget." },
  { id:"c2",  cat:"Communication", text:"If you stopped five random employees today, they could explain why this change is happening and what it means for them." },
  { id:"c3",  cat:"Planning",      text:"A dedicated change plan exists — with named owners and milestones that go beyond the technical go-live." },
  { id:"c4",  cat:"History",       text:"The last major change here is remembered as a success — people trust this organisation can land change well." },
  { id:"c5",  cat:"Engagement",    text:"The people most affected by this change helped shape it — they are not just hearing about decisions after they are made." },
  { id:"c6",  cat:"Resources",     text:"This change has real resources behind it — budget, people, and time — not just goodwill and side-of-desk effort." },
  { id:"c7",  cat:"Resistance",    text:"We actively look for resistance signals and act on them early — rather than discovering them at go-live." },
  { id:"c8",  cat:"Capability",    text:"Everyone who must work differently will get the training and support to do it confidently — before go-live, not after." },
  { id:"c9",  cat:"Measurement",   text:"We have defined what success looks like in adoption terms — not just delivery milestones." },
  { id:"c10", cat:"Capacity",      text:"People genuinely have the bandwidth to absorb this change on top of their day jobs." },
];

const AI_Qs = [
  { id:"a1",  cat:"Leadership",        text:"Senior leaders can articulate a clear vision for AI here — beyond 'we need to use AI.'" },
  { id:"a2",  cat:"Communication",     text:"Employees have heard honest, direct answers about how AI will affect their roles — not vague reassurances." },
  { id:"a3",  cat:"Capability",        text:"There is a real plan to upskill people to work alongside AI — with time and resources committed to it." },
  { id:"a4",  cat:"Ethics & Trust",    text:"Data privacy, security, and ethical concerns about AI have been addressed openly — not buried in policy documents." },
  { id:"a5",  cat:"Culture",           text:"People feel safe saying 'I am worried about AI' out loud — without fear of looking resistant or replaceable." },
  { id:"a6",  cat:"Change Approach",   text:"AI rollout here is treated as a people change, not just a technology deployment." },
  { id:"a7",  cat:"Measurement",       text:"We measure whether people actually use AI and how they feel about it — not just licences deployed." },
  { id:"a8",  cat:"Momentum",          text:"Early AI wins are being found, shared, and celebrated — building belief instead of fear." },
  { id:"a9",  cat:"Manager Readiness", text:"Managers can confidently answer their teams' hardest question: 'What does AI mean for me?'" },
  { id:"a10", cat:"Narrative",         text:"There is a clear, consistent message on what AI will and will not replace — and people believe it." },
];

/* ── Sample ────────────────────────────────────────────────── */
const SAMPLE = {
  org: "Meridian Financial Group",
  type: "Change Readiness",
  overall: 3.1,
  level: "Moderate",
  dims: [
    { cat:"Leadership",    score:2.5 },
    { cat:"Communication", score:3.0 },
    { cat:"Planning",      score:4.0 },
    { cat:"History",       score:2.5 },
    { cat:"Engagement",    score:3.5 },
    { cat:"Resources",     score:3.0 },
    { cat:"Resistance",    score:2.0 },
    { cat:"Capability",    score:4.0 },
    { cat:"Measurement",   score:3.5 },
    { cat:"Capacity",      score:2.5 },
  ],
  finding: {
    title: "Resistance Monitoring Gap",
    body: "A score of 2.0 on Resistance represents the most urgent finding in this assessment. In financial services transformations of this scale, undetected resistance surfaces 6–9 months post-initiation — at the point where course correction becomes structurally costly. Without a formal monitoring mechanism, the organisation is operationally blind to the signals that precede adoption failure.",
    action: "Establish a biweekly anonymous pulse across all impacted units. Appoint a Change Champion per business unit with an explicit mandate to surface resistance before it reaches critical mass.",
    benchmark: "Organisations with active resistance monitoring are 2.3× more likely to meet adoption targets within six months of go-live. (Prosci, 2023 Benchmarking Report)",
  },
};

/* ── Helpers ───────────────────────────────────────────────── */
function avg(answers, questions) {
  const vals = questions.map(q => answers[q.id]||0).filter(v=>v>0);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
}
function getLevel(score) {
  if (score >= 4.2) return { label:"Strong",   color:T.green,  bg:T.greenL };
  if (score >= 3.2) return { label:"Moderate", color:T.gold,   bg:T.goldL  };
  if (score >= 2.2) return { label:"At Risk",  color:T.amber,  bg:T.amberL };
  return               { label:"Critical", color:T.red,    bg:T.redL   };
}
function bandColor(s){ return s>=4.2?T.green : s>=3.2?T.gold : s>=2.2?T.amber : T.red; }
function formatDate(){ return new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}); }

function buildPrompt(type, context, answers, questions, overall, lv) {
  const isChange = type==="change";
  const scoreLines = questions.map(q=>`  • ${q.cat} (${answers[q.id]||0}/5): "${q.text}"`).join("\n");
  const lowScores = questions.filter(q=>(answers[q.id]||0)<=2.5).map(q=>q.cat).join(", ");
  const highScores = questions.filter(q=>(answers[q.id]||0)>=4).map(q=>q.cat).join(", ");
  const system = isChange
    ? `You are a senior change management consultant with 20+ years of experience. Deep expertise in ADKAR, Kotter, Bridges, and Prosci. RULES: Never state the obvious. Reference specific scores AND industry context in every insight. Every recommendation must be executable tomorrow. Include real research benchmarks. Be direct and honest even when uncomfortable.`
    : `You are a world-class expert in AI adoption and organisational change. RULES: Never state the obvious about AI. Reference the organisation's industry. Every recommendation must be executable. Include real research benchmarks. Be honest about AI risks organisations typically underestimate.`;
  const user = `ASSESSMENT: ${isChange?"Change Readiness":"AI Adoption Readiness"}
ORGANISATION: ${context.orgName}
ROLE: ${context.role}
INITIATIVE: ${context.changeDesc}
${context.industry?`INDUSTRY: ${context.industry}`:""}
${context.size?`SIZE: ${context.size}`:""}
OVERALL SCORE: ${overall.toFixed(2)}/5.0 — ${lv.label}
LOW SCORES (<=2.5): ${lowScores||"None"}
HIGH SCORES (>=4.0): ${highScores||"None"}
SCORES:\n${scoreLines}

Write a report with EXACTLY these five sections using ## headings:
## Executive Summary
3-4 sentences. Direct and honest. Reference the overall score and what it means for THIS specific initiative.
## Key Findings
Exactly 4 findings. Each must reference a specific score, explain what it means in their industry context, and reveal a non-obvious implication. Use bold titles.
## Critical Risk Areas
Focus on 2-3 lowest dimensions. State real-world consequences. Give one immediate action per risk.
## Recommended Actions
Exactly 5 prioritised actions. Each must include: specific action, owner, timeline, and why this above others.
## What Good Looks Like
A vivid specific 90-day picture of success. Make it tangible and motivating.`;
  return { system, user };
}

/* ── CSS ───────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { scroll-behavior:smooth; }
  body { background:${T.paper}; color:${T.body}; font-family:'Inter',sans-serif; line-height:1.55; -webkit-font-smoothing:antialiased; }
  ::selection { background:${T.charL}; color:white; }
  ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:${T.smoke}} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}

  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes barFill { from{width:0} to{width:var(--w)} }

  .fu  { animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both; }
  .fu1 { animation:fadeUp .5s .07s cubic-bezier(.22,1,.36,1) both; }
  .fu2 { animation:fadeUp .5s .14s cubic-bezier(.22,1,.36,1) both; }
  .fu3 { animation:fadeUp .5s .21s cubic-bezier(.22,1,.36,1) both; }
  .fu4 { animation:fadeUp .5s .28s cubic-bezier(.22,1,.36,1) both; }
  .mono { font-family:'DM Mono',monospace; }

  /* Slider */
  .rslider { -webkit-appearance:none; appearance:none; width:100%; height:40px; background:transparent; cursor:grab; touch-action:pan-y; }
  .rslider:active { cursor:grabbing; }
  .rslider::-webkit-slider-runnable-track { height:3px; border-radius:0; background:var(--fill, ${T.border}); }
  .rslider::-moz-range-track { height:3px; background:var(--fill, ${T.border}); }
  .rslider::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--thumb, ${T.charMid}); border:2px solid white; box-shadow:0 1px 6px rgba(0,0,0,.22); margin-top:-7.5px; transition:transform .12s; }
  .rslider::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:var(--thumb, ${T.charMid}); border:2px solid white; box-shadow:0 1px 6px rgba(0,0,0,.22); }
  .rslider:hover::-webkit-slider-thumb { transform:scale(1.2); }
  .rslider:focus-visible { outline:2px solid ${T.charL}; outline-offset:4px; }

  input,textarea,select { font-family:'Inter',sans-serif; }
  button { cursor:pointer; border:none; background:none; font-family:'Inter',sans-serif; }

  @media (max-width:820px) {
    .hero-grid { grid-template-columns:1fr !important; }
    .two-col   { grid-template-columns:1fr !important; }
    .three-col { grid-template-columns:1fr !important; }
  }
`;

/* ── Primitive components ──────────────────────────────────── */
function Tag({ children, color=T.char, bg=T.smoke }) {
  return (
    <span style={{ display:"inline-block", padding:"3px 10px", background:bg, color, fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:"uppercase", border:`1px solid ${color}20` }}>
      {children}
    </span>
  );
}

function PrimaryBtn({ children, onClick, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
      padding:small?"9px 20px":"13px 32px",
      fontSize:small?12:13, fontWeight:700, letterSpacing:.8, textTransform:"uppercase",
      background:disabled?T.border:T.char, color:disabled?T.muted:T.white,
      border:"none", borderRadius:4, cursor:disabled?"not-allowed":"pointer",
      transition:"background .2s, transform .15s",
    }}
      onMouseEnter={e=>{if(!disabled){e.currentTarget.style.background=T.charL;e.currentTarget.style.transform="translateY(-1px)";}}}
      onMouseLeave={e=>{e.currentTarget.style.background=disabled?T.border:T.char;e.currentTarget.style.transform="translateY(0)";}}
    >{children}</button>
  );
}

function GhostBtn({ children, onClick, light }) {
  const c = light ? "rgba(255,255,255,.85)" : T.char;
  const b = light ? "rgba(255,255,255,.3)"  : T.charL;
  return (
    <button onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"12px 28px", borderRadius:4,
      fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:"uppercase",
      border:`1px solid ${b}`, color:c, background:"transparent", transition:"all .2s",
    }}
      onMouseEnter={e=>e.currentTarget.style.background=light?"rgba(255,255,255,.06)":T.smoke}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >{children}</button>
  );
}

function FieldLabel({ children, required }) {
  return <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:"uppercase", color:T.muted, marginBottom:7 }}>{children}{required&&<span style={{color:T.red}}> *</span>}</div>;
}

function TextInput({ label, value, onChange, placeholder, type="text", required }) {
  const [f,setF] = useState(false);
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{ width:"100%", padding:"12px 14px", borderRadius:4, fontSize:14, border:`1px solid ${f?T.char:T.border}`, background:T.white, color:T.ink, outline:"none", transition:"border-color .2s" }}
      />
    </div>
  );
}

/* ── Step indicator ────────────────────────────────────────── */
function Steps({ current }) {
  const steps = ["Context","Assessment","Details","Report"];
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:44 }}>
      {steps.map((s,i)=>(
        <div key={s} style={{ display:"flex", alignItems:"center", flex:i<steps.length-1?1:"none" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
            <div style={{ width:28, height:28, background:i<current?T.char:i===current?T.char:T.white, border:`1px solid ${i<=current?T.char:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:i<=current?T.white:T.muted, transition:"all .25s", borderRadius:2 }}>{i<current?"✓":i+1}</div>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:i===current?T.char:T.muted, whiteSpace:"nowrap" }}>{s}</span>
          </div>
          {i<steps.length-1 && <div style={{ flex:1, height:1, background:i<current?T.char:T.border, margin:"0 8px", marginBottom:18, transition:"background .3s" }}/>}
        </div>
      ))}
    </div>
  );
}

/* ── Score bar (no animation flash, clean) ─────────────────── */
function ScoreBar({ cat, score, index }) {
  const color = bandColor(score);
  const pct   = ((score-1)/4)*100;
  const [on, setOn] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setOn(true),index*55+300); return()=>clearTimeout(t); },[index]);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"130px 1fr 36px", alignItems:"center", gap:14, marginBottom:10 }}>
      <div style={{ fontSize:11, fontWeight:500, color:T.body }}>{cat}</div>
      <div style={{ height:4, background:T.rule }}>
        <div style={{ height:"100%", width:on?`${pct}%`:"0%", background:color, transition:"width .8s cubic-bezier(.22,1,.36,1)" }}/>
      </div>
      <div className="mono" style={{ fontSize:11, fontWeight:500, color, textAlign:"right" }}>{score.toFixed(1)}</div>
    </div>
  );
}

/* ── Score dial (SVG, minimal) ─────────────────────────────── */
function Dial({ score, size=160, light=false }) {
  const lv   = getLevel(score);
  const pct  = (score-1)/4;
  const r    = size*0.33, cx=size/2, cy=size*0.58;
  const circ = Math.PI*r, dash=pct*circ;
  const [on, setOn] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setOn(true),400); return()=>clearTimeout(t); },[]);
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={size} height={size*0.65} viewBox={`0 0 ${size} ${size*0.65}`}>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={light?"rgba(255,255,255,.12)":T.rule} strokeWidth={size*0.055} strokeLinecap="butt"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={lv.color} strokeWidth={size*0.055} strokeLinecap="butt"
          strokeDasharray={`${on?dash:0} ${circ}`} style={{ transition:"stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1)" }}/>
        <text x={cx} y={cy-size*.04} textAnchor="middle" fill={light?T.white:T.ink} style={{ fontSize:size*.17, fontWeight:800, fontFamily:"'Inter',sans-serif", letterSpacing:-1 }}>{score.toFixed(1)}</text>
        <text x={cx} y={cy+size*.06} textAnchor="middle" fill={light?"rgba(255,255,255,.35)":T.muted} style={{ fontSize:size*.055, fontFamily:"'DM Mono',monospace", letterSpacing:1.2 }}>/5.0</text>
      </svg>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", border:`1px solid ${lv.color}40`, background:light?"rgba(255,255,255,.06)":lv.bg }}>
        <div style={{ width:5, height:5, background:lv.color }}/>
        <span style={{ fontSize:10, fontWeight:700, color:light?T.white:lv.color, letterSpacing:.8, textTransform:"uppercase" }}>{lv.label}</span>
      </div>
    </div>
  );
}

/* ── Sample modal ──────────────────────────────────────────── */
function SampleModal({ open, onClose, onStart }) {
  if (!open) return null;
  const f = SAMPLE.finding;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(17,17,16,.7)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"4vh 16px 40px", overflowY:"auto", animation:"fadeIn .2s ease" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"min(700px,100%)", background:T.white, boxShadow:"0 24px 80px rgba(0,0,0,.35)", animation:"fadeUp .3s cubic-bezier(.22,1,.36,1)" }}>

        {/* Modal header */}
        <div style={{ background:T.char, padding:"28px 32px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:16, right:20, width:28, height:28, background:"rgba(255,255,255,.1)", color:T.white, fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          <Tag color={T.white} bg="rgba(255,255,255,.1)">Sample Report</Tag>
          <div style={{ fontSize:22, fontWeight:800, color:T.white, margin:"12px 0 2px", letterSpacing:-.5 }}>{SAMPLE.org}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", letterSpacing:.5 }}>{SAMPLE.type} · Confidential</div>
        </div>

        <div style={{ padding:"28px 32px" }}>

          {/* Score + bars */}
          <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:28, alignItems:"center", padding:"22px 24px", border:`1px solid ${T.rule}`, marginBottom:18 }}>
            <Dial score={SAMPLE.overall} size={148}/>
            <div style={{ paddingLeft:8 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:"uppercase", color:T.muted, marginBottom:14 }}>Dimension Profile</div>
              {SAMPLE.dims.map((d,i)=><ScoreBar key={d.cat} {...d} index={i}/>)}
            </div>
          </div>

          {/* Finding */}
          <div style={{ borderLeft:`3px solid ${T.amber}`, paddingLeft:18, marginBottom:22 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:"uppercase", color:T.amber, marginBottom:8 }}>Critical Risk Finding</div>
            <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:10, letterSpacing:-.2 }}>{f.title}</div>
            <p style={{ fontSize:13, color:T.mid, lineHeight:1.8, marginBottom:14 }}>{f.body}</p>
            <div style={{ background:T.smoke, padding:"14px 16px", borderLeft:`2px solid ${T.border}`, marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:"uppercase", color:T.muted, marginBottom:6 }}>Recommended Action</div>
              <p style={{ fontSize:13, color:T.body, lineHeight:1.7 }}>{f.action}</p>
            </div>
            <p style={{ fontSize:11.5, color:T.muted, fontStyle:"italic" }}>{f.benchmark}</p>
          </div>

          <p style={{ fontSize:12.5, color:T.muted, marginBottom:22, lineHeight:1.65 }}>
            Your full report includes an executive summary, four key findings, a risk analysis, five prioritised actions, and a 90-day outlook — generated by AI and tailored to your scores, industry, and initiative.
          </p>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <PrimaryBtn onClick={onStart}>Begin assessment</PrimaryBtn>
            <GhostBtn onClick={onClose}>Close</GhostBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOME SCREEN
══════════════════════════════════════════════════════════ */
function HomeScreen({ onStart }) {
  const [sample, setSample] = useState(false);
  return (
    <div>
      <SampleModal open={sample} onClose={()=>setSample(false)} onStart={()=>{setSample(false);onStart("change");}}/>

      {/* HERO */}
      <section style={{ background:T.char, padding:"96px 32px 88px", position:"relative", overflow:"hidden" }}>
        {/* grid lines */}
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)`, backgroundSize:"48px 48px" }}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:T.charL }}/>

        <div className="hero-grid" style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1.15fr .85fr", gap:64, alignItems:"center" }}>
          <div>
            <div className="fu" style={{ marginBottom:20 }}>
              <Tag color="rgba(255,255,255,.55)" bg="rgba(255,255,255,.06)">Change Intelligence Platform</Tag>
            </div>
            <h1 className="fu1" style={{ fontSize:"clamp(34px,4.8vw,58px)", fontWeight:800, color:T.white, lineHeight:1.08, letterSpacing:-1.5, marginBottom:22 }}>
              Know if your<br/>organisation is ready<br/><span style={{ color:T.mint }}>before</span> you launch.
            </h1>
            <p className="fu2" style={{ fontSize:16, color:"rgba(255,255,255,.55)", lineHeight:1.75, maxWidth:440, marginBottom:36 }}>
              A proprietary AI diagnostic built on 20 years of change management practice. Ten questions. A personalised readiness report in your inbox.
            </p>
            <div className="fu3" style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:40 }}>
              <PrimaryBtn onClick={()=>onStart("change")}>Start assessment</PrimaryBtn>
              <GhostBtn light onClick={()=>setSample(true)}>View sample report</GhostBtn>
            </div>
            <div className="fu4" style={{ display:"grid", gridTemplateColumns:"repeat(3,auto)", gap:"0 32px", maxWidth:440 }}>
              {[["10","Dimensions assessed"],["AI","Personalised analysis"],["Free","No login required"]].map(([v,l])=>(
                <div key={l} style={{ borderTop:`1px solid rgba(255,255,255,.12)`, paddingTop:14 }}>
                  <div style={{ fontSize:18, fontWeight:800, color:T.white, letterSpacing:-.5 }}>{v}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", letterSpacing:.4, marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Score preview card */}
          <div className="fu2" style={{ display:"flex", justifyContent:"center" }}>
            <div style={{ width:"min(360px,100%)", border:`1px solid rgba(255,255,255,.1)`, background:"rgba(255,255,255,.04)", padding:"24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, paddingBottom:14, borderBottom:"1px solid rgba(255,255,255,.08)" }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:2 }}>Sample Report</div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{SAMPLE.org}</div>
                </div>
                <Tag color="rgba(255,255,255,.5)" bg="rgba(255,255,255,.06)">Preview</Tag>
              </div>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:18 }}>
                <Dial score={SAMPLE.overall} size={140} light/>
              </div>
              <div style={{ paddingTop:14, borderTop:"1px solid rgba(255,255,255,.08)" }}>
                {SAMPLE.dims.slice(0,5).map((d,i)=>{
                  const color = bandColor(d.score);
                  const pct   = ((d.score-1)/4)*100;
                  return (
                    <div key={d.cat} style={{ display:"grid", gridTemplateColumns:"90px 1fr 26px", alignItems:"center", gap:10, marginBottom:8 }}>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:500 }}>{d.cat}</div>
                      <div style={{ height:3, background:"rgba(255,255,255,.1)" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:color }}/>
                      </div>
                      <div className="mono" style={{ fontSize:10, color, textAlign:"right" }}>{d.score.toFixed(1)}</div>
                    </div>
                  );
                })}
                <button onClick={()=>setSample(true)} style={{ marginTop:14, width:"100%", padding:"10px", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)", fontSize:11, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", transition:"background .2s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.11)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.07)"}
                >View full sample report</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METHODOLOGY STRIP */}
      <section style={{ background:T.smoke, borderBottom:`1px solid ${T.rule}`, padding:"16px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", gap:32, flexWrap:"wrap", justifyContent:"center", alignItems:"center" }}>
          {["Grounded in ADKAR, Kotter and Prosci methodology","Reports generated by Claude AI","Built by a 20-year change management practitioner","Data is never sold or shared"].map(s=>(
            <div key={s} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11.5, color:T.muted, fontWeight:500 }}>
              <div style={{ width:4, height:4, background:T.border }}/>
              {s}
            </div>
          ))}
        </div>
      </section>

      {/* ASSESSMENTS */}
      <section style={{ padding:"88px 32px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ marginBottom:56 }}>
          <Tag>Two Diagnostics</Tag>
          <h2 style={{ fontSize:"clamp(26px,3.4vw,36px)", fontWeight:800, marginTop:14, letterSpacing:-.6, lineHeight:1.15 }}>Select your diagnostic</h2>
          <p style={{ color:T.mid, marginTop:10, maxWidth:420, fontSize:14.5 }}>Each assessment takes ten minutes and produces a personalised AI analysis delivered by email.</p>
        </div>
        <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:T.rule }}>
          {[
            { type:"change", num:"01", title:"Change Readiness", desc:"For any major initiative — ERP, restructure, merger, culture shift. Assesses the ten dimensions that determine whether change sticks.", dims:["Leadership","Resistance","Capacity","Engagement","Planning"] },
            { type:"ai",     num:"02", title:"AI Adoption Readiness", desc:"For organisations rolling out AI tools. Measures the human layer that most AI programmes overlook — trust, narrative, manager readiness, psychological safety.", dims:["Leadership","Ethics & Trust","Narrative","Manager Readiness","Culture"] },
          ].map(c=>(
            <div key={c.type} style={{ background:T.white, padding:"40px 36px" }}
              onMouseEnter={e=>e.currentTarget.style.background=T.paper}
              onMouseLeave={e=>e.currentTarget.style.background=T.white}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
                <div className="mono" style={{ fontSize:11, color:T.muted, letterSpacing:1 }}>{c.num}</div>
                <Tag>{c.title}</Tag>
              </div>
              <h3 style={{ fontSize:22, fontWeight:800, marginBottom:12, letterSpacing:-.4 }}>{c.title}</h3>
              <p style={{ color:T.mid, fontSize:13.5, lineHeight:1.75, marginBottom:24 }}>{c.desc}</p>
              <div style={{ marginBottom:28, paddingBottom:28, borderBottom:`1px solid ${T.rule}` }}>
                {c.dims.map(d=>(
                  <div key={d} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:T.body, marginBottom:7, fontWeight:500 }}>
                    <div style={{ width:3, height:3, background:T.charL }}/>
                    {d}
                  </div>
                ))}
              </div>
              <PrimaryBtn onClick={()=>onStart(c.type)}>Begin assessment</PrimaryBtn>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background:T.smoke, borderTop:`1px solid ${T.rule}`, borderBottom:`1px solid ${T.rule}`, padding:"80px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ marginBottom:52 }}>
            <Tag>Process</Tag>
            <h2 style={{ fontSize:"clamp(24px,3vw,32px)", fontWeight:800, marginTop:14, letterSpacing:-.5 }}>From input to insight in ten minutes</h2>
          </div>
          <div className="three-col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:T.rule }}>
            {[
              ["01","Describe your initiative","Provide context — industry, organisation size, what is changing. The AI uses this to generate specific, non-generic analysis."],
              ["02","Rate ten statements","Practitioner-designed questions drawn from ADKAR, Kotter, and two decades of real change engagements. Use the slider to respond."],
              ["03","Receive your report","A full AI analysis — executive summary, key findings, risk areas, five prioritised actions, and a 90-day outlook — delivered by email."],
            ].map(([n,t,d])=>(
              <div key={n} style={{ background:T.white, padding:"32px 28px" }}>
                <div className="mono" style={{ fontSize:11, color:T.muted, letterSpacing:1, marginBottom:16 }}>{n}</div>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:10, letterSpacing:-.2 }}>{t}</div>
                <div style={{ fontSize:13, color:T.mid, lineHeight:1.75 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU RECEIVE */}
      <section style={{ padding:"88px 32px" }}>
        <div className="two-col" style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }}>
          <div>
            <Tag color={T.amber} bg={T.amberL}>Report Contents</Tag>
            <h2 style={{ fontSize:"clamp(24px,3vw,32px)", fontWeight:800, margin:"14px 0 16px", letterSpacing:-.5, lineHeight:1.2 }}>Not a score.<br/>A diagnosis.</h2>
            <p style={{ color:T.mid, lineHeight:1.85, fontSize:14, marginBottom:24 }}>Generic assessments confirm what you already suspect. Adovio's AI interprets your specific scores against your industry and initiative — then identifies what will break first and what to do about it.</p>
            <div style={{ borderTop:`1px solid ${T.rule}` }}>
              {["Executive summary identifying the single most critical issue","Four findings with non-obvious implications for your context","Risk areas with real-world consequences and root causes","Five prioritised actions — owner, timeline, rationale","A 90-day picture of what successful adoption looks like"].map((item,i)=>(
                <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:`1px solid ${T.rule}`, alignItems:"flex-start" }}>
                  <div className="mono" style={{ fontSize:10, color:T.muted, paddingTop:2, flexShrink:0 }}>0{i+1}</div>
                  <div style={{ fontSize:13, color:T.body, lineHeight:1.6 }}>{item}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:24 }}>
              <PrimaryBtn onClick={()=>setSample(true)}>View sample report</PrimaryBtn>
            </div>
          </div>
          <div>
            <div style={{ border:`1px solid ${T.rule}`, background:T.white, padding:"28px" }}>
              <div style={{ borderBottom:`1px solid ${T.rule}`, paddingBottom:16, marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:"uppercase", color:T.muted, marginBottom:2 }}>Change Readiness Report</div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.ink }}>{SAMPLE.org}</div>
                </div>
                <div style={{ fontSize:11, color:T.muted }}>Sample</div>
              </div>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
                <Dial score={SAMPLE.overall} size={148}/>
              </div>
              <div style={{ borderTop:`1px solid ${T.rule}`, paddingTop:16 }}>
                {SAMPLE.dims.slice(0,7).map((d,i)=><ScoreBar key={d.cat} {...d} index={i}/>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:T.char, padding:"72px 32px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)`, backgroundSize:"48px 48px" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <h2 style={{ fontSize:"clamp(24px,3.6vw,36px)", fontWeight:800, color:T.white, marginBottom:12, letterSpacing:-.6 }}>Know where you stand.</h2>
          <p style={{ color:"rgba(255,255,255,.45)", marginBottom:32, fontSize:14.5 }}>Ten minutes. Free. Built for the change community.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>onStart("change")} style={{ padding:"13px 32px", fontSize:13, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", background:T.white, color:T.char, border:"none", borderRadius:4, transition:"all .2s" }}
              onMouseEnter={e=>e.currentTarget.style.background=T.smoke}
              onMouseLeave={e=>e.currentTarget.style.background=T.white}
            >Change Readiness</button>
            <GhostBtn light onClick={()=>onStart("ai")}>AI Adoption Readiness</GhostBtn>
          </div>
        </div>
      </section>

      <footer style={{ background:T.ink, borderTop:`1px solid rgba(255,255,255,.06)`, padding:"28px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:T.white, letterSpacing:-.3 }}>ADOVIO</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.25)", letterSpacing:1.2, marginTop:2 }}>THE PATH TO ADOPTION</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.25)", letterSpacing:.5 }}>ADOVIO.IO · FREE FOR THE CHANGE COMMUNITY</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", letterSpacing:.5, marginBottom:4 }}>BUILT BY</div>
          <a href="https://www.linkedin.com/in/divyamkaushik/" target="_blank" rel="noreferrer" style={{
            fontSize:12, fontWeight:700, color:T.white, textDecoration:"none",
            letterSpacing:.3, borderBottom:"1px solid rgba(255,255,255,.2)",
            paddingBottom:1, transition:"border-color .2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.6)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.2)"}
          >Divyam Kaushik</a>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.25)", letterSpacing:.5, marginTop:2 }}>GLOBAL OCM LEADER · DELOITTE</div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONTEXT STEP
══════════════════════════════════════════════════════════ */
function ContextStep({ type, context, setContext, onNext, onBack }) {
  const valid = context.orgName&&context.role&&context.changeDesc;
  return (
    <div style={{ maxWidth:620, margin:"0 auto", padding:"56px 24px" }}>
      <Steps current={0}/>
      <Tag>{type==="change"?"Change Readiness":"AI Adoption Readiness"}</Tag>
      <h2 style={{ fontSize:28, fontWeight:800, margin:"14px 0 6px", letterSpacing:-.5 }}>Set the context</h2>
      <p style={{ color:T.mid, fontSize:13.5, marginBottom:36, lineHeight:1.65 }}>This is what transforms your report from generic to specific. Takes about one minute.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
        <TextInput label="Organisation or initiative name" required value={context.orgName} onChange={v=>setContext(c=>({...c,orgName:v}))} placeholder="e.g. Acme Corp — ERP Rollout 2026"/>
        <TextInput label="Your role" required value={context.role} onChange={v=>setContext(c=>({...c,role:v}))} placeholder="e.g. Change Manager, HR Director, Project Sponsor"/>
        <div>
          <FieldLabel required>Briefly describe the change or initiative</FieldLabel>
          <textarea value={context.changeDesc} onChange={e=>setContext(c=>({...c,changeDesc:e.target.value}))}
            placeholder={type==="change"?"e.g. Implementing a new ERP system across three business units over 18 months...":"e.g. Rolling out Microsoft Copilot to 500 employees in Q3..."}
            rows={3} style={{ width:"100%", padding:"12px 14px", borderRadius:4, fontSize:14, border:`1px solid ${T.border}`, background:T.white, color:T.ink, outline:"none", resize:"vertical", transition:"border-color .2s" }}
            onFocus={e=>e.target.style.borderColor=T.char} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[["Industry",["Financial Services","Healthcare","Technology","Government","Retail","Manufacturing","Education","Professional Services","Other"],"industry"],["Organisation size",["1–50","51–200","201–1,000","1,001–5,000","5,000+"],"size"]].map(([lbl,opts,key])=>(
            <div key={key}>
              <FieldLabel>{lbl}</FieldLabel>
              <select value={context[key]} onChange={e=>setContext(c=>({...c,[key]:e.target.value}))} style={{ width:"100%", padding:"12px 14px", borderRadius:4, fontSize:13.5, border:`1px solid ${T.border}`, background:T.white, color:T.body, outline:"none" }}>
                <option value="">Select</option>
                {opts.map(o=><option key={o} value={o}>{key==="size"?`${o} employees`:o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:44 }}>
        <GhostBtn onClick={onBack}>Back</GhostBtn>
        <PrimaryBtn onClick={onNext} disabled={!valid}>Continue</PrimaryBtn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   QUESTIONS STEP
══════════════════════════════════════════════════════════ */
function SliderQ({ q, index, value, onChange, isLast }) {
  const answered = value !== undefined;
  const display  = answered ? value : 3;
  const color    = answered ? bandColor(display) : T.border;
  const pct      = ((display-1)/4)*100;
  const fillGrad = answered
    ? `linear-gradient(90deg, ${color} 0%, ${color} ${pct}%, ${T.rule} ${pct}%)`
    : T.rule;
  const labels = ["Strongly Disagree","Disagree","Neutral","Agree","Strongly Agree"];

  return (
    <div style={{ padding:"28px 0", borderBottom:!isLast?`1px solid ${T.rule}`:"none", animation:`fadeUp .4s ${index*.04}s both` }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <div className="mono" style={{ fontSize:10, color:answered?T.char:T.muted, letterSpacing:1, minWidth:22 }}>{answered?`0${index+1} ✓`:`0${index+1}`}</div>
        <Tag color={T.mid} bg={T.smoke}>{q.cat}</Tag>
        {answered && <span style={{ marginLeft:"auto", fontSize:11, fontWeight:600, color, letterSpacing:.3 }}>{labels[display-1]}</span>}
      </div>
      <p style={{ fontSize:14.5, lineHeight:1.7, color:T.body, marginBottom:18, paddingLeft:32 }}>{q.text}</p>
      <div style={{ paddingLeft:32 }}>
        <input type="range" min={1} max={5} step={1} value={display} className="rslider"
          onChange={e=>onChange(parseInt(e.target.value))}
          onMouseDown={()=>{ if(!answered) onChange(3); }}
          onTouchStart={()=>{ if(!answered) onChange(3); }}
          style={{ "--fill":fillGrad, "--thumb":color }}
          aria-label={`${q.cat}: ${q.text}`}
        />
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:0 }}>
          {[1,2,3,4,5].map(v=>(
            <button key={v} onClick={()=>onChange(v)} style={{ fontSize:11, fontWeight:answered&&display===v?800:500, color:answered&&display===v?color:T.muted, padding:"4px 2px", minWidth:28, textAlign:v===1?"left":v===5?"right":"center", transition:"color .15s" }}>{v}</button>
          ))}
        </div>
        {!answered && <div style={{ fontSize:11, color:T.muted, marginTop:6, letterSpacing:.2 }}>Drag or tap a number to respond</div>}
      </div>
    </div>
  );
}

function QuestionsStep({ type, answers, setAnswers, onNext, onBack }) {
  const questions = type==="change"?CHANGE_Qs:AI_Qs;
  const answered  = questions.filter(q=>answers[q.id]).length;
  const allDone   = answered===questions.length;
  return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"56px 24px" }}>
      <Steps current={1}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:10, marginBottom:18 }}>
        <div>
          <Tag>{type==="change"?"Change Readiness":"AI Adoption Readiness"}</Tag>
          <h2 style={{ fontSize:26, fontWeight:800, margin:"12px 0 2px", letterSpacing:-.5 }}>Rate each statement</h2>
          <p style={{ color:T.mid, fontSize:12.5, marginTop:4 }}>Go with your first instinct. Drag the slider or tap a number.</p>
        </div>
        <div className="mono" style={{ fontSize:12, color:T.char, fontWeight:700 }}>{answered}/{questions.length}</div>
      </div>
      <div style={{ height:3, background:T.rule, marginBottom:40 }}>
        <div style={{ height:"100%", width:`${(answered/questions.length)*100}%`, background:T.char, transition:"width .3s" }}/>
      </div>
      {questions.map((q,i)=>(
        <SliderQ key={q.id} q={q} index={i} isLast={i===questions.length-1}
          value={answers[q.id]}
          onChange={v=>setAnswers(a=>({...a,[q.id]:v}))}/>
      ))}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:44 }}>
        <GhostBtn onClick={onBack}>Back</GhostBtn>
        <PrimaryBtn onClick={onNext} disabled={!allDone}>{allDone?"Continue":""+`${questions.length-answered} remaining`}</PrimaryBtn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMAIL STEP
══════════════════════════════════════════════════════════ */
function EmailStep({ type, answers, email, setEmail, name, setName, onNext, onBack }) {
  const valid = email&&email.includes("@")&&name;
  const questions = type==="change"?CHANGE_Qs:AI_Qs;
  const overall = avg(answers,questions);
  return (
    <div style={{ maxWidth:520, margin:"0 auto", padding:"56px 24px" }}>
      <Steps current={2}/>
      <Tag>Assessment complete</Tag>
      <h2 style={{ fontSize:28, fontWeight:800, margin:"14px 0 6px", letterSpacing:-.5 }}>Your score is ready.</h2>
      <p style={{ color:T.mid, fontSize:13.5, marginBottom:30 }}>The full AI analysis will be delivered to your inbox.</p>

      {/* Score reveal */}
      <div style={{ border:`1px solid ${T.rule}`, background:T.white, padding:"28px", textAlign:"center", marginBottom:24 }}>
        <Dial score={overall} size={158}/>
        <p style={{ fontSize:12, color:T.muted, marginTop:16, lineHeight:1.65 }}>
          Your full report — executive summary, findings, risk areas, and five prioritised actions — is generated by AI and tailored to your specific scores and context.
        </p>
      </div>

      <div style={{ border:`1px solid ${T.rule}`, background:T.white, padding:"28px", display:"flex", flexDirection:"column", gap:18, marginBottom:0 }}>
        <TextInput label="Full name" required value={name} onChange={setName} placeholder="e.g. Sarah Johnson"/>
        <TextInput label="Work email" required type="email" value={email} onChange={setEmail} placeholder="e.g. sarah@company.com"/>
        <div style={{ padding:"10px 14px", background:T.smoke, border:`1px solid ${T.rule}`, fontSize:11.5, color:T.muted, lineHeight:1.65 }}>
          Used only to send this report and occasional change-community insights. No spam, ever.
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:32 }}>
        <GhostBtn onClick={onBack}>Back</GhostBtn>
        <PrimaryBtn onClick={onNext} disabled={!valid}>Send my report</PrimaryBtn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GENERATING
══════════════════════════════════════════════════════════ */
function GeneratingScreen({ type }) {
  const steps = ["Analysing your responses across all dimensions","Reading your scores against industry benchmarks","Identifying risk patterns and gaps","Writing your personalised recommendations","Preparing your report for delivery"];
  const [step, setStep] = useState(0);
  useEffect(()=>{ const t=setInterval(()=>setStep(s=>Math.min(s+1,steps.length-1)),1900); return()=>clearInterval(t); },[]);
  return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:28, padding:40 }}>
      <div style={{ width:40, height:40, border:`2px solid ${T.rule}`, borderTopColor:T.char, borderRadius:"50%", animation:"spin .85s linear infinite" }}/>
      <div style={{ textAlign:"center", maxWidth:380 }}>
        <h3 style={{ fontSize:20, fontWeight:800, letterSpacing:-.4, marginBottom:10 }}>Generating your report</h3>
        <p style={{ fontSize:13, color:T.mid, fontWeight:500, minHeight:20 }}>{steps[step]}</p>
        <div style={{ display:"flex", gap:4, justifyContent:"center", marginTop:18 }}>
          {steps.map((_,i)=><div key={i} style={{ width:i===step?20:5, height:3, background:i<=step?T.char:T.rule, transition:"all .3s" }}/>)}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONFIRMATION
══════════════════════════════════════════════════════════ */
function ConfirmationScreen({ data, onRestart, onOther }) {
  const { respondent, type, overall, level } = data;
  const isChange = type==="change";
  const lv = getLevel(overall);
  return (
    <div style={{ maxWidth:580, margin:"0 auto", padding:"72px 24px", textAlign:"center" }}>
      <div style={{ width:56, height:56, background:T.char, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 28px" }}>
        <div style={{ width:20, height:20, border:`2px solid white`, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:6, height:10, border:`2px solid white`, borderTop:"none", borderLeft:"none", transform:"rotate(45deg)", marginTop:-2 }}/>
        </div>
      </div>

      <h1 style={{ fontSize:32, fontWeight:800, marginBottom:12, letterSpacing:-.6, color:T.ink }}>Report on its way.</h1>
      <p style={{ fontSize:15, color:T.mid, lineHeight:1.75, marginBottom:36 }}>
        Sent to <strong style={{color:T.ink}}>{respondent.email}</strong>. Should arrive within two minutes — check your spam folder if it does not appear.
      </p>

      <div style={{ border:`1px solid ${T.rule}`, background:T.white, padding:"28px", marginBottom:24, textAlign:"center" }}>
        <Dial score={overall} size={160}/>
        <p style={{ fontSize:12.5, color:T.muted, marginTop:16, lineHeight:1.65 }}>Full analysis, findings, risk areas, and five recommended actions are in your email.</p>
      </div>

      <div style={{ border:`1px solid ${T.rule}`, padding:"22px 26px", marginBottom:20, textAlign:"left", display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:4 }}>Connect on LinkedIn</div>
          <p style={{ fontSize:12, color:T.mid, lineHeight:1.6 }}>Weekly insights on change management and AI adoption from the practitioner who built Adovio.</p>
        </div>
        <a href="https://www.linkedin.com/in/divyamkaushik/" target="_blank" rel="noreferrer" style={{ display:"inline-block", padding:"10px 22px", background:T.char, color:T.white, fontSize:12, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", textDecoration:"none", transition:"background .2s" }}>Connect</a>
      </div>

      <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <PrimaryBtn onClick={onOther}>{isChange?"AI Adoption Assessment":"Change Readiness Assessment"}</PrimaryBtn>
        <GhostBtn onClick={onRestart}>Back to home</GhostBtn>
      </div>

      <div style={{ marginTop:48, paddingTop:24, borderTop:`1px solid ${T.rule}` }}>
        <div style={{ fontSize:13, fontWeight:800, color:T.ink, letterSpacing:-.2 }}>ADOVIO</div>
        <p style={{ fontSize:10.5, color:T.muted, marginTop:3, letterSpacing:.5 }}>THE PATH TO ADOPTION · ADOVIO.IO</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen]           = useState("home");
  const [type, setType]               = useState(null);
  const [context, setContext]         = useState({ orgName:"", role:"", changeDesc:"", industry:"", size:"" });
  const [answers, setAnswers]         = useState({});
  const [email, setEmail]             = useState("");
  const [name, setName]               = useState("");
  const [confirmData, setConfirmData] = useState(null);

  useEffect(()=>{
    const s=document.createElement("style");
    s.textContent=CSS;
    document.head.appendChild(s);
    return()=>document.head.removeChild(s);
  },[]);

  const resetFor = (t) => {
    setType(t); setAnswers({});
    setContext({ orgName:"", role:"", changeDesc:"", industry:"", size:"" });
    setEmail(""); setName(""); setScreen("context"); window.scrollTo(0,0);
  };

  const handleGenerate = async () => {
    setScreen("generating"); window.scrollTo(0,0);
    const questions = type==="change"?CHANGE_Qs:AI_Qs;
    const overall   = avg(answers,questions);
    const lv        = getLevel(overall);
    const scored    = questions.map(q=>({ cat:q.cat, score:answers[q.id]||0, text:q.text }));
    const { system, user } = buildPrompt(type, context, answers, questions, overall, lv);

    try {
      const genRes = await fetch("/api/generate", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1500, system, messages:[{ role:"user", content:user }] }),
      });
      const genRaw = await genRes.text();
      let genData;
      try { genData=JSON.parse(genRaw); } catch(e){ throw new Error("Invalid AI response"); }
      const aiText = genData?.content?.[0]?.text || "Unable to generate report.";

      try {
        await fetch("/api/email", {
          method:"POST", headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({ to:email, name, orgName:context.orgName, type, overall:overall.toFixed(2), level:lv.label, aiText, scores:scored }),
        });
      } catch(emailErr) { console.error("Email failed:", emailErr); }

      setConfirmData({ context, respondent:{ name, email, role:context.role }, type, overall, level:lv.label });
      setScreen("confirmation"); window.scrollTo(0,0);
    } catch(err) {
      console.error("Error:", err);
      setConfirmData({ context, respondent:{ name, email, role:context.role }, type, overall:0, level:"" });
      setScreen("confirmation"); window.scrollTo(0,0);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:T.paper }}>
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(250,250,249,.92)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderBottom:`1px solid ${T.rule}`, padding:"0 28px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={()=>{ setScreen("home"); window.scrollTo(0,0); }} style={{ fontSize:14, fontWeight:800, color:T.char, letterSpacing:.5, textTransform:"uppercase" }}>
          Adovio
        </button>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <button onClick={()=>resetFor("change")} style={{ padding:"7px 14px", fontSize:11.5, fontWeight:700, letterSpacing:.6, textTransform:"uppercase", color:T.mid, transition:"color .15s" }}
            onMouseEnter={e=>e.currentTarget.style.color=T.char}
            onMouseLeave={e=>e.currentTarget.style.color=T.mid}
          >Change Readiness</button>
          <PrimaryBtn small onClick={()=>resetFor("ai")}>AI Readiness</PrimaryBtn>
        </div>
      </nav>

      {screen==="home"         && <HomeScreen onStart={resetFor}/>}
      {screen==="context"      && <ContextStep type={type} context={context} setContext={setContext} onNext={()=>{ setScreen("questions"); window.scrollTo(0,0); }} onBack={()=>setScreen("home")}/>}
      {screen==="questions"    && <QuestionsStep type={type} answers={answers} setAnswers={setAnswers} onNext={()=>{ setScreen("email"); window.scrollTo(0,0); }} onBack={()=>setScreen("context")}/>}
      {screen==="email"        && <EmailStep type={type} answers={answers} email={email} setEmail={setEmail} name={name} setName={setName} onNext={handleGenerate} onBack={()=>setScreen("questions")}/>}
      {screen==="generating"   && <GeneratingScreen type={type}/>}
      {screen==="confirmation" && confirmData && <ConfirmationScreen data={confirmData} onRestart={()=>setScreen("home")} onOther={()=>resetFor(type==="change"?"ai":"change")}/>}
    </div>
  );
}
