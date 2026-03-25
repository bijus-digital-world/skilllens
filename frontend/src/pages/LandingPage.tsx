import { Link } from 'react-router-dom'
import { Focus, ArrowRight } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white antialiased">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Focus className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-slate-900">SkillLens</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <button className="rounded-lg px-4 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-900 cursor-pointer">
                Log in
              </button>
            </Link>
            <Link to="/register">
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 cursor-pointer">
                Get started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="max-w-[620px]">
            <p className="mb-4 text-[13px] font-semibold tracking-wide text-indigo-600">
              Screening interviews, automated
            </p>
            <h1 className="text-[36px] font-bold leading-[1.15] tracking-[-0.02em] text-slate-900 md:text-[52px]">
              Your first-round interviews, handled.
            </h1>
            <p className="mt-5 max-w-[480px] text-[16px] leading-[1.7] text-slate-500">
              SkillLens runs voice-based screening interviews for software roles.
              Candidates talk to an AI that sounds like a colleague, not a bot.
              You get a scored report with evidence from the actual conversation.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link to="/register">
                <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-indigo-700 cursor-pointer">
                  Start scheduling
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
              <Link to="/login">
                <button className="rounded-lg border border-slate-200 px-5 py-2.5 text-[14px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 cursor-pointer">
                  Sign in
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="border-y border-slate-200/60 bg-slate-50/50">
        <div className="mx-auto max-w-[1100px] px-6 py-20 md:py-24">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400 mb-10">
            What you get
          </p>
          <div className="grid gap-12 md:grid-cols-3 md:gap-10">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Voice interviews that feel real</h3>
              <p className="text-[14px] leading-[1.75] text-slate-500">
                Not a chatbot. Not a quiz. A natural back-and-forth where the AI
                listens, follows up on interesting answers, and adjusts difficulty
                based on how the candidate is doing.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Reports your team can act on</h3>
              <p className="text-[14px] leading-[1.75] text-slate-500">
                Each interview produces a structured evaluation — scores per category,
                evidence quoted from the transcript, content vs delivery breakdown,
                and a clear recommendation. Download the PDF or email the summary.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Integrity built in</h3>
              <p className="text-[14px] leading-[1.75] text-slate-500">
                Webcam proctoring, response timing analysis, and conversation
                guardrails run by default. If a candidate uses external help
                or goes off-topic, you'll see it in the report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1100px] px-6 py-20 md:py-24">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400 mb-10">
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
              className={`py-2 px-6 first:pl-0 last:pr-0 ${i < 2 ? 'md:border-r md:border-slate-200/60' : ''}`}
            >
              <span className="text-[12px] font-semibold text-indigo-600/50 mb-3 block">{item.step}</span>
              <h3 className="text-[15px] font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-[14px] leading-[1.75] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Details */}
      <section className="border-y border-slate-200/60 bg-slate-50/50">
        <div className="mx-auto max-w-[1100px] px-6 py-20 md:py-24">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400 mb-10">
            The details
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Three interviewer styles',
                desc: 'Friendly and conversational. Direct and no-nonsense. Fast-paced rapid-fire. Pick the one that matches your team\'s culture.',
              },
              {
                title: 'Works for any software role',
                desc: 'Frontend, backend, full-stack, DevOps, data, mobile. Junior to lead. The AI reads the JD and resume, then asks relevant questions.',
              },
              {
                title: 'Candidates can practice first',
                desc: 'Candidates sign up and take a shorter practice interview to get comfortable with the format before the real thing.',
              },
              {
                title: 'Runs on any schedule',
                desc: 'Interviews happen whenever the candidate is ready — early morning, late night, weekends. No coordination needed with your team.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200/80 bg-white p-6">
                <h3 className="text-[14px] font-semibold text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-[13px] leading-[1.75] text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1100px] px-6 py-20 md:py-24">
        <div className="rounded-2xl bg-slate-900 px-8 py-12 md:px-12">
          <div className="max-w-md">
            <h2 className="text-[22px] font-bold text-white leading-[1.25] md:text-[26px]">
              Stop spending engineering hours on screening calls.
            </h2>
            <p className="mt-3 text-[14px] leading-[1.65] text-slate-400">
              Upload a JD, schedule a candidate, and get a scored evaluation
              back — without pulling anyone off their sprint.
            </p>
            <div className="mt-7">
              <Link to="/register">
                <button className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[14px] font-medium text-slate-900 transition-colors hover:bg-slate-100 cursor-pointer">
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60">
        <div className="mx-auto max-w-[1100px] px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="h-3.5 w-3.5 text-slate-300" />
            <span className="text-[12px] font-medium text-slate-400">SkillLens</span>
          </div>
          <p className="text-[11px] text-slate-300">&copy; 2026</p>
        </div>
      </footer>
    </div>
  )
}
