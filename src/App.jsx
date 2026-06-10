import { useState, useEffect, useRef } from "react";

/* ────────────────────────────────────────────────────────────────
   ADOVIO v2 — Change Intelligence Platform
   Conversion-focused redesign: show the reward before the ask.
──────────────────────────────────────────────────────────────── */

const T = {
  white:"#FFFFFF", off:"#F8F7F4", light:"#EEECEA", border:"#DDD9D0",
  muted:"#9E9A92", mid:"#6B6760", body:"#2E2C29", ink:"#141311",
  forest:"#1B4332", deep:"#0A1F14", sage:"#40916C", mint:"#95D5B2", lime:"#D8F3DC",
  gold:"#D4A843", goldD:"#B5883A", goldL:"#FDF3DC",
  red:"#C0392B", redL:"#FDECEA",
  amber:"#C0580A", amberL:"#FEF0E6",
  blue:"#1A5276", blueL:"#EAF2F8",
};

/* ── Questions ──────────────────────────────────────────────── */
const CHANGE_Qs = [
  { id:"c1",  cat:"Leadership",    text:"Leadership actively champions this change with visible commitment and clear messaging." },
  { id:"c2",  cat:"Communication", text:"Employees understand WHY this change is happening and what it means for them personally." },
  { id:"c3",  cat:"Planning",      text:"There is a dedicated change management plan with defined roles and responsibilities." },
  { id:"c4",  cat:"History",       text:"This organisation has successfully navigated large-scale change in the past three years." },
  { id:"c5",  cat:"Engagement",    text:"Stakeholders most affected by this change have been meaningfully involved in shaping it." },
  { id:"c6",  cat:"Resources",     text:"Sufficient resources — time, budget, and people — are allocated to manage this change." },
  { id:"c7",  cat:"Resistance",    text:"Resistance signals are being actively monitored and addressed before they escalate." },
  { id:"c8",  cat:"Capability",    text:"Training and support are planned for people who need to work in new ways." },
  { id:"c9",  cat:"Measurement",   text:"Success metrics for this change initiative are clearly defined and measurable." },
  { id:"c10", cat:"Capacity",      text:"The pace of this change is realistic given current organisational workload and capacity." },
];

const AI_Qs = [
  { id:"a1",  cat:"Leadership",        text:"Senior leadership has a clear, communicated strategic vision for how AI will be used in this organisation." },
  { id:"a2",  cat:"Communication",     text:"Employees have received honest, transparent communication about AI's impact on their roles." },
  { id:"a3",  cat:"Capability",        text:"There is a structured plan to upskill employees to work effectively alongside AI tools." },
  { id:"a4",  cat:"Ethics & Trust",    text:"Data privacy, security, and ethical concerns around AI use have been openly addressed." },
  { id:"a5",  cat:"Culture",           text:"Employees feel psychologically safe to raise questions, concerns, and fears about AI." },
  { id:"a6",  cat:"Change Approach",   text:"Change management principles are explicitly applied to AI rollout — not just technical deployment." },
  { id:"a7",  cat:"Measurement",       text:"There is a process to measure employee adoption and sentiment throughout the AI rollout." },
  { id:"a8",  cat:"Momentum",          text:"Early AI wins have been identified, communicated, and celebrated to build trust and momentum." },
  { id:"a9",  cat:"Manager Readiness", text:"Managers are equipped and confident to lead their teams through AI-related uncertainty." },
  { id:"a10", cat:"Narrative",         text:"The organisation clearly distinguishes AI replacing tasks versus replacing people — and communicates this consistently." },
];

const SCALE = [
  { v:1, label:"Strongly Disagree" },
  { v:2, label:"Disagree" },
  { v:3, label:"Neutral" },
  { v:4, label:"Agree" },
  { v:5, label:"Strongly Agree" },
];

/* ── Sample report (homepage preview) ───────────────────────── */
const SAMPLE = {
  org: "Meridian Financial Group",
  initiative: "Core banking transformation — 2,400 employees, 3 business units, 18 months.",
  overall: 3.1,
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
  excerpt: {
    heading: "The Resistance Blind Spot",
    body: "Your resistance score of 2.0 is the most urgent finding in this report. In financial services transformations of this scale, undetected resistance typically surfaces 6–9 months in — at exactly the point when rollback becomes costly. The 2022 CRM experience your team referenced has almost certainly left pockets of latent scepticism that will activate at go-live.",
    action: "Within 30 days: establish a biweekly resistance pulse — 3 questions, anonymous, sent to all impacted staff. Assign a Change Champion in each business unit whose sole job is to surface resistance signals before they become blockers.",
    benchmark: "Organisations with active resistance monitoring are 2.3x more likely to hit adoption targets within 6 months of go-live.",
  },
};

/* ── Helpers ────────────────────────────────────────────────── */
function avgScore(answers, questions) {
  const vals = questions.map(q => answers[q.id] || 0).filter(v => v > 0);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
}
function getLevel(score) {
  if (score >= 4.2) return { label:"Strong",   color:T.sage,  bg:T.lime,   desc:"Strong readiness fundamentals are in place." };
  if (score >= 3.2) return { label:"Moderate", color:T.goldD, bg:T.goldL,  desc:"A reasonable foundation exists but important gaps remain." };
  if (score >= 2.2) return { label:"At Risk",  color:T.amber, bg:T.amberL, desc:"Significant readiness gaps exist that could derail success." };
  return               { label:"Critical", color:T.red,   bg:T.redL,   desc:"Immediate action is required before proceeding." };
}
function scoreColor(s){ return s>=4.2?T.sage : s>=3.2?T.goldD : s>=2.2?T.amber : T.red; }

