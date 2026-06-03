import { useState, useEffect } from "react";

const T = {
  white:"#FFFFFF", off:"#F8F7F4", light:"#EEECEA", border:"#DDD9D0",
  muted:"#9E9A92", mid:"#6B6760", body:"#2E2C29", ink:"#141311",
  forest:"#1B4332", sage:"#40916C", lime:"#D8F3DC",
  gold:"#B5883A", goldL:"#FDF3DC",
  red:"#C0392B", redL:"#FDECEA",
  amber:"#C0580A", amberL:"#FEF0E6",
  blue:"#1A5276", blueL:"#EAF2F8",
};

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

function avgScore(answers, questions) {
  const vals = questions.map(q => answers[q.id] || 0).filter(v => v > 0);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
}

function getLevel(score) {
  if (score >= 4.2) return { label:"Strong",   color:T.sage,  bg:T.lime,   desc:"Strong readiness fundamentals are in place." };
  if (score >= 3.2) return { label:"Moderate", color:T.gold,  bg:T.goldL,  desc:"A reasonable foundation exists but important gaps remain." };
  if (score >= 2.2) return { label:"At Risk",  color:T.amber, bg:T.amberL, desc:"Significant readiness gaps exist that could derail success." };
  return               { label:"Critical", color:T.red,   bg:T.redL,   desc:"Immediate action is required before proceeding." };
}

function formatDate() {
  return new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
}

function buildPrompt(type, context, answers, questions, overall, lv) {
  const isChange = type === "change";
  const scoreLines = questions.map(q => `  • ${q.cat} (${answers[q.id]||0}/5): "${q.text}"`).join("\n");
  const lowScores = questions.filter(q=>(answers[q.id]||0)<=2.5).map(q=>q.cat).join(", ");
  const highScores = questions.filter(q=>(answers[q.id]||0)>=4).map(q=>q.cat).join(", ");

  const system = isChange
    ? `You are a senior change management consultant with 20+ years of experience. You have deep expertise in ADKAR, Kotter, Bridges, and Prosci methodologies. Your reports are known for being honest, specific, and actionable — never generic. CRITICAL: Never state the obvious. Every insight MUST reference specific scores AND industry context. Every recommendation must be executable tomorrow. Include real research benchmarks. Be direct and honest even when uncomfortable.`
    : `You are a world-class expert in AI adoption and organisational change. You deeply understand both human and technical dimensions of AI transformation. CRITICAL: Never state the obvious about AI. Reference the organisation's industry. Every recommendation must be executable. Include real research benchmarks. Be honest about AI risks organisations typically underestimate.`;

  const user = `ASSESSMENT: ${isChange ? "Change Readiness" : "AI Adoption Readiness"}
ORGANISATION: ${context.orgName}
RESPONDENT ROLE: ${context.role}
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
A vivid specific 90-day picture of success if recommendations are followed. Make it tangible and motivating.`;

  return { system, user };
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { scroll-behavior:smooth; }
  body { background:${T.off}; color:${T.body}; font-family:'Inter',sans-serif; line-height:1.6; -webkit-font-smoothing:antialiased; }
  ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:${T.light}} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fu{animation:fadeUp .5s ease both}
  .fu1{animation:fadeUp .5s .08s ease both}
  .fu2{animation:fadeUp .5s .16s ease both}
  .fu3{animation:fadeUp .5s .24s ease both}
  .fu4{animation:fadeUp .5s .32s ease both}
  .serif{font-family:'Playfair Display',serif}
  .mono{font-family:'DM Mono',monospace}
  input,textarea,select{font-family:'Inter',sans-serif}
  button{cursor:pointer;border:none;background:none;font-family:'Inter',sans-serif}
