/* ── The Adoption Gap — article data ──────────────────────────
   Body blocks: { h } subhead · { p } paragraph (supports **bold**)
   { q } pull quote.
*/

export const ARTICLES = [
  {
    id: "why-the-adoption-gap",
    title: "Why I'm writing The Adoption Gap",
    date: "October 2026",
    read: "4 min read",
    excerpt:
      "Most AI projects don't fail because the AI is bad. They fail because nobody changed anything around it.",
    blocks: [
      { p: "I've spent 15+ years leading change inside large organisations. The pattern never changes." },
      { p: "A new tool arrives. Leadership declares victory at rollout. Six months later, everyone's back to the old way of working. The tool wasn't the problem. Nothing around the tool changed." },
      { p: "AI is the fastest version of this story we've ever seen. Billions in investment, 80% adoption rates, pilots everywhere. And a growing pile of evidence that none of it is landing where it matters." },
      { h: "The gap" },
      { p: "Every week, AI makes headlines. Model launches, funding rounds, enterprise deals. Almost none of those headlines answer the question that actually matters: will any of this work inside a real company, with real employees, real processes, and real resistance?" },
      { p: "That's the adoption gap. The space between what AI can do and what organisations can absorb. I live in that gap professionally. It's where I've done my best work." },
      { h: "What you'll get" },
      { p: "Every other Tuesday: one or two AI news stories, read through an adoption lens. **What happened. Why adoption will stall. One practical thing to do about it.** Written by a practitioner, not a pundit." },
      { p: "If you're the person who has to make AI work beyond the pilot, this is for you." },
    ],
  },
  {
    id: "developers-10x-faster",
    title: "Your developers are 10x faster. Your product isn't.",
    date: "October 2026",
    read: "3 min read",
    excerpt:
      "Oracle's co-CEO just told employees the uncomfortable truth about AI coding tools.",
    blocks: [
      { p: "In mid-September, Oracle's co-CEO sent an internal message that reads like a case study in the gap between AI promise and AI reality." },
      { p: "Generative AI tools made some coding tasks dramatically faster, cutting timelines from two or three quarters down to roughly a week. Adoption hit 80% after the company rolled out ChatGPT and Codex tools in the spring." },
      { p: "But product delivery didn't get faster." },
      { h: "The bottleneck moved" },
      { p: "Testing, validation, deployment, release management. Those are the chokepoints now. Oracle compressed the coding phase and discovered that every downstream process had become the critical path. Developers write code in a week, then wait months for it to ship." },
      { p: "This is **activity versus outcomes**. The activity got faster. The outcome didn't move. And it's the most common AI story in enterprise right now: impressive pilot metrics, unchanged business results." },
      { h: "What to do about it" },
      { p: "Before you celebrate a fast pilot, map the full workflow end to end and find where the queue actually lives. Then speed up the constraint, not the step that was already fine." },
      { p: "AI didn't fail at Oracle. The organisation just hasn't re-engineered what comes after the code. That's not a technology problem. It's a change problem. Which is exactly why it keeps happening." },
    ],
  },
];