function buildPrompt(type, context, answers, questions, overall, lv) {
  const isChange = type === "change";
  const scoreLines = questions.map(q => `  • ${q.cat} (${answers[q.id]||0}/5): "${q.text}"`).join("\n");
  const lowScores = questions.filter(q=>(answers[q.id]||0)<=2.5).map(q=>q.cat).join(", ");
  const highScores = questions.filter(q=>(answers[q.id]||0)>=4).map(q=>q.cat).join(", ");

  const system = isChange
    ? `You are a senior change management consultant with 20+ years of experience. Deep expertise in ADKAR, Kotter, Bridges, and Prosci. RULES: Never state the obvious. Reference specific scores AND industry context in every insight. Every recommendation must be executable tomorrow. Include real research benchmarks. Be direct and honest even when uncomfortable.`
    : `You are a world-class expert in AI adoption and organisational change. RULES: Never state the obvious about AI. Reference the organisation's industry. Every recommendation must be executable. Include real research benchmarks. Be honest about AI risks organisations typically underestimate.`;

  const user = `ASSESSMENT: ${isChange ? "Change Readiness" : "AI Adoption Readiness"}
ORGANISATION: ${context.orgName}
ROLE: ${context.role}
INITIATIVE: ${context.changeDesc}
${context.industry ? `INDUSTRY: ${context.industry}` : ""}
${context.size ? `SIZE: ${context.size}` : ""}
OVERALL SCORE: ${overall.toFixed(2)}/5.0 — ${lv.label}
LOW SCORES (<=2.5): ${lowScores || "None"}
HIGH SCORES (>=4.0): ${highScores || "None"}

SCORES:
${scoreLines}

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

/* ── Global CSS ─────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { scroll-behavior:smooth; }
  body { background:${T.off}; color:${T.body}; font-family:'Inter',sans-serif; line-height:1.6; -webkit-font-smoothing:antialiased; overflow-x:hidden; }
  ::selection { background:${T.lime}; color:${T.forest}; }
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:${T.light}} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}

  @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes floaty { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(-1deg)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(64,145,108,.35)} 50%{box-shadow:0 0 0 12px rgba(64,145,108,0)} }
  @keyframes barGrow { from{width:0} }
  @keyframes drawArc { from{stroke-dashoffset:var(--circ)} }

  .fu{animation:fadeUp .6s cubic-bezier(.22,1,.36,1) both}
  .fu1{animation:fadeUp .6s .1s cubic-bezier(.22,1,.36,1) both}
  .fu2{animation:fadeUp .6s .2s cubic-bezier(.22,1,.36,1) both}
  .fu3{animation:fadeUp .6s .3s cubic-bezier(.22,1,.36,1) both}
  .fu4{animation:fadeUp .6s .4s cubic-bezier(.22,1,.36,1) both}

  .serif{font-family:'Playfair Display',serif}
  .mono{font-family:'DM Mono',monospace}
  input,textarea,select{font-family:'Inter',sans-serif}
  button{cursor:pointer;border:none;background:none;font-family:'Inter',sans-serif}

  .hero-card { animation: floaty 7s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
    .hero-card { animation:none; }
  }
  @media (max-width: 860px) {
    .hero-grid { grid-template-columns: 1fr !important; gap:48px !important; }
    .hero-card { animation:none; margin:0 auto; }
    .two-col { grid-template-columns: 1fr !important; }
  }
`;

/* ── Tiny shared components ─────────────────────────────────── */
function Badge({ children, color=T.forest, bg=T.lime }) {
  return <span style={{ display:"inline-block", padding:"4px 13px", borderRadius:100, background:bg, color, fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase" }}>{children}</span>;
}

function PrimaryBtn({ children, onClick, disabled, small, glow }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
      padding:small?"10px 22px":"15px 34px", borderRadius:10,
      fontSize:small?13:15, fontWeight:600, letterSpacing:.2,
      background:disabled?T.border:T.forest, color:disabled?T.muted:T.white,
      cursor:disabled?"not-allowed":"pointer", transition:"all .25s cubic-bezier(.22,1,.36,1)",
      boxShadow:disabled?"none":"0 4px 14px rgba(27,67,50,.3)",
      animation: glow && !disabled ? "pulse 2.5s ease infinite" : "none",
    }}
      onMouseEnter={e=>{if(!disabled){e.currentTarget.style.background="#163829";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(27,67,50,.35)";}}}
      onMouseLeave={e=>{e.currentTarget.style.background=disabled?T.border:T.forest;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=disabled?"none":"0 4px 14px rgba(27,67,50,.3)";}}
    >{children}</button>
  );
}

function OutlineBtn({ children, onClick, light }) {
  const c = light ? "rgba(255,255,255,.9)" : T.forest;
  const b = light ? "rgba(255,255,255,.35)" : T.forest;
  return (
    <button onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"14px 30px", borderRadius:10, fontSize:14, fontWeight:500,
      border:`1.5px solid ${b}`, color:c, background:"transparent",
      transition:"all .25s", letterSpacing:.2,
    }}
      onMouseEnter={e=>e.currentTarget.style.background=light?"rgba(255,255,255,.08)":T.lime}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >{children}</button>
  );
}

function Label({ children, required }) {
  return <div style={{ fontSize:11, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", color:T.muted, marginBottom:7 }}>{children}{required&&<span style={{color:T.red}}> *</span>}</div>;
}

function TextInput({ label, value, onChange, placeholder, type="text", required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ width:"100%", padding:"13px 15px", borderRadius:9, fontSize:14, border:`1.5px solid ${focused?T.forest:T.border}`, background:T.white, color:T.ink, outline:"none", transition:"border-color .2s, box-shadow .2s", boxShadow:focused?`0 0 0 3px ${T.lime}`:"none" }}
      />
    </div>
  );
}

function Steps({ current }) {
  const steps = ["Context","Assessment","Your Details","Report"];
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:44 }}>
      {steps.map((s,i)=>(
        <div key={s} style={{ display:"flex", alignItems:"center", flex:i<steps.length-1?1:"none" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:i<=current?T.forest:T.white, border:`2px solid ${i<=current?T.forest:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:i<=current?T.white:T.muted, transition:"all .3s", boxShadow:i===current?`0 0 0 4px ${T.lime}`:"none" }}>{i<current?"✓":i+1}</div>
            <span style={{ fontSize:10, fontWeight:600, color:i===current?T.forest:T.muted, whiteSpace:"nowrap", letterSpacing:.5 }}>{s.toUpperCase()}</span>
          </div>
          {i<steps.length-1&&<div style={{ flex:1, height:2, background:i<current?T.forest:T.border, margin:"0 10px", marginBottom:18, transition:"background .3s", borderRadius:2 }}/>}
        </div>
      ))}
    </div>
  );
}

/* ── Gauge (SVG, animated) ──────────────────────────────────── */
function Gauge({ score, size=170, dark=false, animate=true }) {
  const lv = getLevel(score);
  const pct = (score-1)/4;
  const r = size*0.34, cx=size/2, cy=size*0.58;
  const circ = Math.PI*r;
  const dash = pct*circ;
  const [drawn, setDrawn] = useState(!animate);
  useEffect(()=>{ if(animate){ const t=setTimeout(()=>setDrawn(true), 300); return ()=>clearTimeout(t);} },[animate]);
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={size} height={size*0.66} viewBox={`0 0 ${size} ${size*0.66}`}>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke={dark?"rgba(255,255,255,.12)":T.light} strokeWidth={size*0.075} strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke={lv.color} strokeWidth={size*0.075} strokeLinecap="round"
          strokeDasharray={`${drawn?dash:0} ${circ}`}
          style={{ transition:"stroke-dasharray 1.4s cubic-bezier(.22,1,.36,1)", filter:`drop-shadow(0 0 ${size*0.05}px ${lv.color}90)` }}/>
        <text x={cx} y={cy-size*0.05} textAnchor="middle" fill={dark?T.white:T.ink}
          style={{ fontSize:size*0.16, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{score.toFixed(1)}</text>
        <text x={cx} y={cy+size*0.06} textAnchor="middle" fill={dark?"rgba(255,255,255,.4)":T.muted}
          style={{ fontSize:size*0.055, fontFamily:"'DM Mono',monospace", letterSpacing:1 }}>OUT OF 5.0</text>
      </svg>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:2, padding:"5px 15px", borderRadius:100, background:dark?"rgba(255,255,255,.1)":lv.bg }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:lv.color }}/>
        <span style={{ fontSize:12, fontWeight:700, color:dark?T.white:lv.color, letterSpacing:.5 }}>{lv.label} Readiness</span>
      </div>
    </div>
  );
}

/* ── Dimension bar ──────────────────────────────────────────── */
function DimBar({ cat, score, index, compact=false, dark=false }) {
  const color = scoreColor(score);
  const pct = ((score-1)/4)*100;
  const [animated, setAnimated] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setAnimated(true), index*70+350); return()=>clearTimeout(t); },[index]);
  return (
    <div style={{ display:"grid", gridTemplateColumns:compact?"86px 1fr 30px":"150px 1fr 44px", alignItems:"center", gap:compact?8:12, marginBottom:compact?7:11 }}>
      <div style={{ fontSize:compact?10:12, fontWeight:500, color:dark?"rgba(255,255,255,.65)":T.body, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{cat}</div>
      <div style={{ height:compact?6:9, background:dark?"rgba(255,255,255,.1)":T.light, borderRadius:5, overflow:"hidden" }}>
        <div style={{ height:"100%", width:animated?`${pct}%`:"0%", borderRadius:5, background:color, transition:"width .9s cubic-bezier(.22,1,.36,1)", boxShadow:`0 0 6px ${color}70` }}/>
      </div>
      <div className="mono" style={{ fontSize:compact?10:12, fontWeight:700, color, textAlign:"right" }}>{score.toFixed(1)}</div>
    </div>
  );
}

/* ── Hero report preview card ───────────────────────────────── */
function HeroReportCard({ onSeeFull }) {
  return (
    <div className="hero-card" style={{
      width:"min(400px, 92vw)", background:"rgba(255,255,255,.06)",
      backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
      border:"1px solid rgba(255,255,255,.14)", borderRadius:20,
      padding:"26px 26px 22px", boxShadow:"0 24px 60px rgba(0,0,0,.35)",
      transform:"rotate(-1deg)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <div className="serif" style={{ fontSize:15, fontWeight:700, color:T.white }}>Ado<span style={{color:T.gold}}>vio</span> <span style={{ fontWeight:400, color:"rgba(255,255,255,.45)", fontSize:12 }}>· Readiness Report</span></div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:1 }}>{SAMPLE.org}</div>
        </div>
        <span style={{ fontSize:9, padding:"3px 9px", borderRadius:100, background:"rgba(212,168,67,.18)", color:T.gold, fontWeight:700, letterSpacing:.8 }}>SAMPLE</span>
      </div>

      <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}>
        <Gauge score={SAMPLE.overall} size={150} dark/>
      </div>

      <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid rgba(255,255,255,.1)" }}>
        {SAMPLE.dims.slice(0,5).map((d,i)=><DimBar key={d.cat} {...d} index={i} compact dark/>)}
      </div>

      <button onClick={onSeeFull} style={{
        marginTop:14, width:"100%", padding:"11px", borderRadius:9,
        background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.18)",
        color:T.white, fontSize:13, fontWeight:600, transition:"all .2s",
      }}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.16)"}
        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.1)"}
      >See the full sample report →</button>
    </div>
  );
}

/* ── Sample report modal ────────────────────────────────────── */
function SampleModal({ open, onClose, onStart }) {
  if (!open) return null;
  const ex = SAMPLE.excerpt;
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:200, background:"rgba(10,31,20,.65)",
      backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-start", justifyContent:"center",
      padding:"5vh 16px", overflowY:"auto", animation:"fadeIn .25s ease both",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"min(680px, 100%)", background:T.off, borderRadius:18,
        boxShadow:"0 32px 80px rgba(0,0,0,.4)", overflow:"hidden",
        animation:"fadeUp .35s cubic-bezier(.22,1,.36,1) both",
      }}>
        {/* header */}
        <div style={{ background:`linear-gradient(135deg,${T.forest},${T.deep})`, padding:"28px 32px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,.12)", color:T.white, fontSize:16 }}>✕</button>
          <Badge color={T.lime} bg="rgba(255,255,255,.12)">Sample Report</Badge>
          <h2 className="serif" style={{ fontSize:24, fontWeight:700, color:T.white, margin:"12px 0 4px" }}>{SAMPLE.org}</h2>
          <p style={{ fontSize:12, color:"rgba(255,255,255,.5)", fontStyle:"italic" }}>"{SAMPLE.initiative}"</p>
        </div>

        <div style={{ padding:"28px 32px" }}>
          {/* score + bars */}
          <div className="two-col" style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:28, alignItems:"center", background:T.white, border:`1px solid ${T.border}`, borderRadius:14, padding:"24px 28px", marginBottom:18 }}>
            <Gauge score={SAMPLE.overall} size={150}/>
            <div>
              {SAMPLE.dims.map((d,i)=><DimBar key={d.cat} {...d} index={i}/>)}
            </div>
          </div>

          {/* excerpt insight */}
          <div style={{ background:T.white, border:`1px solid ${T.border}`, borderLeft:`4px solid ${T.amber}`, borderRadius:14, padding:"24px 28px", marginBottom:18 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
              <span>⚠️</span><Badge color={T.amber} bg={T.amberL}>Risk Insight</Badge>
            </div>
            <h3 className="serif" style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:10 }}>{ex.heading}</h3>
            <p style={{ fontSize:13.5, color:T.mid, lineHeight:1.8, marginBottom:14 }}>{ex.body}</p>
            <div style={{ background:T.off, borderRadius:9, padding:"13px 16px", border:`1px solid ${T.border}`, marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.amber, letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>Recommended Action</div>
              <p style={{ fontSize:12.5, color:T.body, lineHeight:1.7 }}>{ex.action}</p>
            </div>
            <p style={{ fontSize:11.5, color:T.muted, fontStyle:"italic" }}>📊 {ex.benchmark}</p>
          </div>

          <p style={{ fontSize:12.5, color:T.muted, textAlign:"center", marginBottom:18 }}>
            Your full report includes an executive summary, 4 key findings, risk analysis, 5 prioritised actions, and a 90-day success picture — tailored to <em>your</em> scores, industry, and initiative.
          </p>

          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <PrimaryBtn glow onClick={onStart}>Get my report — free →</PrimaryBtn>
            <OutlineBtn onClick={onClose}>Close</OutlineBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Home ───────────────────────────────────────────────────── */
function HomeScreen({ onStart }) {
  const [sampleOpen, setSampleOpen] = useState(false);
  return (
    <div>
      <SampleModal open={sampleOpen} onClose={()=>setSampleOpen(false)} onStart={()=>{setSampleOpen(false); onStart("change");}}/>

      {/* HERO */}
      <section style={{ background:`linear-gradient(155deg,${T.forest} 0%,${T.deep} 70%,#08160F 100%)`, padding:"88px 24px 96px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.05, backgroundImage:`radial-gradient(circle,white 1px,transparent 1px)`, backgroundSize:"34px 34px" }}/>
        <div style={{ position:"absolute", top:"-180px", right:"-120px", width:560, height:560, borderRadius:"50%", background:`radial-gradient(circle, ${T.sage}25 0%, transparent 65%)` }}/>
        <div style={{ position:"absolute", bottom:"-200px", left:"-140px", width:520, height:520, borderRadius:"50%", background:`radial-gradient(circle, ${T.gold}14 0%, transparent 65%)` }}/>

        <div className="hero-grid" style={{ position:"relative", zIndex:1, maxWidth:1080, margin:"0 auto", display:"grid", gridTemplateColumns:"1.1fr 0.9fr", gap:56, alignItems:"center" }}>
          <div>
            <div className="fu" style={{ marginBottom:22 }}>
              <Badge color={T.mint} bg="rgba(255,255,255,.1)">Free · No login · 10 minutes</Badge>
            </div>
            <h1 className="serif fu1" style={{ fontSize:"clamp(38px,5.2vw,62px)", fontWeight:800, color:T.white, lineHeight:1.1, letterSpacing:-1, marginBottom:22 }}>
              Know if your<br/>organisation is ready<br/><span style={{ color:T.gold, fontStyle:"italic", fontWeight:700 }}>before</span> you launch.
            </h1>
            <p className="fu2" style={{ fontSize:16.5, color:"rgba(255,255,255,.7)", lineHeight:1.75, maxWidth:460, marginBottom:36 }}>
              AI-powered change readiness diagnostics built by a practitioner, for practitioners. Answer 10 questions — get a personalised report with findings, risks, and actions in your inbox.
            </p>
            <div className="fu3" style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:34 }}>
              <PrimaryBtn glow onClick={()=>onStart("change")} >Start free assessment →</PrimaryBtn>
              <OutlineBtn light onClick={()=>setSampleOpen(true)}>See a sample report</OutlineBtn>
            </div>
            <div className="fu4" style={{ display:"flex", gap:30, flexWrap:"wrap" }}>
              {[["10 Qs","practitioner-grade"],["AI report","tailored to your context"],["100% free","for the change community"]].map(([v,l])=>(
                <div key={l}>
                  <div className="serif" style={{ fontSize:19, fontWeight:700, color:T.white }}>{v}</div>
                  <div style={{ fontSize:11.5, color:"rgba(255,255,255,.45)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fu2" style={{ display:"flex", justifyContent:"center" }}>
            <HeroReportCard onSeeFull={()=>setSampleOpen(true)}/>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section style={{ background:T.white, borderBottom:`1px solid ${T.border}`, padding:"18px 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"flex", justifyContent:"center", alignItems:"center", gap:"clamp(16px,4vw,44px)", flexWrap:"wrap", fontSize:12.5, color:T.muted }}>
          <span>🧭 Grounded in ADKAR · Kotter · Prosci</span>
          <span>🤖 Reports generated by Claude AI</span>
          <span>🔒 Your data is never sold or shared</span>
          <span>🌱 Built by a 20-year change practitioner</span>
        </div>
      </section>

      {/* ASSESSMENTS */}
      <section style={{ padding:"84px 24px", maxWidth:960, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <Badge>Two Diagnostics</Badge>
          <h2 className="serif" style={{ fontSize:"clamp(28px,4vw,38px)", fontWeight:700, marginTop:16, letterSpacing:-.5 }}>Choose where to start</h2>
          <p style={{ color:T.mid, marginTop:12, maxWidth:480, margin:"12px auto 0", fontSize:15 }}>Both take ~10 minutes. Both end with a personalised AI report in your inbox.</p>
        </div>
        <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:26 }}>
          {[
            { type:"change", icon:"🔄", title:"Change Readiness", desc:"For any major initiative — ERP, restructure, M&A, culture shift. Diagnoses the 10 dimensions that decide whether change sticks.", tags:["Leadership","Resistance","Capacity","Engagement"], color:T.forest, bg:T.lime },
            { type:"ai", icon:"🤖", title:"AI Adoption Readiness", desc:"For organisations rolling out AI. Measures the human layer most AI programmes skip — trust, narrative, manager readiness, psychological safety.", tags:["Culture","Ethics & Trust","Narrative","Managers"], color:T.blue, bg:T.blueL },
          ].map((c,i)=>(
            <div key={c.type} className={i===0?"fu":"fu1"} style={{ background:T.white, borderRadius:18, border:`1px solid ${T.border}`, padding:"38px 34px", transition:"all .3s cubic-bezier(.22,1,.36,1)", boxShadow:"0 2px 14px rgba(0,0,0,.05)", position:"relative", overflow:"hidden" }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 16px 44px rgba(0,0,0,.12)";e.currentTarget.style.transform="translateY(-5px)";}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 14px rgba(0,0,0,.05)";e.currentTarget.style.transform="translateY(0)";}}
            >
              <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:`linear-gradient(90deg, ${c.color}, ${c.color}40)` }}/>
              <div style={{ fontSize:38, marginBottom:18 }}>{c.icon}</div>
              <Badge color={c.color} bg={c.bg}>{c.title}</Badge>
              <p style={{ color:T.mid, fontSize:14, lineHeight:1.75, margin:"16px 0 22px" }}>{c.desc}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:28 }}>
                {c.tags.map(t=><span key={t} style={{ fontSize:11, padding:"4px 11px", borderRadius:100, background:T.off, color:T.mid, fontWeight:500 }}>{t}</span>)}
              </div>
              <PrimaryBtn onClick={()=>onStart(c.type)}>Start this assessment →</PrimaryBtn>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background:T.white, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, padding:"76px 24px" }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <Badge>How it works</Badge>
            <h2 className="serif" style={{ fontSize:"clamp(26px,3.6vw,34px)", fontWeight:700, marginTop:14, letterSpacing:-.4 }}>From questions to clarity in 10 minutes</h2>
          </div>
          <div className="two-col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22 }}>
            {[
              ["1","Describe your initiative","Tell us the context — industry, size, what's changing. The AI uses it to make every insight specific to you."],
              ["2","Rate 10 statements","Practitioner-grade questions distilled from ADKAR, Kotter, and 20 years of real engagements."],
              ["3","Get your report by email","A full readiness analysis — findings, risks, 5 prioritised actions, and a 90-day success picture."],
            ].map(([n,t,d],i)=>(
              <div key={n} className={`fu${i}`} style={{ background:T.off, border:`1px solid ${T.border}`, borderRadius:14, padding:"26px 24px" }}>
                <div className="serif" style={{ fontSize:30, fontWeight:700, color:T.gold, marginBottom:10 }}>{n}</div>
                <div style={{ fontWeight:600, fontSize:15, marginBottom:7, color:T.ink }}>{t}</div>
                <div style={{ fontSize:13, color:T.mid, lineHeight:1.7 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAMPLE REPORT TEASE */}
      <section style={{ padding:"84px 24px" }}>
        <div className="two-col" style={{ maxWidth:920, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
          <div>
            <Badge color={T.amber} bg={T.amberL}>What you'll receive</Badge>
            <h2 className="serif" style={{ fontSize:"clamp(26px,3.6vw,34px)", fontWeight:700, margin:"16px 0 16px", letterSpacing:-.4, lineHeight:1.25 }}>Not a score.<br/>A diagnosis.</h2>
            <p style={{ color:T.mid, lineHeight:1.85, fontSize:14.5, marginBottom:24 }}>
              Generic assessments tell you what you already know. Adovio's AI reads your specific scores against your industry and initiative — then tells you what they actually mean, what will break first, and exactly what to do about it.
            </p>
            <ul style={{ listStyle:"none", marginBottom:30 }}>
              {["Executive summary that names the single most important issue","4 key findings with non-obvious implications","Critical risks with real-world consequences","5 prioritised actions — owner, timeline, rationale","A vivid 90-day picture of what good looks like"].map(item=>(
                <li key={item} style={{ display:"flex", gap:10, fontSize:13.5, color:T.body, marginBottom:10, lineHeight:1.6 }}>
                  <span style={{ color:T.sage, flexShrink:0 }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={()=>setSampleOpen(true)}>Preview the sample report →</PrimaryBtn>
          </div>
          <div style={{ display:"flex", justifyContent:"center" }}>
            <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:18, padding:"28px", boxShadow:"0 16px 48px rgba(0,0,0,.08)", width:"min(380px,100%)" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                <Gauge score={SAMPLE.overall} size={160}/>
              </div>
              <div style={{ marginTop:14, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
                {SAMPLE.dims.slice(0,6).map((d,i)=><DimBar key={d.cat} {...d} index={i}/>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background:`linear-gradient(155deg,${T.forest},${T.deep})`, padding:"76px 24px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.05, backgroundImage:`radial-gradient(circle,white 1px,transparent 1px)`, backgroundSize:"34px 34px" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <h2 className="serif" style={{ fontSize:"clamp(26px,4vw,38px)", fontWeight:700, color:T.white, marginBottom:14, letterSpacing:-.4 }}>Know where you stand.</h2>
          <p style={{ color:"rgba(255,255,255,.6)", marginBottom:34, fontSize:15 }}>10 minutes. Free forever. Built for the change community.</p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>onStart("change")} style={{ padding:"15px 34px", borderRadius:10, fontSize:15, fontWeight:600, background:T.white, color:T.forest, boxShadow:"0 6px 20px rgba(0,0,0,.25)", transition:"all .25s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
            >Change Readiness →</button>
            <OutlineBtn light onClick={()=>onStart("ai")}>AI Adoption Readiness →</OutlineBtn>
          </div>
        </div>
      </section>

      <footer style={{ background:T.ink, padding:"28px 24px", textAlign:"center" }}>
        <div className="serif" style={{ fontSize:18, fontWeight:700, color:T.white, marginBottom:4 }}>Ado<span style={{color:T.gold}}>vio</span></div>
        <p style={{ fontSize:11.5, color:T.muted, letterSpacing:.6 }}>THE PATH TO ADOPTION · FREE FOR THE CHANGE COMMUNITY · ADOVIO.IO</p>
      </footer>
    </div>
  );
}

/* ── Context step ───────────────────────────────────────────── */
function ContextStep({ type, context, setContext, onNext, onBack }) {
  const accent = type==="change"?T.forest:T.blue;
  const valid = context.orgName&&context.role&&context.changeDesc;
  return (
    <div style={{ maxWidth:640, margin:"0 auto", padding:"52px 24px" }}>
      <Steps current={0}/>
      <Badge color={accent} bg={type==="change"?T.lime:T.blueL}>{type==="change"?"Change Readiness":"AI Adoption Readiness"}</Badge>
      <h2 className="serif" style={{ fontSize:31, fontWeight:700, margin:"14px 0 6px", letterSpacing:-.4 }}>Let's set the context</h2>
      <p style={{ color:T.mid, fontSize:14, marginBottom:38 }}>This is what makes your report specific — not generic. Takes ~1 minute.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
        <TextInput label="Organisation or Initiative Name" required value={context.orgName} onChange={v=>setContext(c=>({...c,orgName:v}))} placeholder="e.g. Acme Corp — ERP Rollout 2026"/>
        <TextInput label="Your Role" required value={context.role} onChange={v=>setContext(c=>({...c,role:v}))} placeholder="e.g. Change Manager, HR Director, Project Sponsor"/>
        <div>
          <Label required>Briefly describe the change or initiative</Label>
          <textarea value={context.changeDesc} onChange={e=>setContext(c=>({...c,changeDesc:e.target.value}))}
            placeholder={type==="change"?"e.g. Implementing a new ERP system across 3 business units over 18 months...":"e.g. Rolling out Microsoft Copilot to 500 employees in Q3..."}
            rows={3} style={{ width:"100%", padding:"13px 15px", borderRadius:9, fontSize:14, border:`1.5px solid ${T.border}`, background:T.white, color:T.ink, outline:"none", resize:"vertical", transition:"border-color .2s" }}
            onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[["Industry",["Financial Services","Healthcare","Technology","Government","Retail","Manufacturing","Education","Professional Services","Other"],"industry"],["Organisation Size",["1–50","51–200","201–1,000","1,001–5,000","5,000+"],"size"]].map(([lbl,opts,key])=>(
            <div key={key}>
              <Label>{lbl}</Label>
              <select value={context[key]} onChange={e=>setContext(c=>({...c,[key]:e.target.value}))} style={{ width:"100%", padding:"13px 15px", borderRadius:9, fontSize:14, border:`1.5px solid ${T.border}`, background:T.white, color:T.body, outline:"none" }}>
                <option value="">Select {lbl.toLowerCase()}</option>
                {opts.map(o=><option key={o} value={o}>{key==="size"?`${o} employees`:o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:42 }}>
        <OutlineBtn onClick={onBack}>← Back</OutlineBtn>
        <PrimaryBtn onClick={onNext} disabled={!valid}>Continue →</PrimaryBtn>
      </div>
    </div>
  );
}

/* ── Questions step ─────────────────────────────────────────── */
function QuestionsStep({ type, answers, setAnswers, onNext, onBack }) {
  const questions = type==="change"?CHANGE_Qs:AI_Qs;
  const accent = type==="change"?T.forest:T.blue;
  const answered = questions.filter(q=>answers[q.id]).length;
  const allDone = answered===questions.length;
  return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"52px 24px" }}>
      <Steps current={1}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:10, marginBottom:18 }}>
        <div>
          <Badge color={accent} bg={type==="change"?T.lime:T.blueL}>{type==="change"?"Change Readiness":"AI Adoption Readiness"}</Badge>
          <h2 className="serif" style={{ fontSize:29, fontWeight:700, margin:"12px 0 2px", letterSpacing:-.4 }}>Rate each statement</h2>
        </div>
        <span className="mono" style={{ fontSize:13, color:accent, fontWeight:600 }}>{answered}/{questions.length}</span>
      </div>
      <div style={{ height:7, background:T.border, borderRadius:4, marginBottom:38, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${(answered/questions.length)*100}%`, borderRadius:4, background:`linear-gradient(90deg,${accent},${T.sage})`, transition:"width .35s cubic-bezier(.22,1,.36,1)" }}/>
      </div>
      {questions.map((q,i)=>{
        const sel=answers[q.id];
        return (
          <div key={q.id} style={{ padding:"26px 0", borderBottom:i<questions.length-1?`1px solid ${T.border}`:"none", animation:`fadeUp .4s ${i*.04}s both` }}>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
              <span style={{ width:24, height:24, borderRadius:"50%", background:sel?accent:T.light, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:sel?T.white:T.muted, flexShrink:0, transition:"all .2s" }}>{sel?"✓":i+1}</span>
              <Badge color={T.mid} bg={T.off}>{q.cat}</Badge>
            </div>
            <p style={{ fontSize:14.5, lineHeight:1.7, color:T.body, marginBottom:16, paddingLeft:34 }}>{q.text}</p>
            <div style={{ display:"flex", gap:7, flexWrap:"wrap", paddingLeft:34, alignItems:"center" }}>
              {SCALE.map(s=>{
                const active=sel===s.v;
                return (
                  <button key={s.v} onClick={()=>setAnswers(a=>({...a,[q.id]:s.v}))} style={{ width:44, height:38, borderRadius:8, fontSize:13, fontWeight:700, background:active?accent:T.white, color:active?T.white:T.mid, border:`1.5px solid ${active?accent:T.border}`, transition:"all .18s", boxShadow:active?`0 3px 10px ${accent}40`:"none" }}
                    onMouseEnter={e=>{if(!active){e.currentTarget.style.borderColor=accent;e.currentTarget.style.color=accent;e.currentTarget.style.transform="translateY(-2px)";}}}
                    onMouseLeave={e=>{if(!active){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.mid;e.currentTarget.style.transform="translateY(0)";}}}
                  >{s.v}</button>
                );
              })}
              <span style={{ fontSize:11.5, color:sel?accent:T.muted, marginLeft:6, fontWeight:sel?600:400 }}>{sel?SCALE.find(s=>s.v===sel)?.label:"1 = Strongly Disagree · 5 = Strongly Agree"}</span>
            </div>
          </div>
        );
      })}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:42 }}>
        <OutlineBtn onClick={onBack}>← Back</OutlineBtn>
        <PrimaryBtn onClick={onNext} disabled={!allDone} glow={allDone}>{allDone?"Continue — almost done →":`${questions.length-answered} remaining`}</PrimaryBtn>
      </div>
    </div>
  );
}

/* ── Email step (with live score teaser) ────────────────────── */
function EmailStep({ type, answers, email, setEmail, name, setName, onNext, onBack }) {
  const valid = email&&email.includes("@")&&name;
  const questions = type==="change"?CHANGE_Qs:AI_Qs;
  const overall = avgScore(answers,questions);
  return (
    <div style={{ maxWidth:540, margin:"0 auto", padding:"52px 24px" }}>
      <Steps current={2}/>
      <div style={{ textAlign:"center", marginBottom:30 }}>
        <h2 className="serif" style={{ fontSize:30, fontWeight:700, marginBottom:8, letterSpacing:-.4 }}>Your score is ready.</h2>
        <p style={{ color:T.mid, fontSize:14, lineHeight:1.7 }}>Here's your overall readiness — the full AI analysis lands in your inbox.</p>
      </div>

      {/* live score teaser */}
      <div className="fu" style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:16, padding:"26px", marginBottom:24, textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,.07)" }}>
        <Gauge score={overall} size={160}/>
        <p style={{ fontSize:12.5, color:T.muted, marginTop:14, lineHeight:1.6 }}>
          Your full report — executive summary, key findings, risk areas, and 5 recommended actions — is generated by AI and delivered by email.
        </p>
      </div>

      <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:14, padding:"30px", display:"flex", flexDirection:"column", gap:20, boxShadow:"0 2px 12px rgba(0,0,0,.05)" }}>
        <TextInput label="Your Full Name" required value={name} onChange={setName} placeholder="e.g. Sarah Johnson"/>
        <TextInput label="Work Email Address" required type="email" value={email} onChange={setEmail} placeholder="e.g. sarah@company.com"/>
        <div style={{ padding:"11px 15px", borderRadius:9, background:T.off, border:`1px solid ${T.border}`, fontSize:11.5, color:T.muted, lineHeight:1.6 }}>
          🔒 Used only to send this report and occasional change-community insights. No spam, ever. Unsubscribe anytime.
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:32 }}>
        <OutlineBtn onClick={onBack}>← Back</OutlineBtn>
        <PrimaryBtn onClick={onNext} disabled={!valid} glow={valid}>Send my full report →</PrimaryBtn>
      </div>
    </div>
  );
}

/* ── Generating ─────────────────────────────────────────────── */
function GeneratingScreen({ type }) {
  const steps = ["Analysing your responses across all dimensions…","Reading your scores against your industry…","Identifying risk patterns and hidden gaps…","Writing your personalised recommendations…","Sending your report…"];
  const [step, setStep] = useState(0);
  useEffect(()=>{ const t=setInterval(()=>setStep(s=>Math.min(s+1,steps.length-1)),1900); return()=>clearInterval(t); },[]);
  const accent = type==="change"?T.forest:T.blue;
  return (
    <div style={{ minHeight:"62vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:30, padding:40 }}>
      <div style={{ position:"relative", width:64, height:64 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`3px solid ${T.border}` }}/>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`3px solid transparent`, borderTopColor:accent, animation:"spin .9s linear infinite" }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🌱</div>
      </div>
      <div style={{ textAlign:"center", maxWidth:400 }}>
        <h3 className="serif" style={{ fontSize:25, fontWeight:700, marginBottom:10 }}>Generating your report</h3>
        <p style={{ fontSize:13.5, color:accent, fontWeight:500, minHeight:22 }}>{steps[step]}</p>
        <div style={{ display:"flex", gap:5, justifyContent:"center", marginTop:18 }}>
          {steps.map((_,i)=><div key={i} style={{ width:i===step?22:6, height:6, borderRadius:3, background:i<=step?accent:T.border, transition:"all .3s" }}/>)}
        </div>
      </div>
    </div>
  );
}

/* ── Confirmation ───────────────────────────────────────────── */
function ConfirmationScreen({ data, onRestart, onOther }) {
  const { respondent, type, overall, level } = data;
  const isChange = type==="change";
  const accent = isChange?T.forest:T.blue;
  const accentBg = isChange?T.lime:T.blueL;
  return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"72px 24px", textAlign:"center" }}>
      <div className="fu" style={{ width:84, height:84, borderRadius:"50%", background:T.lime, border:`3px solid ${T.sage}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 28px", fontSize:38 }}>✅</div>
      <h1 className="serif fu1" style={{ fontSize:36, fontWeight:700, marginBottom:12, letterSpacing:-.6, color:T.ink }}>Your report is on its way</h1>
      <p className="fu2" style={{ fontSize:15.5, color:T.mid, lineHeight:1.75, marginBottom:34 }}>
        Sent to <strong style={{color:T.ink}}>{respondent.email}</strong> — it should arrive within a couple of minutes.
      </p>

      <div className="fu2" style={{ background:T.white, borderRadius:18, border:`1px solid ${T.border}`, padding:"30px", marginBottom:28, boxShadow:"0 8px 32px rgba(0,0,0,.07)" }}>
        <Gauge score={overall} size={170}/>
        <p style={{ fontSize:13, color:T.mid, marginTop:14, lineHeight:1.65 }}>
          Full analysis, key findings, risk areas, and 5 recommended actions are in your email — as a PDF you can save and share.
        </p>
      </div>

      <div className="fu3" style={{ background:`linear-gradient(135deg,${T.forest}09,${T.sage}09)`, borderRadius:14, border:`1px solid ${T.sage}40`, padding:"26px 30px", marginBottom:24, textAlign:"left", display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ fontSize:28 }}>💼</div>
        <div style={{ flex:1, minWidth:200 }}>
          <div className="serif" style={{ fontSize:16, fontWeight:700, color:T.forest, marginBottom:4 }}>Found this valuable?</div>
          <p style={{ fontSize:12.5, color:T.mid, lineHeight:1.6 }}>Connect on LinkedIn for weekly insights on change management and AI adoption — from the practitioner who built Adovio.</p>
        </div>
        <a href="https://www.linkedin.com/in/divyamkaushik/" target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"11px 22px", borderRadius:9, background:T.forest, color:T.white, fontSize:13, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap", boxShadow:"0 3px 10px rgba(27,67,50,.3)" }}>Connect →</a>
      </div>

      <div className="fu3" style={{ background:T.goldL, borderRadius:11, border:`1px solid ${T.gold}40`, padding:"13px 18px", marginBottom:30, display:"flex", gap:10, alignItems:"center", textAlign:"left" }}>
        <span style={{ fontSize:18 }}>💡</span>
        <p style={{ fontSize:12.5, color:T.mid, lineHeight:1.5 }}>Can't find it? Check your <strong>spam or promotions folder</strong> — first deliveries sometimes land there.</p>
      </div>

      <div className="fu4" style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
        <PrimaryBtn onClick={onOther}>{isChange?"Take the AI Adoption assessment →":"Take the Change Readiness assessment →"}</PrimaryBtn>
        <OutlineBtn onClick={onRestart}>Back to home</OutlineBtn>
      </div>

      <div style={{ marginTop:48, paddingTop:24, borderTop:`1px solid ${T.border}` }}>
        <div className="serif" style={{ fontSize:16, fontWeight:700, color:T.ink }}>Ado<span style={{ color:T.gold }}>vio</span></div>
        <p style={{ fontSize:11, color:T.muted, marginTop:4 }}>The path to adoption · adovio.io</p>
      </div>
    </div>
  );
}

/* ── App ────────────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen]         = useState("home");
  const [type, setType]             = useState(null);
  const [context, setContext]       = useState({ orgName:"", role:"", changeDesc:"", industry:"", size:"" });
  const [answers, setAnswers]       = useState({});
  const [email, setEmail]           = useState("");
  const [name, setName]             = useState("");
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
    const overall = avgScore(answers,questions);
    const lv = getLevel(overall);
    const scored = questions.map(q=>({ cat:q.cat, score:answers[q.id]||0, text:q.text }));
    const { system, user } = buildPrompt(type, context, answers, questions, overall, lv);

    try {
      const genRes = await fetch("/api/generate", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1500,
          system,
          messages:[{ role:"user", content:user }]
        }),
      });

      const genRaw = await genRes.text();
      let genData;
      try { genData = JSON.parse(genRaw); } catch(e) { throw new Error("Invalid response from AI"); }
      const aiText = genData?.content?.[0]?.text || "Unable to generate report.";

      try {
        await fetch("/api/email", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body:JSON.stringify({
            to: email,
            name,
            orgName: context.orgName,
            type,
            overall: overall.toFixed(2),
            level: lv.label,
            aiText,
            scores: scored,
          }),
        });
      } catch(emailErr) {
        console.error("Email send failed:", emailErr);
      }

      setConfirmData({ context, respondent:{ name, email, role:context.role }, type, overall, level:lv.label });
      setScreen("confirmation");
      window.scrollTo(0,0);

    } catch(err) {
      console.error("Generation error:", err);
      setConfirmData({ context, respondent:{ name, email, role:context.role }, type, overall, level:lv.label });
      setScreen("confirmation");
      window.scrollTo(0,0);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:T.off }}>
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(248,247,244,.85)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", borderBottom:`1px solid ${T.border}`, padding:"0 26px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={()=>{ setScreen("home"); window.scrollTo(0,0); }} className="serif" style={{ fontSize:21, fontWeight:700, color:T.forest, letterSpacing:-.3 }}>
          Ado<span style={{ color:T.gold }}>vio</span>
        </button>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={()=>resetFor("change")} style={{ padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:500, color:T.forest, transition:"background .15s" }}
            onMouseEnter={e=>e.currentTarget.style.background=T.lime}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
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