`;

function Badge({ children, color=T.forest, bg=T.lime }) {
  return <span style={{ display:"inline-block", padding:"3px 12px", borderRadius:100, background:bg, color, fontSize:11, fontWeight:600, letterSpacing:.8, textTransform:"uppercase" }}>{children}</span>;
}

function PrimaryBtn({ children, onClick, disabled, full, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
      padding:small?"9px 20px":"13px 32px", borderRadius:8, fontSize:small?13:14, fontWeight:600,
      background:disabled?T.border:T.forest, color:disabled?T.muted:T.white,
      cursor:disabled?"not-allowed":"pointer", transition:"all .2s",
      width:full?"100%":"auto", boxShadow:disabled?"none":"0 2px 8px rgba(27,67,50,.25)", letterSpacing:.3,
    }}
      onMouseEnter={e=>{if(!disabled){e.currentTarget.style.background="#163829";e.currentTarget.style.transform="translateY(-1px)";}}}
      onMouseLeave={e=>{e.currentTarget.style.background=disabled?T.border:T.forest;e.currentTarget.style.transform="translateY(0)";}}
    >{children}</button>
  );
}

function OutlineBtn({ children, onClick, style={} }) {
  return (
    <button onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"12px 28px", borderRadius:8, fontSize:14, fontWeight:500,
      border:`1.5px solid ${T.forest}`, color:T.forest, background:"transparent",
      transition:"all .2s", letterSpacing:.2, ...style,
    }}
      onMouseEnter={e=>e.currentTarget.style.background=T.lime}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >{children}</button>
  );
}

function Label({ children, required }) {
  return <div style={{ fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase", color:T.muted, marginBottom:6 }}>{children}{required&&<span style={{color:T.red}}> *</span>}</div>;
}

function TextInput({ label, value, onChange, placeholder, type="text", required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{ width:"100%", padding:"11px 14px", borderRadius:7, fontSize:14, border:`1.5px solid ${focused?T.forest:T.border}`, background:T.white, color:T.ink, outline:"none", transition:"border-color .2s" }}
      />
    </div>
  );
}

function Steps({ current }) {
  const steps = ["Context","Assessment","Your Details","Report"];
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:40 }}>
      {steps.map((s,i)=>(
        <div key={s} style={{ display:"flex", alignItems:"center", flex:i<steps.length-1?1:"none" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:i<=current?T.forest:T.white, border:`2px solid ${i<=current?T.forest:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, color:i<=current?T.white:T.muted, transition:"all .3s" }}>{i<current?"✓":i+1}</div>
            <span style={{ fontSize:10, fontWeight:500, color:i===current?T.forest:T.muted, whiteSpace:"nowrap", letterSpacing:.4 }}>{s.toUpperCase()}</span>
          </div>
          {i<steps.length-1&&<div style={{ flex:1, height:2, background:i<current?T.forest:T.border, margin:"0 8px", marginBottom:16, transition:"background .3s" }}/>}
        </div>
      ))}
    </div>
  );
}

