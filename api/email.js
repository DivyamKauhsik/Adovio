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
  const title = isChange ? "Change Readiness Assessment" : "AI Adoption Readiness Assessment";
  const accentColor = isChange ? "#1B4332" : "#1A5276";
  const accentBg = isChange ? "#D8F3DC" : "#EAF2F8";

  const formattedReport = aiText
    .replace(/## (.*)/g, '<h2 style="font-family:Georgia,serif;font-size:18px;color:#141311;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid #1B4332;">$1</h2>')
    .replace(/### (.*)/g, '<h3 style="font-family:Georgia,serif;font-size:15px;color:#2E2C29;margin:18px 0 6px;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#141311;">$1</strong>')
    .replace(/\n\n/g, '</p><p style="font-size:14px;color:#4A4A4A;line-height:1.8;margin:0 0 12px;">')
    .replace(/\n/g, '<br/>');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1B4332 0%,#0A1F14 100%);border-radius:16px;padding:40px;margin-bottom:24px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#FFFFFF;margin-bottom:4px;">Ado<span style="color:#D4A843;">vio</span></div>
      <div style="font-size:10px;color:rgba(255,255,255,.4);letter-spacing:2px;margin-bottom:24px;">CHANGE INTELLIGENCE PLATFORM</div>
      <div style="display:inline-block;padding:4px 14px;border-radius:100px;background:rgba(255,255,255,.12);color:#D8F3DC;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px;">${title}</div>
      <div style="font-size:26px;font-weight:700;color:#FFFFFF;margin-bottom:6px;">${orgName}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.5);">Prepared for ${name}</div>
    </div>

    <!-- Score -->
    <div style="background:#FFFFFF;border-radius:12px;border:1px solid #DDD9D0;padding:36px;margin-bottom:20px;text-align:center;">
      <div style="font-size:11px;font-weight:600;color:#9E9A92;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Your Overall Readiness Score</div>
      <div style="font-size:56px;font-weight:700;color:${accentColor};line-height:1;margin-bottom:8px;">${overall}</div>
      <div style="font-size:15px;color:#9E9A92;margin-bottom:16px;">out of 5.00</div>
      <div style="display:inline-block;padding:7px 22px;border-radius:100px;background:${accentBg};color:${accentColor};font-size:14px;font-weight:700;">${level} Readiness</div>
    </div>

    <!-- Report -->
    <div style="background:#FFFFFF;border-radius:12px;border:1px solid #DDD9D0;padding:36px;margin-bottom:20px;">
      <h2 style="font-family:Georgia,serif;font-size:20px;color:#141311;margin:0 0 20px;">Your Personalised Report</h2>
      <p style="font-size:14px;color:#4A4A4A;line-height:1.8;margin:0 0 12px;">${formattedReport}</p>
    </div>

    <!-- LinkedIn CTA -->
    <div style="background:linear-gradient(135deg,#1B433210,#40916C10);border-radius:12px;border:1px solid #40916C40;padding:28px 32px;margin-bottom:20px;text-align:center;">
      <div style="font-size:18px;font-weight:700;color:#1B4332;margin-bottom:8px;">Found this valuable?</div>
      <p style="font-size:13px;color:#6B6760;line-height:1.6;margin-bottom:20px;">Connect on LinkedIn for weekly insights on change management, AI adoption, and organisational transformation.</p>
      <a href="https://www.linkedin.com/in/divyamkaushik/" style="display:inline-block;padding:12px 28px;border-radius:8px;background:#1B4332;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">Connect on LinkedIn →</a>
    </div>

    <!-- Footer -->
    <div style="background:#141311;border-radius:12px;padding:24px;text-align:center;">
      <div style="font-size:18px;font-weight:700;color:#FFFFFF;margin-bottom:6px;">Ado<span style="color:#D4A843;">vio</span></div>
      <div style="font-size:11px;color:#6B6760;margin-bottom:2px;">Human-Centered AI Change Framework</div>
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
    console.log("Resend response:", JSON.stringify(data));
    if (data.error) return res.status(400).json({ error: data.error });
    return res.status(200).json({ success: true });

  } catch(err) {
    console.error("Email error:", err);
    return res.status(500).json({ error: err.message });
  }
}
