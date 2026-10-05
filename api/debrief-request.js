/* ── POST /api/debrief-request — paid 20-min debrief requests ──
   Body: { name, email, times }
   - Emails the owner the request details (NOTIFY_EMAIL, else portmoodypulse@gmail.com).
   - Sends the requester a confirmation email.
   Payment is handled manually (e-transfer) until a booking URL is configured.
*/
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: "Resend key not configured" });

  const { name, email, times } = req.body || {};
  const cleanName = (name || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanTimes = (times || "").trim();
  if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: "Please provide your name and a valid email address." });
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${resendKey}`,
  };
  const ownerTo = process.env.NOTIFY_EMAIL || "kaushik.divyam@gmail.com";
  const stamp = new Date().toISOString();

  // 1. Notify the owner
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: "Adovio <updates@adovio.io>",
        to: [ownerTo],
        subject: `Debrief request: ${cleanName} (${cleanEmail})`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;">
          <h2 style="margin:0 0 12px;">New 20-min debrief request</h2>
          <p><strong>Name:</strong> ${cleanName}<br/>
          <strong>Email:</strong> ${cleanEmail}<br/>
          <strong>Times that work:</strong> ${cleanTimes ? cleanTimes.replace(/\n/g, "<br/>") : "— not specified —"}</p>
          <p style="color:#888;font-size:12px;">${stamp}</p>
          <p style="font-size:13px;">Reply with your e-transfer details and a meeting link to confirm.</p>
        </div>`,
      }),
    });
  } catch (e) {
    console.error("Owner notify failed:", e);
    return res.status(500).json({ error: "Could not send request. Please try again." });
  }

  // 2. Confirm to the requester
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: "Adovio <updates@adovio.io>",
        to: [cleanEmail],
        subject: "Your debrief request is in",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;background:#F8F7F4;padding:32px;">
          <div style="background:#1A1917;border-radius:12px;padding:28px;text-align:center;margin-bottom:16px;">
            <div style="font-size:18px;font-weight:700;color:#fff;">ADOVIO</div>
            <div style="font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;margin-top:4px;">1-ON-1 DEBRIEF</div>
          </div>
          <div style="background:#fff;border-radius:12px;border:1px solid #DDD9D0;padding:28px;">
            <p style="font-size:14px;color:#2C2B28;line-height:1.7;margin:0 0 12px;">Hi ${cleanName},</p>
            <p style="font-size:14px;color:#2C2B28;line-height:1.7;margin:0;">Thanks — your request for a 20-minute debrief is in. I'll reply within 24 hours with payment details and scheduling options.</p>
          </div>
        </div>`,
      }),
    });
  } catch (e) {
    console.error("Requester confirm failed:", e);
  }

  return res.status(200).json({ success: true });
}