function HomeScreen({ onStart }) {
  return (
    <div>
      <section style={{ background:`linear-gradient(160deg,${T.forest} 0%,#0D2B1F 100%)`, padding:"100px 24px 80px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.04, backgroundImage:`radial-gradient(circle,white 1px,transparent 1px)`, backgroundSize:"32px 32px" }}/>
        <div style={{ position:"relative", zIndex:1, maxWidth:680, margin:"0 auto" }}>
          <div className="fu" style={{ marginBottom:20 }}><Badge color={T.lime} bg="rgba(255,255,255,.12)">Free · No Login Required</Badge></div>
          <h1 className="serif fu1" style={{ fontSize:"clamp(36px,6vw,64px)", fontWeight:700, color:T.white, lineHeight:1.15, letterSpacing:-.5, marginBottom:24 }}>Is Your Organisation<br/>Ready for Change?</h1>
          <p className="fu2" style={{ fontSize:17, color:"rgba(255,255,255,.72)", lineHeight:1.75, maxWidth:520, margin:"0 auto 44px" }}>AI-powered readiness diagnostics for change practitioners and organisations. Get your personalised report in 10 minutes.</p>
          <div className="fu3" style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>onStart("change")} style={{ padding:"14px 32px", borderRadius:8, fontSize:15, fontWeight:600, background:T.white, color:T.forest, border:"none", cursor:"pointer", boxShadow:"0 4px 16px rgba(0,0,0,.2)", transition:"all .2s" }} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Change Readiness →</button>
            <button onClick={()=>onStart("ai")} style={{ padding:"14px 32px", borderRadius:8, fontSize:15, fontWeight:600, background:"transparent", color:T.white, border:"1.5px solid rgba(255,255,255,.4)", cursor:"pointer", transition:"all .2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.1)";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.transform="translateY(0)";}}>AI Adoption Readiness →</button>
          </div>
          <div className="fu4" style={{ marginTop:56, display:"flex", gap:48, justifyContent:"center", flexWrap:"wrap" }}>
            {[["10 min","to complete"],["AI-powered","personalised report"],["Free","always"]].map(([v,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div className="serif" style={{ fontSize:26, fontWeight:700, color:T.white }}>{v}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", letterSpacing:.5 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding:"72px 24px", maxWidth:900, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <Badge>Two Assessments</Badge>
          <h2 className="serif" style={{ fontSize:34, fontWeight:700, marginTop:16, letterSpacing:-.3 }}>Choose Your Diagnostic</h2>
          <p style={{ color:T.mid, marginTop:12, maxWidth:480, margin:"12px auto 0", fontSize:15 }}>Each assessment generates a personalised AI report tailored to your specific situation.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:24 }}>
          {[
            { type:"change", icon:"🔄", title:"Change Readiness", desc:"Assess organisational readiness across 10 critical dimensions — leadership, communication, capacity, resistance, and more.", tags:["Leadership","Stakeholders","Capacity","Resistance"], color:T.forest, bg:T.lime },
            { type:"ai", icon:"🤖", title:"AI Adoption Readiness", desc:"Diagnose how prepared your people, culture, and leadership are to successfully adopt AI — and where the human risks lie.", tags:["Culture","Trust","Manager Readiness","Narrative"], color:T.blue, bg:T.blueL },
          ].map(c=>(
            <div key={c.type} style={{ background:T.white, borderRadius:14, border:`1px solid ${T.border}`, padding:"36px 32px", transition:"all .2s", boxShadow:"0 2px 12px rgba(0,0,0,.05)" }} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,.1)";e.currentTarget.style.transform="translateY(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.05)";e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{ fontSize:36, marginBottom:20 }}>{c.icon}</div>
              <Badge color={c.color} bg={c.bg}>{c.title}</Badge>
              <p style={{ color:T.mid, fontSize:14, lineHeight:1.7, margin:"16px 0 24px" }}>{c.desc}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:28 }}>{c.tags.map(t=><span key={t} style={{ fontSize:11, padding:"3px 10px", borderRadius:100, background:T.off, color:T.mid, fontWeight:500 }}>{t}</span>)}</div>
              <PrimaryBtn onClick={()=>onStart(c.type)}>Start Assessment →</PrimaryBtn>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background:T.white, padding:"72px 24px", borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ maxWidth:780, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:56, alignItems:"center" }}>
          <div>
            <Badge>Methodology</Badge>
            <h2 className="serif" style={{ fontSize:30, fontWeight:700, margin:"16px 0 16px", letterSpacing:-.3, lineHeight:1.25 }}>Human-Centered<br/>AI Change Framework</h2>
            <p style={{ color:T.mid, lineHeight:1.8, fontSize:14 }}>Built at the intersection of change management practice and AI adoption expertise. Every question reflects what actually drives — or kills — successful transformation.</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[["🎯","Practitioner-Grade","Built from real change engagements, not textbooks."],["🤖","AI-Augmented","Claude AI generates personalised, specific recommendations."],["📊","Actionable Output","You leave with a report you can actually use."]].map(([icon,title,desc])=>(
              <div key={title} style={{ display:"flex", gap:16, padding:"18px 20px", borderRadius:10, background:T.off, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:22, flexShrink:0 }}>{icon}</div>
                <div><div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>{title}</div><div style={{ fontSize:13, color:T.mid }}>{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding:"72px 24px", textAlign:"center" }}>
        <h2 className="serif" style={{ fontSize:32, fontWeight:700, marginBottom:16, letterSpacing:-.3 }}>Know Where You Stand.</h2>
        <p style={{ color:T.mid, marginBottom:36, fontSize:15 }}>Free assessment. AI-powered report. No login required.</p>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <PrimaryBtn onClick={()=>onStart("change")}>Change Readiness →</PrimaryBtn>
          <OutlineBtn onClick={()=>onStart("ai")}>AI Adoption Readiness →</OutlineBtn>
        </div>
      </section>

      <footer style={{ background:T.ink, padding:"24px", textAlign:"center" }}>
        <p style={{ fontSize:12, color:T.mid, letterSpacing:.5 }}>ADOVIO · HUMAN-CENTERED AI CHANGE FRAMEWORK · FREE FOR THE CHANGE COMMUNITY</p>
      </footer>
    </div>
  );
}

function ContextStep({ type, context, setContext, onNext, onBack }) {
  const accent = type==="change"?T.forest:T.blue;
  const valid = context.orgName&&context.role&&context.changeDesc;
  return (
    <div style={{ maxWidth:620, margin:"0 auto", padding:"48px 24px" }}>
      <Steps current={0}/>
      <Badge color={accent} bg={type==="change"?T.lime:T.blueL}>{type==="change"?"Change Readiness":"AI Adoption Readiness"}</Badge>
      <h2 className="serif" style={{ fontSize:30, fontWeight:700, margin:"14px 0 6px", letterSpacing:-.3 }}>Let's set the context</h2>
      <p style={{ color:T.mid, fontSize:14, marginBottom:36 }}>This helps us tailor the AI analysis specifically to your situation.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <TextInput label="Organisation or Initiative Name" required value={context.orgName} onChange={v=>setContext(c=>({...c,orgName:v}))} placeholder="e.g. Acme Corp — ERP Rollout 2025"/>
        <TextInput label="Your Role" required value={context.role} onChange={v=>setContext(c=>({...c,role:v}))} placeholder="e.g. Change Manager, HR Director, Project Sponsor"/>
        <div>
          <Label required>Briefly describe the change or initiative</Label>
          <textarea value={context.changeDesc} onChange={e=>setContext(c=>({...c,changeDesc:e.target.value}))} placeholder={type==="change"?"e.g. Implementing a new ERP system across 3 business units...":"e.g. Rolling out Microsoft Copilot to 500 employees in Q3..."} rows={3} style={{ width:"100%", padding:"11px 14px", borderRadius:7, fontSize:14, border:`1.5px solid ${T.border}`, background:T.white, color:T.ink, outline:"none", resize:"vertical", transition:"border-color .2s" }} onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[["Industry",["Financial Services","Healthcare","Technology","Government","Retail","Manufacturing","Education","Professional Services","Other"],"industry"],["Organisation Size",["1–50","51–200","201–1,000","1,001–5,000","5,000+"],"size"]].map(([lbl,opts,key])=>(
            <div key={key}>
              <Label>{lbl}</Label>
              <select value={context[key]} onChange={e=>setContext(c=>({...c,[key]:e.target.value}))} style={{ width:"100%", padding:"11px 14px", borderRadius:7, fontSize:14, border:`1.5px solid ${T.border}`, background:T.white, color:T.body, outline:"none" }}>
                <option value="">Select {lbl.toLowerCase()}</option>
                {opts.map(o=><option key={o} value={o}>{key==="size"?`${o} employees`:o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:40 }}>
        <OutlineBtn onClick={onBack}>← Back</OutlineBtn>
        <PrimaryBtn onClick={onNext} disabled={!valid}>Continue →</PrimaryBtn>
      </div>
    </div>
  );
}

function QuestionsStep({ type, answers, setAnswers, onNext, onBack }) {
  const questions = type==="change"?CHANGE_Qs:AI_Qs;
  const accent = type==="change"?T.forest:T.blue;
  const answered = questions.filter(q=>answers[q.id]).length;
  const allDone = answered===questions.length;
  return (
    <div style={{ maxWidth:680, margin:"0 auto", padding:"48px 24px" }}>
      <Steps current={1}/>
      <Badge color={accent} bg={type==="change"?T.lime:T.blueL}>{type==="change"?"Change Readiness":"AI Adoption Readiness"}</Badge>
      <h2 className="serif" style={{ fontSize:28, fontWeight:700, margin:"12px 0 4px", letterSpacing:-.3 }}>Rate each statement</h2>
      <p style={{ color:T.mid, fontSize:13, marginBottom:20 }}>{answered} of {questions.length} answered</p>
      <div style={{ height:6, background:T.border, borderRadius:3, marginBottom:36, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${(answered/questions.length)*100}%`, borderRadius:3, background:accent, transition:"width .3s ease" }}/>
      </div>
      {questions.map((q,i)=>{
        const sel=answers[q.id];
        return (
          <div key={q.id} style={{ padding:"24px 0", borderBottom:i<questions.length-1?`1px solid ${T.border}`:"none", animation:`fadeUp .4s ${i*.04}s both` }}>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
              <span style={{ width:22, height:22, borderRadius:"50%", background:sel?accent:T.light, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:sel?T.white:T.muted, flexShrink:0, transition:"all .2s" }}>{sel||i+1}</span>
              <Badge color={T.mid} bg={T.off}>{q.cat}</Badge>
            </div>
            <p style={{ fontSize:14, lineHeight:1.65, color:T.body, marginBottom:16, paddingLeft:32 }}>{q.text}</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", paddingLeft:32 }}>
              {SCALE.map(s=>{
                const active=sel===s.v;
                return (
                  <button key={s.v} onClick={()=>setAnswers(a=>({...a,[q.id]:s.v}))} style={{ padding:"7px 14px", borderRadius:6, fontSize:12, fontWeight:500, background:active?accent:T.white, color:active?T.white:T.mid, border:`1.5px solid ${active?accent:T.border}`, transition:"all .15s" }} onMouseEnter={e=>{if(!active){e.currentTarget.style.borderColor=accent;e.currentTarget.style.color=accent;}}} onMouseLeave={e=>{if(!active){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.mid;}}}>
                    <span style={{fontWeight:700}}>{s.v}</span>
                  </button>
                );
              })}
              <span style={{ fontSize:11, color:T.muted, alignSelf:"center", marginLeft:4 }}>{sel?SCALE.find(s=>s.v===sel)?.label:"1 = Strongly Disagree · 5 = Strongly Agree"}</span>
            </div>
          </div>
        );
      })}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:40 }}>
        <OutlineBtn onClick={onBack}>← Back</OutlineBtn>
        <PrimaryBtn onClick={onNext} disabled={!allDone}>{allDone?"Continue →":`${questions.length-answered} remaining`}</PrimaryBtn>
      </div>
    </div>
  );
}

function EmailStep({ type, email, setEmail, name, setName, onNext, onBack }) {
  const valid = email&&email.includes("@")&&name;
  return (
    <div style={{ maxWidth:520, margin:"0 auto", padding:"48px 24px" }}>
      <Steps current={2}/>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
        <h2 className="serif" style={{ fontSize:30, fontWeight:700, marginBottom:10, letterSpacing:-.3 }}>Where should we send your report?</h2>
        <p style={{ color:T.mid, fontSize:14, lineHeight:1.7 }}>Your personalised AI report will be displayed immediately on screen.</p>
      </div>
      <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:12, padding:"32px", display:"flex", flexDirection:"column", gap:20, boxShadow:"0 2px 12px rgba(0,0,0,.05)" }}>
        <TextInput label="Your Full Name" required value={name} onChange={setName} placeholder="e.g. Sarah Johnson"/>
        <TextInput label="Work Email Address" required type="email" value={email} onChange={setEmail} placeholder="e.g. sarah@company.com"/>
        <div style={{ padding:"12px 16px", borderRadius:8, background:T.off, border:`1px solid ${T.border}`, fontSize:12, color:T.muted, lineHeight:1.6 }}>
          🔒 We respect your privacy. Your email will only be used to send you this report and occasional insights from the change community. No spam. Unsubscribe anytime.
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:32 }}>
        <OutlineBtn onClick={onBack}>← Back</OutlineBtn>
        <PrimaryBtn onClick={onNext} disabled={!valid}>Generate My Report →</PrimaryBtn>
      </div>
    </div>
  );
}

function GeneratingScreen({ type }) {
  const steps = ["Analysing your responses across all dimensions…","Identifying risk patterns and readiness gaps…","Benchmarking against change best practices…","Crafting personalised recommendations…","Finalising your report…"];
  const [step, setStep] = useState(0);
  useEffect(()=>{ const t=setInterval(()=>setStep(s=>Math.min(s+1,steps.length-1)),1800); return()=>clearInterval(t); },[]);
  const accent = type==="change"?T.forest:T.blue;
  return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:28, padding:40 }}>
      <div style={{ width:56, height:56, borderRadius:"50%", border:`3px solid ${T.border}`, borderTop:`3px solid ${accent}`, animation:"spin 1s linear infinite" }}/>
      <div style={{ textAlign:"center", maxWidth:380 }}>
        <h3 className="serif" style={{ fontSize:24, fontWeight:700, marginBottom:10 }}>Generating Your Report</h3>
        <p style={{ fontSize:13, color:accent, fontWeight:500 }}>{steps[step]}</p>
        <div style={{ display:"flex", gap:4, justifyContent:"center", marginTop:16 }}>
          {steps.map((_,i)=><div key={i} style={{ width:i===step?20:6, height:6, borderRadius:3, background:i<=step?accent:T.border, transition:"all .3s" }}/>)}
        </div>
      </div>
    </div>
  );
}

function ScoreGauge({ score }) {
  const lv = getLevel(score);
  const pct = ((score-1)/4); const r=56, circ=Math.PI*r, dash=pct*circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={160} height={100} viewBox="0 0 160 100">
        <path d="M 18 80 A 56 56 0 0 1 142 80" fill="none" stroke={T.light} strokeWidth={12} strokeLinecap="round"/>
        <path d="M 18 80 A 56 56 0 0 1 142 80" fill="none" stroke={lv.color} strokeWidth={12} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition:"stroke-dasharray 1.5s ease", filter:`drop-shadow(0 0 8px ${lv.color}60)` }}/>
        <text x={80} y={72} textAnchor="middle" fill={T.ink} style={{ fontSize:26, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{score.toFixed(1)}</text>
        <text x={80} y={88} textAnchor="middle" fill={T.muted} style={{ fontSize:9, fontFamily:"'DM Mono',monospace", letterSpacing:1 }}>OUT OF 5.0</text>
      </svg>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:4, padding:"4px 14px", borderRadius:100, background:lv.bg }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:lv.color }}/>
        <span style={{ fontSize:12, fontWeight:700, color:lv.color, letterSpacing:.5 }}>{lv.label} Readiness</span>
      </div>
    </div>
  );
}

function DimensionBar({ cat, score, index }) {
  const lv = getLevel(score); const pct = ((score-1)/4)*100;
  const [animated, setAnimated] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setAnimated(true),index*60+400); return()=>clearTimeout(t); },[]);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"150px 1fr 44px", alignItems:"center", gap:12, marginBottom:10 }}>
      <div style={{ fontSize:12, fontWeight:500, color:T.body }}>{cat}</div>
      <div style={{ height:8, background:T.light, borderRadius:4, overflow:"hidden", border:`1px solid ${T.border}` }}>
        <div style={{ height:"100%", width:animated?`${pct}%`:"0%", borderRadius:4, background:lv.color, transition:"width .8s ease", boxShadow:`0 0 4px ${lv.color}60` }}/>
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:lv.color, fontFamily:"'DM Mono',monospace", textAlign:"right" }}>{score}.0</div>
    </div>
  );
}

function ReportScreen({ data, onRestart, onOther }) {
  const { answers, context, respondent, type, aiText } = data;
  const isChange = type==="change";
  const questions = isChange?CHANGE_Qs:AI_Qs;
  const accent = isChange?T.forest:T.blue;
  const accentBg = isChange?T.lime:T.blueL;
  const overall = avgScore(answers,questions);
  const lv = getLevel(overall);
  const scored = questions.map(q=>({...q,score:answers[q.id]||0}));
  const weakest = [...scored].sort((a,b)=>a.score-b.score).slice(0,3);
  const strongest = [...scored].sort((a,b)=>b.score-a.score).slice(0,3);
  const rawSections = aiText.split(/\n(?=##\s)/).filter(Boolean);
  const sections = rawSections.map(s=>{ const lines=s.split("\n"); return { heading:lines[0].replace(/^#+\s*/,"").trim(), body:lines.slice(1).join("\n").trim() }; }).filter(s=>s.heading&&s.body);

  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"48px 24px 80px" }}>
      <Steps current={3}/>

      {/* Cover */}
      <div style={{ background:`linear-gradient(135deg,${T.forest} 0%,#0A1F14 100%)`, borderRadius:16, padding:"40px 44px 36px", marginBottom:28, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-50, right:-50, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,.03)" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:12 }}>
            <div>
              <div className="serif" style={{ fontSize:22, fontWeight:700, color:T.white }}>Ado<span style={{ color:"#D4A843" }}>vio</span></div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, marginTop:2 }}>CHANGE INTELLIGENCE PLATFORM</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:1, marginBottom:2 }}>CONFIDENTIAL REPORT</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.5)" }}>{formatDate()}</div>
            </div>
          </div>
          <Badge color={T.lime} bg="rgba(255,255,255,.12)">{isChange?"Change Readiness Assessment":"AI Adoption Readiness Assessment"}</Badge>
          <h1 className="serif" style={{ fontSize:"clamp(24px,4vw,36px)", fontWeight:700, marginTop:14, marginBottom:6, letterSpacing:-.5, color:T.white }}>{context.orgName}</h1>
          <p style={{ color:"rgba(255,255,255,.5)", fontSize:12 }}>Prepared for {respondent.name} · {respondent.email} · {formatDate()}</p>
          {context.changeDesc&&<p style={{ color:"rgba(255,255,255,.4)", fontSize:12, marginTop:8, fontStyle:"italic", maxWidth:500 }}>"{context.changeDesc}"</p>}
          {(context.industry||context.size)&&(
            <div style={{ marginTop:16, display:"flex", gap:10, flexWrap:"wrap" }}>
              {context.industry&&<span style={{ fontSize:11, padding:"3px 10px", borderRadius:100, background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.7)" }}>{context.industry}</span>}
              {context.size&&<span style={{ fontSize:11, padding:"3px 10px", borderRadius:100, background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.7)" }}>{context.size} employees</span>}
              <span style={{ fontSize:11, padding:"3px 10px", borderRadius:100, background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.7)" }}>{respondent.role}</span>
            </div>
          )}
        </div>
      </div>

      {/* Score */}
      <div style={{ background:T.white, borderRadius:12, border:`1px solid ${T.border}`, padding:"36px", marginBottom:24, display:"grid", gridTemplateColumns:"auto 1fr", gap:32, alignItems:"center", boxShadow:"0 2px 12px rgba(0,0,0,.05)" }}>
        <ScoreGauge score={overall}/>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:T.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Overall Readiness Score</div>
          <div className="serif" style={{ fontSize:36, fontWeight:700, color:lv.color, marginBottom:8 }}>{overall.toFixed(2)}<span style={{ fontSize:18, color:T.muted }}>/5.00</span></div>
          <p style={{ fontSize:14, color:T.mid, lineHeight:1.7 }}>{lv.desc}</p>
          <div style={{ marginTop:16, display:"flex", gap:8, flexWrap:"wrap" }}>
            {[[lv.label,"readiness level"],[`${questions.length} dimensions`,"assessed"],[`${scored.filter(q=>q.score>=4).length} strengths`,"identified"],[`${scored.filter(q=>q.score<3).length} risks`,"flagged"]].map(([v,l])=>(
              <div key={l} style={{ padding:"6px 12px", borderRadius:8, background:T.off, border:`1px solid ${T.border}` }}>
                <span style={{ fontWeight:600, fontSize:13 }}>{v}</span><span style={{ color:T.muted, fontSize:12 }}> {l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div style={{ background:T.white, borderRadius:12, border:`1px solid ${T.border}`, padding:"32px", marginBottom:24, boxShadow:"0 2px 12px rgba(0,0,0,.05)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <h3 className="serif" style={{ fontSize:20, fontWeight:700, letterSpacing:-.2 }}>Dimension Breakdown</h3>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[[T.red,"Critical"],[T.amber,"At Risk"],[T.gold,"Moderate"],[T.sage,"Strong"]].map(([c,l])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:8, height:8, borderRadius:2, background:c }}/><span style={{ fontSize:10, color:T.muted }}>{l}</span></div>
            ))}
          </div>
        </div>
        {scored.map((d,i)=><DimensionBar key={d.cat} cat={d.cat} score={d.score} index={i}/>)}
      </div>

      {/* Strengths & Risks */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        {[["✅ Top Strengths",strongest,T.sage,T.lime,"Leverage as anchors."],["⚠️ Priority Risks",weakest,T.amber,T.amberL,"Address urgently."]].map(([heading,items,color,bg,sub])=>(
          <div key={heading} style={{ background:T.white, borderRadius:12, border:`1px solid ${T.border}`, padding:"24px", boxShadow:"0 2px 12px rgba(0,0,0,.05)", borderTop:`3px solid ${color}` }}>
            <div style={{ fontWeight:700, fontSize:13, color, marginBottom:3 }}>{heading}</div>
            <div style={{ fontSize:11, color:T.muted, marginBottom:14 }}>{sub}</div>
            {items.map((q,i)=>(
              <div key={q.id} style={{ padding:"10px 12px", borderRadius:8, background:bg, marginBottom:i<items.length-1?8:0 }}>
                <div style={{ fontWeight:600, fontSize:12, color, marginBottom:2 }}>{q.cat} — {q.score}.0/5</div>
                <div style={{ fontSize:11, color:T.mid, lineHeight:1.5 }}>{q.text.length>72?q.text.substring(0,72)+"…":q.text}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* AI Analysis */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <h3 className="serif" style={{ fontSize:22, fontWeight:700, letterSpacing:-.2 }}>AI Analysis & Recommendations</h3>
          <Badge color={accent} bg={accentBg}>AI Generated</Badge>
        </div>
        <p style={{ fontSize:13, color:T.mid, marginBottom:24, lineHeight:1.6 }}>Each section is tailored to your specific scores, industry, and initiative — not generic advice.</p>
        {sections.length>0 ? sections.map((s,i)=>(
          <div key={i} style={{ background:T.white, borderRadius:12, padding:"28px 32px", border:`1px solid ${T.border}`, borderLeft:`4px solid ${accent}`, boxShadow:"0 2px 8px rgba(0,0,0,.04)", marginBottom:16, animation:`fadeUp .5s ${i*.08}s ease both` }}>
            <h4 className="serif" style={{ fontSize:17, fontWeight:700, color:T.ink, marginBottom:12 }}>{s.heading}</h4>
            <div style={{ fontSize:14, color:T.mid, lineHeight:1.85, whiteSpace:"pre-wrap" }}>{s.body}</div>
          </div>
        )) : (
          <div style={{ background:T.white, borderRadius:12, padding:"28px 32px", border:`1px solid ${T.border}`, borderLeft:`4px solid ${accent}` }}>
            <div style={{ fontSize:14, color:T.mid, lineHeight:1.85, whiteSpace:"pre-wrap" }}>{aiText}</div>
          </div>
        )}
      </div>

      {/* LinkedIn CTA */}
      <div style={{ background:`linear-gradient(135deg,${T.forest}08,${T.sage}08)`, borderRadius:12, border:`1px solid ${T.sage}40`, padding:"28px 32px", marginBottom:24, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ fontSize:32 }}>💼</div>
        <div style={{ flex:1 }}>
          <div className="serif" style={{ fontSize:16, fontWeight:700, color:T.forest, marginBottom:4 }}>Found this report valuable?</div>
          <p style={{ fontSize:13, color:T.mid, lineHeight:1.6 }}>Connect on LinkedIn for weekly insights on change management, AI adoption, and organisational transformation.</p>
        </div>
        <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:8, background:T.forest, color:T.white, fontSize:13, fontWeight:600, textDecoration:"none", transition:"all .2s", whiteSpace:"nowrap", boxShadow:"0 2px 8px rgba(27,67,50,.25)" }}>Connect on LinkedIn →</a>
      </div>

      {/* Next Assessment */}
      <div style={{ background:T.white, borderRadius:12, border:`1px solid ${T.border}`, padding:"36px", textAlign:"center", boxShadow:"0 2px 12px rgba(0,0,0,.05)" }}>
        <h3 className="serif" style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>{isChange?"Also assess your AI Adoption Readiness":"Also assess your Change Readiness"}</h3>
        <p style={{ color:T.mid, fontSize:14, marginBottom:24 }}>Get the complete picture of your organisation's transformation readiness.</p>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <PrimaryBtn onClick={onOther}>{isChange?"AI Adoption Readiness →":"Change Readiness →"}</PrimaryBtn>
          <OutlineBtn onClick={onRestart}>Start Over</OutlineBtn>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:T.ink, borderRadius:12, padding:"24px 28px", marginTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div className="serif" style={{ fontSize:16, fontWeight:700, color:T.white }}>Ado<span style={{ color:"#D4A843" }}>vio</span></div>
          <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Human-Centered AI Change Framework · adovio.vercel.app</div>
        </div>
        <div style={{ fontSize:11, color:T.muted, textAlign:"right" }}>Free for the change community<br/>Report generated {formatDate()}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen]         = useState("home");
  const [type, setType]             = useState(null);
  const [context, setContext]       = useState({ orgName:"", role:"", changeDesc:"", industry:"", size:"" });
  const [answers, setAnswers]       = useState({});
  const [email, setEmail]           = useState("");
  const [name, setName]             = useState("");
  const [reportData, setReportData] = useState(null);

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
    const { system, user } = buildPrompt(type, context, answers, questions, overall, lv);

    try {
      const response = await fetch("/api/generate", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1500,
          system,
          messages:[{ role:"user", content:user }]
        }),
      });

      const raw = await response.text();
      console.log("Raw API response:", raw);

      let d;
      try { d = JSON.parse(raw); }
      catch(e) { throw new Error("Invalid JSON response: " + raw.substring(0,200)); }

      console.log("Parsed response:", JSON.stringify(d).substring(0,300));

      const aiText =
        d?.content?.[0]?.text ||
        d?.content?.[0]?.value ||
        d?.completion ||
        (d?.error ? `API Error: ${typeof d.error === "object" ? d.error.message : d.error}` : null) ||
        `Raw response: ${raw.substring(0,500)}`;

      setReportData({ answers, context, respondent:{ name, email, role:context.role }, type, aiText });
    } catch(err) {
      console.error("Generation error:", err);
      setReportData({ answers, context, respondent:{ name, email, role:context.role }, type, aiText:`Error: ${err.message}` });
    }
    setScreen("report"); window.scrollTo(0,0);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.off }}>
      <nav style={{ position:"sticky", top:0, zIndex:100, background:`${T.white}F0`, backdropFilter:"blur(10px)", borderBottom:`1px solid ${T.border}`, padding:"0 28px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={()=>{ setScreen("home"); window.scrollTo(0,0); }} className="serif" style={{ fontSize:20, fontWeight:700, color:T.forest, letterSpacing:-.3 }}>Ado<span style={{ color:T.gold }}>vio</span></button>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={()=>resetFor("change")} style={{ padding:"7px 16px", borderRadius:6, fontSize:13, fontWeight:500, color:T.forest, background:"transparent", border:"none", transition:"background .15s" }} onMouseEnter={e=>e.currentTarget.style.background=T.lime} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Change Readiness</button>
          <PrimaryBtn small onClick={()=>resetFor("ai")}>AI Readiness</PrimaryBtn>
        </div>
      </nav>

      {screen==="home"       && <HomeScreen onStart={resetFor}/>}
      {screen==="context"    && <ContextStep type={type} context={context} setContext={setContext} onNext={()=>{ setScreen("questions"); window.scrollTo(0,0); }} onBack={()=>setScreen("home")}/>}
      {screen==="questions"  && <QuestionsStep type={type} answers={answers} setAnswers={setAnswers} onNext={()=>{ setScreen("email"); window.scrollTo(0,0); }} onBack={()=>setScreen("context")}/>}
      {screen==="email"      && <EmailStep type={type} email={email} setEmail={setEmail} name={name} setName={setName} onNext={handleGenerate} onBack={()=>setScreen("questions")}/>}
      {screen==="generating" && <GeneratingScreen type={type}/>}
      {screen==="report"     && reportData && <ReportScreen data={reportData} onRestart={()=>setScreen("home")} onOther={()=>resetFor(type==="change"?"ai":"change")}/>}
    </div>
  );
}
