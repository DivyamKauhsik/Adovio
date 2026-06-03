export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: "Resend key not configured" });

  const { to, name, orgName, type, overall, level, aiText } = req.body;

  const isChange = type === "change";
  const accentColor = isChange ? "#1B4332" : "#1A5276";
  const title = isChange ? "Change Readiness Assessment" : "AI Adoption Readiness Assessment";

  const formattedReport = aiText
    .replace(/## (.*)/g, '<h2 style="font-family:Georgia,serif;font-size:20px;color:#141311;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #1B4332;">$1</h2>')
    .replace(/### (.*)/g, '<h3 style="font-family:Georgia,serif;font-size:16px;color:#2E2C29;margin:20px 0 8px;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#141311;">$1</strong>')
    .replace(/\n\n/g, '</p><p style="font-size:15px;color:#4A4A4A;line-height:1.8;margin:0 0 14px;">')
    .replace(/\n/g, '<br/>');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Helvetica Neue',Arial,sans-serif;">

  <div style="max-width:680px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1B4332 0%,#0A1F14 100%);border-radius:16px;padding:40px 44px;margin-bottom:24px;">
      <div style="margin-bottom:24px;">
        <span style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#FFFFFF;">Ado<span style="color:#D4A843;">vio</span></span>
        <div style="font-size:10px;color:rgba(255,255,255,.4);letter-spacing:2px;margin-top:2px;">CHANGE INTELLIGENCE PLATFORM</div>
      </div>
      <div style="display:inline-block;padding:3px 12px;border-radius:100px;background:rgba(255,255,255,.12);color:#D8F3DC;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;">${title}</div>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFFFFF;margin:0 0 8px;line-height:1.2;">${orgName}</h1>
      <p style="color:rgba(255,255,255,.6);font-size:13px;margin:0;">Prepared for ${name} · ${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p>
    </div>

    <!-- Score Card -->
    <div style="background:#FFFFFF;border-radius:12px;border:1px solid #DDD9D0;padding:32px;margin-bottom:20px;text-align:center;">
      <div style="font-size:11px;font-weight:600;color:#9E9A92;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Overall Readiness Score</div>
      <div style="font-family:Georgia,serif;font-size:52px;font-weight:700;color:${accentColor};line-height:1;">${overall}</div>
      <div style="font-size:16px;color:#9E9A92;margin-bottom:12px;">out of 5.00</div>
      <div style="display:inline-block;padding:6px 20px;border-radius:100px;background:${isChange?"#D8F3DC":"#EAF2F8"};color:${accentColor};font-size:14px;font-weight:700;">${level} Readiness</div>
    </div>

    <!-- Report -->
    <div style="background:#FFFFFF;border-radius:12px;border:1px solid #DDD9D0;padding:36px;margin-bottom:20px;">
      <h2 style="font-family:Georgia,serif;font-size:22px;color:#141311;margin:0 0 20px;">Your Personalised Report</h2>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.8;margin:0 0 14px;">${formattedReport}</p>
    </div>

    <!-- LinkedIn CTA -->
    <div style="background:linear-gradient(135deg,#1B433208,#40916C08);border-radius:12px;border:1px solid #40916C40;padding:28px 32px;margin-bottom:20px;">
      <h3 style="font-family:Georgia,serif;font-size:18px;color:#1B4332;margin:0 0 8px;">Found this report valuable?</h3>
      <p style="font-size:13px;color:#6B6760;line-height:1.6;margin:0 0 16px;">Connect on LinkedIn for weekly insights on change management, AI adoption, and organisational transformation.</p>
      <a href="https://linkedin.com/in/divyamkauhsik" style="display:inline-block;padding:10px 24px;border-radius:8px;background:#1B4332;color:#FFFFFF;font-size:13px;font-weight:600;text-decoration:none;">Connect on LinkedIn →</a>
    </div>

    <!-- Footer -->
    <div style="background:#141311;border-radius:12px;padding:24px 28px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#FFFFFF;margin-bottom:6px;">Ado<span style="color:#D4A843;">vio</span></div>
      <div style="font-size:11px;color:#6B6760;margin-bottom:4px;">Human-Centered AI Change Framework</div>
      <div style="font-size:11px;color:#6B6760;">adovio.vercel.app · Free for the change community</div>
    </div>

  </div>
</body>
</html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Adovio Reports <onboarding@resend.dev>",
        to: [to],
        subject: `Your ${title} — ${orgName}`,
        html,
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error });
    return res.status(200).json({ success: true, id: data.id });

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
