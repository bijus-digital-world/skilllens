/**
 * Seed demo data for presentations.
 * Run: npx tsx src/db/seed-demo.ts
 *
 * Creates a completed interview with full evaluation so HR can see the output.
 */
import { pool } from './pool'
import bcrypt from 'bcryptjs'

async function seedDemo() {
  const client = await pool.connect()

  try {
    // Get default org
    const orgResult = await client.query("SELECT id FROM organizations LIMIT 1")
    if (orgResult.rows.length === 0) {
      console.error('No organization found. Run migrations first: npm run migrate')
      return
    }
    const orgId = orgResult.rows[0].id

    // Check if demo data already exists
    const existing = await client.query("SELECT id FROM users WHERE email = 'demo.candidate@example.com'")
    if (existing.rows.length > 0) {
      console.log('Demo data already exists. Skipping.')
      return
    }

    // Get or create admin
    let adminId: string
    const adminResult = await client.query("SELECT id FROM users WHERE role = 'admin' AND org_id = $1 LIMIT 1", [orgId])
    if (adminResult.rows.length > 0) {
      adminId = adminResult.rows[0].id
    } else {
      const hash = await bcrypt.hash('admin123', 12)
      const r = await client.query(
        "INSERT INTO users (email, password_hash, name, role, org_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        ['demo.admin@example.com', hash, 'Demo Admin', 'admin', orgId]
      )
      adminId = r.rows[0].id
    }

    // Create demo candidate
    const candidateHash = await bcrypt.hash('demo123', 12)
    const candidateResult = await client.query(
      "INSERT INTO users (email, password_hash, name, role, org_id, is_self_registered) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      ['demo.candidate@example.com', candidateHash, 'Priya Mehta', 'candidate', orgId, false]
    )
    const candidateId = candidateResult.rows[0].id

    // Create JD
    const jdResult = await client.query(
      `INSERT INTO job_descriptions (title, description, extracted_text, created_by, org_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        'Senior Frontend Engineer',
        'We are looking for a Senior Frontend Engineer to join our product team.',
        `Senior Frontend Engineer — Product Team

We're looking for a senior frontend engineer to help build our next-generation web platform. You'll work closely with product managers, designers, and backend engineers.

Requirements:
- 5+ years of experience with React and TypeScript
- Strong understanding of state management (Redux, Zustand, or similar)
- Experience with performance optimization and Core Web Vitals
- Familiarity with design systems and component libraries
- Experience with testing (Jest, React Testing Library, Cypress)
- Strong communication skills and ability to mentor junior developers

Nice to have:
- Experience with Next.js or similar SSR frameworks
- GraphQL experience
- CI/CD pipeline experience
- Open source contributions`,
        adminId,
        orgId,
      ]
    )
    const jdId = jdResult.rows[0].id

    // Create CV
    const cvResult = await client.query(
      `INSERT INTO candidate_cvs (candidate_id, file_key, file_name, extracted_text, created_by, org_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        candidateId,
        'demo-cv.txt',
        'priya-mehta-cv.pdf',
        `Priya Mehta
Senior Frontend Developer | 6 years experience
priya.mehta@email.com | Bangalore, India

EXPERIENCE

Senior Frontend Developer — Flipkart (2022–Present)
- Led migration from class components to hooks-based architecture across 40+ components
- Implemented virtual scrolling for product listings, reducing initial render time by 60%
- Built shared component library used by 3 product teams
- Mentored 2 junior developers through code reviews and pair programming

Frontend Developer — Razorpay (2020–2022)
- Built checkout flow handling 50K+ daily transactions
- Implemented A/B testing framework using React context and feature flags
- Reduced bundle size by 35% through code splitting and lazy loading
- Wrote comprehensive test suite with 85% coverage using Jest and RTL

Junior Developer — Freshworks (2018–2020)
- Developed customer support dashboard using React and Redux
- Built real-time notification system using WebSockets
- Contributed to design system with 20+ reusable components

SKILLS
React, TypeScript, Next.js, Redux, Zustand, GraphQL, Jest, Cypress,
Tailwind CSS, Webpack, Vite, Git, CI/CD, Figma, Storybook

EDUCATION
B.Tech Computer Science — VIT Vellore (2018)`,
        adminId,
        orgId,
      ]
    )
    const cvId = cvResult.rows[0].id

    // Create completed interview with evaluation
    const transcript = [
      { role: 'ASSISTANT', text: "Hey hi, good morning! How are you doing today?" },
      { role: 'USER', text: "Hi, I'm doing great, thanks! A little nervous but excited." },
      { role: 'ASSISTANT', text: "Ha, totally normal. So I'm Arjun Patel, I lead the frontend team here. We're building out our product platform and looking for someone senior to help us scale. Anyway, enough about us — tell me, what have you been working on lately?" },
      { role: 'USER', text: "So I've been at Flipkart for the past two and a half years. I'm working on the product catalog team. My main project has been migrating our component library from class-based React to hooks. It's a big codebase — about 40 components that multiple teams depend on." },
      { role: 'ASSISTANT', text: "Oh nice, 40 components. That's a pretty big migration. How did you approach that without breaking things for the other teams?" },
      { role: 'USER', text: "Yeah that was the tricky part. We couldn't just do a big bang rewrite. So I set up a gradual migration strategy — we created wrapper components that maintained the same API surface. The other teams didn't need to change their code. We migrated one component at a time, ran both versions in parallel for a sprint, then deprecated the old one." },
      { role: 'ASSISTANT', text: "Hmm, that's clever. And how did you handle testing during that?" },
      { role: 'USER', text: "We had existing tests for the class components, so for each migration I first wrote the new hooks-based tests, made sure they covered the same scenarios, then ran both test suites until we were confident. We caught a few subtle state bugs that way — like useEffect cleanup timing differences compared to componentWillUnmount." },
      { role: 'ASSISTANT', text: "Oh wait, what kind of bugs?" },
      { role: 'USER', text: "The main one was around event listeners. In the class version, we were removing listeners in componentWillUnmount. But with hooks, if you have a dependency in the useEffect, the cleanup runs on every re-render, not just unmount. We had a memory leak in one component because the cleanup was removing the wrong listener instance. Took us a day to figure out." },
      { role: 'ASSISTANT', text: "Yeah, I've been there. Those useEffect cleanup issues are sneaky. Alright, different topic — you mentioned virtual scrolling for product listings. What was the performance situation before you implemented that?" },
      { role: 'USER', text: "So the product listing page was rendering about 200 items on load. The initial render was taking around 3 seconds on mid-range devices. Users on slower phones were seeing blank screens for even longer. We implemented react-window for virtualization — only rendering the visible items plus a small buffer. That brought the initial render down to about 1.2 seconds." },
      { role: 'ASSISTANT', text: "Nice. How did you measure that — like what metrics were you tracking?" },
      { role: 'USER', text: "We used Core Web Vitals. LCP was our main target — it went from 3.1 seconds to 1.2. We also tracked CLS because the virtual scroll can cause layout shifts if the row heights aren't consistent. We used a fixed row height to avoid that. And we added Lighthouse CI to our pipeline so we could catch regressions." },
      { role: 'ASSISTANT', text: "Got it. Alright, one last thing — you mentioned mentoring junior developers. Can you tell me about that?" },
      { role: 'USER', text: "Sure. I worked closely with two junior devs. Mainly through code reviews — I'd spend time explaining not just what to change, but why. Like, instead of just saying 'use useMemo here', I'd explain when memoization actually helps and when it's premature optimization. We also did pair programming sessions on complex features. One of them is now doing independent feature work, which feels good." },
      { role: 'ASSISTANT', text: "That's great. Alright, I think we covered everything I wanted to go through. Really enjoyed our chat, Priya. Someone from the team will follow up." },
      { role: 'USER', text: "Thank you so much, it was a great conversation!" },
    ]

    const evaluation = {
      categories: [
        {
          name: 'Technical Competency',
          score: 8.5,
          maxScore: 10,
          weight: 30,
          comments: 'Deep understanding of React hooks, performance optimization, and testing. Explained useEffect cleanup edge cases with real-world specificity.',
          evidence: 'Described useEffect cleanup timing bug with event listeners — "the cleanup runs on every re-render, not just unmount" — showing nuanced understanding beyond textbook knowledge.',
          contentScore: 4,
          deliveryScore: 4,
        },
        {
          name: 'Problem Solving',
          score: 8,
          maxScore: 10,
          weight: 25,
          comments: 'Strong systematic approach to the component migration. The wrapper/parallel-run strategy shows good engineering judgment.',
          evidence: 'Migration strategy: "wrapper components that maintained the same API surface... migrated one at a time, ran both versions in parallel for a sprint."',
          contentScore: 4,
          deliveryScore: 3,
        },
        {
          name: 'Communication',
          score: 9,
          maxScore: 10,
          weight: 20,
          comments: 'Exceptionally clear communicator. Structured answers naturally, used concrete numbers, explained trade-offs without being prompted.',
          evidence: 'Voluntarily provided specific metrics: "LCP went from 3.1 seconds to 1.2" and implementation details without needing to be probed.',
          contentScore: 4,
          deliveryScore: 4,
        },
        {
          name: 'Relevant Experience',
          score: 8,
          maxScore: 10,
          weight: 15,
          comments: '6 years with increasing responsibility across three companies. Current work directly relevant — React, TypeScript, component libraries, performance.',
          evidence: 'Flipkart experience with 40-component migration and virtual scrolling directly matches the role requirements.',
          contentScore: 4,
          deliveryScore: 3,
        },
        {
          name: 'Role Fit',
          score: 8.5,
          maxScore: 10,
          weight: 10,
          comments: 'Senior-level thinking demonstrated through mentoring experience and architectural decisions. Good cultural fit — collaborative, teaches well.',
          evidence: 'Mentoring approach: "explaining not just what to change, but why... instead of just saying use useMemo, I\'d explain when it actually helps."',
          contentScore: 4,
          deliveryScore: 4,
        },
      ],
      strengths: [
        'Deep React expertise with real production edge cases (useEffect cleanup timing, virtual scroll CLS handling)',
        'Excellent migration strategy that minimized risk to dependent teams',
        'Strong performance optimization skills backed by measurable results (LCP 3.1s → 1.2s)',
        'Natural mentor — teaches reasoning, not just solutions',
      ],
      weaknesses: [
        'Could have elaborated more on system design and architecture decisions at scale',
        'Limited discussion of GraphQL experience mentioned in resume',
      ],
      overallRating: 8.4,
      overallComments: 'Strong senior frontend candidate with demonstrated depth in React, performance optimization, and team leadership. Clear communicator who backs up claims with specific metrics and real-world examples. Ready for a senior role.',
      recommendation: 'Strong Hire',
      confidenceLevel: 'high',
      confidenceReason: 'Clear, consistent signal across all categories. Candidate provided specific, verifiable examples throughout.',
      hintsNeeded: 0,
      followUpAreas: [
        'System design — discuss architecture for a large-scale frontend application',
        'GraphQL — candidate listed it but wasn\'t asked about it',
        'Team dynamics — how she handles disagreements on technical approach',
      ],
      highlights: [
        { exchangeIndex: 5, type: 'strong', note: 'Wrapper component migration strategy — showed pragmatic engineering judgment' },
        { exchangeIndex: 7, type: 'strong', note: 'Testing approach during migration — running both test suites in parallel to catch regressions' },
        { exchangeIndex: 9, type: 'strong', note: 'Identified subtle useEffect cleanup bug with event listeners — deep React knowledge' },
        { exchangeIndex: 13, type: 'strong', note: 'Proactively mentioned CLS prevention and Lighthouse CI — performance-minded' },
        { exchangeIndex: 15, type: 'strong', note: 'Mentoring philosophy — teaches reasoning over recipes' },
      ],
    }

    const scheduledStart = new Date()
    scheduledStart.setDate(scheduledStart.getDate() - 1) // Yesterday
    const scheduledEnd = new Date(scheduledStart.getTime() + 30 * 60 * 1000)

    await client.query(
      `INSERT INTO interviews (
        candidate_id, jd_id, cv_id, scheduled_by, duration_minutes,
        scheduled_start, scheduled_end, actual_start, actual_end,
        status, overall_rating, score, transcript,
        interviewer_name, persona, adaptive_difficulty, initial_difficulty,
        org_id, candidate_feedback
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )`,
      [
        candidateId, jdId, cvId, adminId, 30,
        scheduledStart.toISOString(), scheduledEnd.toISOString(),
        scheduledStart.toISOString(), scheduledEnd.toISOString(),
        'completed', evaluation.overallRating, JSON.stringify(evaluation), JSON.stringify(transcript),
        'Arjun Patel', 'friendly', true, 'moderate',
        orgId,
        JSON.stringify({
          summary: 'Great interview! You demonstrated solid knowledge and communicated your ideas well.',
          communicationTips: ['Keep practicing with real-world examples — your storytelling is already strong'],
          technicalTips: ['Consider diving deeper into system design patterns for senior-level discussions'],
          whatWentWell: ['Strong performance in technical competency', 'Excellent communication throughout', 'Great mentoring examples'],
        }),
      ]
    )

    console.log('')
    console.log('  ╔══════════════════════════════════════════════════╗')
    console.log('  ║              DEMO DATA CREATED                  ║')
    console.log('  ╠══════════════════════════════════════════════════╣')
    console.log('  ║                                                  ║')
    console.log('  ║  Candidate: Priya Mehta                         ║')
    console.log('  ║  Position:  Senior Frontend Engineer            ║')
    console.log('  ║  Score:     8.4/10 — Strong Hire                ║')
    console.log('  ║                                                  ║')
    console.log('  ║  Log in as admin to view the full evaluation,   ║')
    console.log('  ║  PDF report, and transcript.                    ║')
    console.log('  ╚══════════════════════════════════════════════════╝')
    console.log('')
  } finally {
    client.release()
    await pool.end()
  }
}

seedDemo().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
