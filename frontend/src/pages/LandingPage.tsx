import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Focus, ArrowRight } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white antialiased">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[#09090b]">
              <Focus className="h-3.5 w-3.5" />
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">SkillLens</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <button className="rounded-md px-3.5 py-1.5 text-[13px] font-medium text-white/60 transition-colors hover:text-white cursor-pointer">
                Log in
              </button>
            </Link>
            <Link to="/register">
              <button className="rounded-md bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#09090b] transition-colors hover:bg-white/90 cursor-pointer">
                Get started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-44 md:pb-32">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-[300px] left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-indigo-500/[0.07] blur-[120px]" />
        <div className="pointer-events-none absolute top-[100px] -right-[200px] h-[400px] w-[400px] rounded-full bg-violet-500/[0.05] blur-[100px]" />

        <div className="relative mx-auto max-w-[1100px] px-6">
          <div className="max-w-[640px]">
            <p className="mb-5 text-[13px] font-medium tracking-wide text-indigo-400">
              Screening interviews, automated
            </p>
            <h1 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-white md:text-[56px]">
              Your first-round interviews, handled.
            </h1>
            <p className="mt-5 max-w-[480px] text-[16px] leading-[1.65] text-white/40">
              SkillLens runs voice-based screening interviews for software roles.
              Candidates talk to an AI that sounds like a colleague, not a bot.
              You get a scored report with evidence from the actual conversation.
            </p>
            <div className="mt-9 flex items-center gap-3">
              <Link to="/register">
                <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-indigo-500 cursor-pointer">
                  Start scheduling
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
              <Link to="/login">
                <button className="rounded-lg border border-white/[0.08] px-5 py-2.5 text-[14px] font-medium text-white/50 transition-colors hover:text-white hover:border-white/20 cursor-pointer">
                  Sign in
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="h-px bg-white/[0.06]" />
      </div>

      {/* What it does */}
      <section className="mx-auto max-w-[1100px] px-6 py-24 md:py-32">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/25 mb-12">
          What you get
        </p>
        <div className="grid gap-16 md:grid-cols-3 md:gap-12">
          <div>
            <h3 className="text-[15px] font-semibold text-white/90 mb-2.5">Voice interviews that feel real</h3>
            <p className="text-[14px] leading-[1.7] text-white/35">
              Not a chatbot. Not a quiz. A natural back-and-forth where the AI
              listens, follows up on interesting answers, and adjusts difficulty
              based on how the candidate is doing.
            </p>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-white/90 mb-2.5">Reports your team can act on</h3>
            <p className="text-[14px] leading-[1.7] text-white/35">
              Each interview produces a structured evaluation — scores per category,
              evidence quoted from the transcript, content vs delivery breakdown,
              and a clear recommendation. Copy it into an email or download the PDF.
            </p>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-white/90 mb-2.5">Integrity built in</h3>
            <p className="text-[14px] leading-[1.7] text-white/35">
              Webcam proctoring, response timing analysis, and conversation
              guardrails run by default. If a candidate uses external help
              or goes off-topic, you'll see it in the report.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="h-px bg-white/[0.06]" />
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-[1100px] px-6 py-24 md:py-32">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/25 mb-12">
          How it works
        </p>
        <div className="grid gap-0 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Upload and schedule',
              desc: 'Add the job description and candidate resume. Pick the interview date, style, and difficulty. The candidate gets an email with login credentials.',
            },
            {
              step: '02',
              title: 'The AI runs the interview',
              desc: 'The candidate joins a voice conversation — greeting, intro, technical questions, follow-ups. The AI adapts in real time. Admins can watch live.',
            },
            {
              step: '03',
              title: 'Review and share',
              desc: 'Get a scored evaluation with specific evidence from the transcript. Share the summary with your hiring panel or download it as a PDF.',
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className={`p-8 ${i < 2 ? 'md:border-r md:border-white/[0.06]' : ''}`}
            >
              <span className="text-[12px] font-medium text-indigo-400/60 mb-4 block">{item.step}</span>
              <h3 className="text-[15px] font-semibold text-white/90 mb-2.5">{item.title}</h3>
              <p className="text-[14px] leading-[1.7] text-white/35">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="h-px bg-white/[0.06]" />
      </div>

      {/* Details — Bento grid */}
      <section className="mx-auto max-w-[1100px] px-6 py-24 md:py-32">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/25 mb-12">
          The details
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-7">
            <h3 className="text-[14px] font-semibold text-white/80 mb-2">Three interviewer styles</h3>
            <p className="text-[13px] leading-[1.7] text-white/30">
              Friendly and conversational. Direct and no-nonsense. Fast-paced rapid-fire.
              Pick the one that matches your team's culture, or rotate between candidates.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-7">
            <h3 className="text-[14px] font-semibold text-white/80 mb-2">Works for any software role</h3>
            <p className="text-[13px] leading-[1.7] text-white/30">
              Frontend, backend, full-stack, DevOps, data, mobile. Junior to lead.
              The AI reads the JD and resume, then asks relevant questions at the right level.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-7">
            <h3 className="text-[14px] font-semibold text-white/80 mb-2">Candidates can practice first</h3>
            <p className="text-[13px] leading-[1.7] text-white/30">
              Candidates sign up and take a shorter practice interview to get comfortable
              with the format. The real interview is scheduled by your team.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-7">
            <h3 className="text-[14px] font-semibold text-white/80 mb-2">Runs on your schedule</h3>
            <p className="text-[13px] leading-[1.7] text-white/30">
              Interviews happen whenever the candidate is ready — early morning,
              late night, weekends. No coordination needed with your engineering team.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1100px] px-6 pb-24 md:pb-32">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] px-8 py-14 md:px-14">
          {/* Glow */}
          <div className="pointer-events-none absolute -top-[100px] -right-[100px] h-[300px] w-[300px] rounded-full bg-indigo-500/[0.08] blur-[80px]" />

          <div className="relative max-w-md">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white/90 leading-[1.2] md:text-[28px]">
              Stop spending engineering hours on screening calls.
            </h2>
            <p className="mt-3 text-[14px] leading-[1.6] text-white/30">
              Upload a JD, schedule a candidate, and get a scored evaluation
              back — without pulling anyone off their sprint.
            </p>
            <div className="mt-7">
              <Link to="/register">
                <button className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[14px] font-medium text-[#09090b] transition-colors hover:bg-white/90 cursor-pointer">
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-[1100px] px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="h-3 w-3 text-white/20" />
            <span className="text-[12px] font-medium text-white/20">SkillLens</span>
          </div>
          <p className="text-[11px] text-white/15">&copy; 2026</p>
        </div>
      </footer>
    </div>
  )
}
