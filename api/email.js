export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const resendKey = process.env.RESEND_API_KEY;
  const browserlessKey = process.env.BROWSERLESS_API_KEY;

  if (!resendKey) return res.status(500).json({ error: "Resend key not configured" });

  const { to, name, orgName, type, overall, level, aiText } = req.body;
  const isChange = type === "change";
  const title = isChange ? "Change Readiness Assessment" : "AI Adoption Readiness Assessment";
  const accentColor = isChange ? "#1B4332" : "#1A5276";
  const accentBg = isChange ? "#D8F3DC" : "#EAF2F8";
  const date = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });

  // ── Format AI sections ─────────────────────────────────────────
  const rawSections = aiText.split(/\n(?=##\s)/).filter(Boolean);
  const sections = rawSections.map(s => {
    const lines = s.split("\n");
    return {
      heading: lines[0].replace(/^#+\s*/, "").trim(),
      body: lines.slice(1).join("\n").trim(),
    };
  }).filter(s => s.heading && s.body);

  const formatBody = (text) => text
    .replace(/### (.*)/g, '<h3 style="font-size:13px;font-weight:700;color:#141311;margin:16px 0 6px;font-family:Georgia,serif;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#141311;">$1</strong>')
    .replace(/\n\n/g, '</p><p style="font-size:13px;color:#4A4A4A;line-height:1.9;margin:0 0 12px;">')
    .replace(/\n/g, '<br/>');

  // ── PDF HTML ───────────────────────────────────────────────────
  const pdfHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #F8F7F4; color: #2E2C29; }
  .page { max-width: 794px; margin: 0 auto; padding: 0; }

  .cover { background: linear-gradient(135deg, #1B4332 0%, #0A1F14 100%); padding: 60px 56px 52px; }
  .cover-brand { font-size: 28px; font-weight: 700; color: #FFFFFF; font-family: Georgia, serif; margin-bottom: 4px; }
  .cover-brand span { color: #D4A843; }
  .cover-sub { font-size: 10px; color: rgba(255,255,255,.4); letter-spacing: 2px; margin-bottom: 32px; }
  .cover-badge { display: inline-block; padding: 4px 14px; border-radius: 100px; background: rgba(255,255,255,.12); color: #D8F3DC; font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
  .cover-org { font-size: 32px; font-weight: 700; color: #FFFFFF; font-family: Georgia, serif; margin-bottom: 8px; line-height: 1.2; }
  .cover-meta { font-size: 12px; color: rgba(255,255,255,.5); margin-bottom: 6px; }
  .cover-tags { margin-top: 20px; display: flex; gap: 8px; flex-wrap: wrap; }
  .cover-tag { font-size: 11px; padding: 3px 10px; border-radius: 100px; background: rgba(255,255,255,.1); color: rgba(255,255,255,.7); }

  .body { padding: 40px 56px; }

  .score-card { background: #FFFFFF; border-radius: 12px; border: 1px solid #DDD9D0; padding: 36px; margin-bottom: 28px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,.05); }
  .score-label { font-size: 10px; font-weight: 600; color: #9E9A92; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
  .score-number { font-size: 64px; font-weight: 700; color: ${accentColor}; line-height: 1; font-family: Georgia, serif; margin-bottom: 8px; }
  .score-denom { font-size: 16px; color: #9E9A92; margin-bottom: 16px; }
  .score-badge { display: inline-block; padding: 8px 24px; border-radius: 100px; background: ${accentBg}; color: ${accentColor}; font-size: 14px; font-weight: 700; }

  .section { background: #FFFFFF; border-radius: 12px; border: 1px solid #DDD9D0; border-left: 4px solid ${accentColor}; padding: 28px 32px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.04); page-break-inside: avoid; }
  .section-title { font-family: Georgia, serif; font-size: 18px; font-weight: 700; color: #141311; margin-bottom: 14px; }
  .section-body { font-size: 13px; color: #6B6760; line-height: 1.9; }
  .section-body p { margin-bottom: 12px; }

  .footer { background: #141311; border-radius: 12px; padding: 28px; text-align: center; margin-top: 8px; }
  .footer-title { font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px; }
  .footer-title span { color: #D4A843; }
  .footer-sub { font-size: 11px; color: #6B6760; margin-bottom: 2px; }
</style>
</head>
<body>
<div class="page">

  <div class="cover">
    <div class="cover-brand">Ado<span>vio</span></div>
    <div class="cover-sub">CHANGE INTELLIGENCE PLATFORM</div>
    <div class="cover-badge">${title}</div>
    <div class="cover-org">${orgName}</div>
    <div class="cover-meta">Prepared for ${name} · ${date}</div>
    <div class="cover-tags">
      ${isChange ? '<span class="cover-tag">Change Readiness</span>' : '<span class="cover-tag">AI Adoption Readiness</span>'}
      <span class="cover-tag">Confidential Report</span>
    </div>
  </div>

  <div class="body">

    <div class="score-card">
      <div class="score-label">Overall Readiness Score</div>
      <div class="score-number">${overall}</div>
      <div class="score-denom">out of 5.00</div>
      <div class="score-badge">${level} Readiness</div>
    </div>

    ${sections.map(s => `
    <div class="section">
      <div class="section-title">${s.heading}</div>
      <div class="section-body">
        <p>${formatBody(s.body)}</p>
      </div>
    </div>
    `).join("")}

    <div class="footer">
      <div class="footer-title">Ado<span>vio</span></div>
      <div class="footer-sub">Human-Centered AI Change Framework</div>
      <div class="footer-sub">adovio.vercel.app · Free for the change community</div>
      <div class="footer-sub" style="margin-top:8px;">linkedin.com/in/divyamkaushik</div>
    </div>

  </div>
</div>
</body>
</html>`;

  // ── Generate PDF via Browserless ───────────────────────────────
  let pdfBase64 = null;
  if (browserlessKey) {
    try {
      const pdfRes = await fetch(`https://chrome.browserless.io/pdf?token=${browserlessKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: pdfHtml,
          options: {
            format: "A4",
            printBackground: true,
            margin: { top: "0", right: "0", bottom: "0", left: "0" },
          },
        }),
      });
      const pdfBuffer = await pdfRes.arrayBuffer();
      pdfBase64 = Buffer.from(pdfBuffer).toString("base64");
    } catch(pdfErr) {
      console.error("PDF generation failed:", pdfErr);
    }
  }

  // ── Email HTML ─────────────────────────────────────────────────
  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <div style="background:linear-gradient(135deg,#1B4332 0%,#0A1F14 100%);border-radius:16px;padding:40px;margin-bottom:24px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#FFFFFF;margin-bottom:4px;">Ado<span style="color:#D4A843;">vio</span></div>
      <div style="font-size:10px;color:rgba(255,255,255,.4);letter-spacing:2px;margin-bottom:24px;">CHANGE INTELLIGENCE PLATFORM</div>
      <div style="display:inline-block;padding:4px 14px;border-radius:100px;background:rgba(255,255,255,.12);color:#D8F3DC;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px;">${title}</div>
      <div style="font-size:26px;font-weight:700;color:#FFFFFF;margin-bottom:6px;">${orgName}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.5);">Prepared for ${name} · ${date}</div>
    </div>

    <div style="background:#FFFFFF;border-radius:12px;border:1px solid #DDD9D0;padding:36px;margin-bottom:20px;text-align:center;">
      <div style="font-size:11px;font-weight:600;color:#9E9A92;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Your Overall Readiness Score</div>
      <div style="font-size:56px;font-weight:700;color:${accentColor};line-height:1;margin-bottom:8px;">${overall}</div>
      <div style="font-size:15px;color:#9E9A92;margin-bottom:16px;">out of 5.00</div>
      <div style="display:inline-block;padding:7px 22px;border-radius:100px;background:${accentBg};color:${accentColor};font-size:14px;font-weight:700;">${level} Readiness</div>
      <p style="font-size:14px;color:#6B6760;margin:20px 0 0;line-height:1.7;">${pdfBase64 ? "Your full personalised report is attached as a PDF — open it to read your key findings, risk areas, and recommended actions." : "Your full personalised report is included below — scroll down to read your key findings, risk areas, and recommended actions."}</p>
    </div>

    ${!pdfBase64 ? `
    <div style="background:#FFFFFF;border-radius:12px;border:1px solid #DDD9D0;padding:36px;margin-bottom:20px;border-left:4px solid ${accentColor};">
      <h2 style="font-family:Georgia,serif;font-size:20px;color:#141311;margin:0 0 20px;">Your Personalised Report</h2>
      ${sections.map(s => `
        <h3 style="font-family:Georgia,serif;font-size:16px;color:${accentColor};margin:24px 0 10px;">${s.heading}</h3>
        <p style="font-size:14px;color:#4A4A4A;line-height:1.8;margin:0 0 12px;">${formatBody(s.body)}</p>
      `).join("")}
    </div>
    ` : ""}

    <div style="background:linear-gradient(135deg,#1B433210,#40916C10);border-radius:12px;border:1px solid #40916C40;padding:28px 32px;margin-bottom:20px;text-align:center;">
      <div style="font-size:18px;font-weight:700;color:#1B4332;margin-bottom:8px;">Found this valuable?</div>
      <p style="font-size:13px;color:#6B6760;line-height:1.6;margin-bottom:20px;">Connect on LinkedIn for weekly insights on change management, AI adoption, and organisational transformation.</p>
      <a href="https://www.linkedin.com/in/divyamkaushik/" style="display:inline-block;padding:12px 28px;border-radius:8px;background:#1B4332;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">Connect on LinkedIn →</a>
    </div>

    <div style="background:#141311;border-radius:12px;padding:24px;text-align:center;">
      <div style="font-size:18px;font-weight:700;color:#FFFFFF;margin-bottom:6px;">Ado<span style="color:#D4A843;">vio</span></div>
      <div style="font-size:11px;color:#6B6760;margin-bottom:2px;">Human-Centered AI Change Framework</div>
      <div style="font-size:11px;color:#6B6760;">adovio.vercel.app · Free for the change community</div>
    </div>

  </div>
</body>
</html>`;

  try {
    const emailPayload = {
      from: "Adovio Reports <reports@adovio.io>",
      to: [to],
      subject: `Your ${title} — ${orgName}`,
      html: emailHtml,
    };

    if (pdfBase64) {
      emailPayload.attachments = [{
        filename: `Adovio-Report-${orgName.replace(/\s+/g, "-")}.pdf`,
        content: pdfBase64,
      }];
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();
    console.log("Resend response:", JSON.stringify(data));
    if (data.error) return res.status(400).json({ error: data.error });
    return res.status(200).json({ success: true });

  } catch(err) {
    console.error("Email error:", err);
    return res.status(500).json({ error: err.message });
  }
}
