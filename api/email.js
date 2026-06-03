import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, backgroundColor: "#F8F7F4", fontFamily: "Helvetica" },
  cover: { backgroundColor: "#1B4332", padding: 40, borderRadius: 8, marginBottom: 24 },
  coverTitle: { fontSize: 28, color: "#FFFFFF", fontFamily: "Helvetica-Bold", marginBottom: 6 },
  coverSub: { fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginBottom: 20 },
  coverBadge: { backgroundColor: "rgba(255,255,255,0.12)", padding: "4 12", borderRadius: 100, marginBottom: 16, alignSelf: "flex-start" },
  coverBadgeText: { fontSize: 10, color: "#D8F3DC", letterSpacing: 1 },
  coverOrg: { fontSize: 22, color: "#FFFFFF", fontFamily: "Helvetica-Bold", marginBottom: 6 },
  coverMeta: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  scoreCard: { backgroundColor: "#FFFFFF", padding: 28, borderRadius: 8, marginBottom: 20, alignItems: "center" },
  scoreLabel: { fontSize: 10, color: "#9E9A92", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" },
  scoreNumber: { fontSize: 48, color: "#1B4332", fontFamily: "Helvetica-Bold", lineHeight: 1 },
  scoreDenom: { fontSize: 14, color: "#9E9A92", marginBottom: 10 },
  scoreBadge: { backgroundColor: "#D8F3DC", padding: "5 16", borderRadius: 100 },
  scoreBadgeText: { fontSize: 12, color: "#1B4332", fontFamily: "Helvetica-Bold" },
  section: { backgroundColor: "#FFFFFF", padding: 28, borderRadius: 8, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#1B4332" },
  sectionTitle: { fontSize: 16, color: "#141311", fontFamily: "Helvetica-Bold", marginBottom: 12 },
  sectionBody: { fontSize: 11, color: "#6B6760", lineHeight: 1.8 },
  footer: { backgroundColor: "#141311", padding: 24, borderRadius: 8, marginTop: 8, alignItems: "center" },
  footerTitle: { fontSize: 16, color: "#FFFFFF", fontFamily: "Helvetica-Bold", marginBottom: 4 },
  footerSub: { fontSize: 10, color: "#6B6760" },
});

function buildPDF({ name, orgName, type, overall, level, aiText }) {
  const isChange = type === "change";
  const title = isChange ? "Change Readiness Assessment" : "AI Adoption Readiness Assessment";

  const rawSections = aiText.split(/\n(?=##\s)/).filter(Boolean);
  const sections = rawSections.map(s => {
    const lines = s.split("\n");
    return {
      heading: lines[0].replace(/^#+\s*/, "").trim(),
      body: lines.slice(1).join("\n").trim()
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/###\s*/g, "")
        .replace(/##\s*/g, ""),
    };
  }).filter(s => s.heading && s.body);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Cover */}
        <View style={styles.cover}>
          <Text style={styles.coverSub}>ADOVIO · CHANGE INTELLIGENCE PLATFORM</Text>
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>{title.toUpperCase()}</Text>
          </View>
          <Text style={styles.coverOrg}>{orgName}</Text>
          <Text style={styles.coverMeta}>Prepared for {name} · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</Text>
        </View>

        {/* Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>OVERALL READINESS SCORE</Text>
          <Text style={styles.scoreNumber}>{overall}</Text>
          <Text style={styles.scoreDenom}>out of 5.00</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>{level} Readiness</Text>
          </View>
        </View>

        {/* Sections */}
        {sections.map((s, i) => (
          <View key={i} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{s.heading}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Adovio</Text>
          <Text style={styles.footerSub}>Human-Centered AI Change Framework · adovio.vercel.app</Text>
          <Text style={styles.footerSub}>Free for the change community</Text>
        </View>

      </Page>
    </Document>
  );
}

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

  try {
    // Generate PDF
    const pdfBuffer = await renderToBuffer(buildPDF({ name, orgName, type, overall, level, aiText }));
    const pdfBase64 = pdfBuffer.toString("base64");

    // Clean email body
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
      <p style="font-size:14px;color:#6B6760;margin:20px 0 0;line-height:1.7;">Your full personalised report is attached as a PDF — including key findings, risk areas, and 5 recommended actions tailored specifically to your initiative.</p>
    </div>

    <!-- Download CTA -->
    <div style="text-align:center;margin-bottom:20px;">
      <p style="font-size:13px;color:#9E9A92;margin-bottom:16px;">📎 Your report is attached to this email as a PDF</p>
      <div style="display:inline-block;padding:14px 32px;border-radius:8px;background:#1B4332;color:#FFFFFF;font-size:14px;font-weight:600;">Open the attached PDF to read your full report →</div>
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
        attachments: [{
          filename: `Adovio-Report-${orgName.replace(/\s+/g, "-")}.pdf`,
          content: pdfBase64,
        }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error });
    return res.status(200).json({ success: true });

  } catch(err) {
    console.error("Email error:", err);
    return res.status(500).json({ error: err.message });
  }
}
