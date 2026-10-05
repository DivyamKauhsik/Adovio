/* ── POST /api/subscribe — The Adoption Gap newsletter signup ──
   Body: { email, name? }
   - Adds the contact to the Resend audience when RESEND_AUDIENCE_ID is set.
   - Sends the subscriber a welcome email.
   - Notifies the owner when NOTIFY_EMAIL is set.
*/
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: "Resend key not configured" });

  const { email, name } = req.body || {};
  const clean = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${resendKey}`,
  };

  // 1. Add to Resend audience (optional — needs RESEND_AUDIENCE_ID)
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (audienceId) {
    try {
      await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: clean,
          first_name: (name || "").trim().split(" ")[0] || undefined,
          unsubscribed: false,
        }),
      });
    } catch (e) {
      console.error("Audience add failed:", e);
    }
  }

  // 2. Welcome email to the subscriber
  const welcomeHtml = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#1A1917;border-radius:12px;padding:36px;text-align:center;margin-bottom:20px;">
      <div style="font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:.5px;">ADOVIO</div>
      <div style="font-size:10px;color:rgba(255,255,255,.4);letter-spacing:2px;margin:6px 0 20px;">THE ADOPTION GAP</div>
      <div style="font-size:16px;color:#FFFFFF;font-weight:600;margin-bottom:8px;">You're on the list.</div>
      <p style="font-size:13px;color:rgba(255,255,255,.55);line-height:1.7;margin:0;">Every other Tuesday: AI news read through an adoption lens. What happened, why adoption will stall, and one practical thing to do about it.</p>
    </div>
    <div style="background:#FFFFFF;border-radius:12px;border:1px solid #DDD9D0;padding:28px;text-align:center;">
      <div style="font-size:14px;font-weight:700;color:#1A1917;margin-bottom:8px;">While you wait</div>
      <p style="font-size:13px;color:#6B6760;line-height:1.7;margin:0 0 20px;">Take the free AI Adoption Readiness diagnostic. Ten questions, personalised report in your inbox.</p>
      <a href="https://www.adovio.io" style="display:inline-block;padding:12px 28px;background:#1A1917;color:#FFFFFF;font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;text-decoration:none;border-radius:4px;">Take the diagnostic</a>
    </div>
    <p style="font-size:11px;color:#9B9890;text-align:center;margin-top:20px;">Written by Divyam Kaushik · Unsubscribe anytime</p>
  </div>
</body></html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: "The Adoption Gap <updates@adovio.io>",
        to: [clean],
        subject: "You're subscribed to The Adoption Gap",
        html: welcomeHtml,
      }),
    });
  } catch (e) {
    console.error("Welcome email failed:", e);
  }

  // 3. Notify the owner (optional — needs NOTIFY_EMAIL)
  const notifyTo = process.env.NOTIFY_EMAIL;
  if (notifyTo) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: "Adovio <updates@adovio.io>",
          to: [notifyTo],
          subject: `New Adoption Gap subscriber: ${clean}`,
          html: `<p>New subscriber${name ? ` — ${name}` : ""}: <strong>${clean}</strong></p><p style="color:#888;font-size:12px;">${new Date().toISOString()}</p>`,
        }),
      });
    } catch (e) {
      console.error("Owner notify failed:", e);
    }
  }

  return res.status(200).json({ success: true });
}
