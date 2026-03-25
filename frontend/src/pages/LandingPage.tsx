import { Link } from 'react-router-dom'
import { Focus, Mic, BarChart3, ShieldCheck, Clock, Users, Zap, ArrowRight, ChevronRight } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white antialiased">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-indigo-100/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Focus className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">SkillLens</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                Log in
              </button>
            </Link>
            <Link to="/register">
              <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm shadow-indigo-200">
                Get started free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/80 via-white to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-br from-indigo-100/40 via-violet-50/30 to-transparent rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 pt-32 pb-20 md:pt-44 md:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-[13px] font-medium text-indigo-700 mb-6">
              <Zap className="h-3.5 w-3.5" />
              Voice-based AI interviews for software teams
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-[1.15] md:text-[56px]">
              Your first-round interviews,
              <span className="text-indigo-600"> handled.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
              SkillLens conducts screening interviews that sound like a real colleague.
              You get scored evaluations with evidence — so your team can focus on
              final-round decisions, not phone screens.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/register">
                <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-[15px] font-semibold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50 cursor-pointer">
                  Start scheduling interviews
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">Free to start. No credit card needed.</p>
          </div>
        </div>
      </section>

      {/* Metrics bar */}
      <section className="border-y border-slate-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">Voice</p>
                <p className="text-[13px] text-slate-500">Real conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">Scored</p>
                <p className="text-[13px] text-slate-500">Evidence-based reports</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">Secure</p>
                <p className="text-[13px] text-slate-500">Proctoring built in</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">24/7</p>
                <p className="text-[13px] text-slate-500">Always available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">How SkillLens works</h2>
          <p className="mt-3 text-base text-slate-500 max-w-lg mx-auto">
            Three steps from job description to scored evaluation
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              num: '1',
              title: 'Upload and schedule',
              desc: 'Add the job description and candidate resume. Choose the interview date, interviewer style, and difficulty level. The candidate receives an email with login credentials.',
              color: 'bg-indigo-600',
            },
            {
              num: '2',
              title: 'AI conducts the interview',
              desc: 'The candidate joins a voice conversation — small talk, intro, technical questions, follow-ups. The AI adapts in real time. Admins can monitor live.',
              color: 'bg-violet-600',
            },
            {
              num: '3',
              title: 'Review and decide',
              desc: 'Get a detailed report with per-category scores, transcript evidence, strengths, weaknesses, and a clear recommendation. Download as PDF or email to your panel.',
              color: 'bg-emerald-600',
            },
          ].map((item) => (
            <div key={item.num} className="rounded-2xl border border-slate-200/70 bg-white p-7 hover:shadow-lg hover:shadow-slate-100 transition-shadow">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color} text-white text-sm font-bold mb-5`}>
                {item.num}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-[14px] leading-[1.75] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="bg-gradient-to-b from-slate-50/80 to-white border-y border-slate-200/70">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Built for real hiring</h2>
            <p className="mt-3 text-base text-slate-500 max-w-lg mx-auto">
              Not a toy demo — a production tool your team can rely on
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Mic, title: 'Natural voice conversation', desc: 'Back-and-forth dialogue with follow-ups, not a scripted Q&A. The AI digs deeper on good answers and moves on when candidates struggle.' },
              { icon: BarChart3, title: 'Content vs delivery scoring', desc: 'Knowledge and communication scored separately. A nervous candidate with great answers gets credit for both.' },
              { icon: Users, title: 'Three interviewer styles', desc: 'Friendly, direct, or rapid-fire. Match the style to your team culture or vary it between candidates.' },
              { icon: ShieldCheck, title: 'Integrity monitoring', desc: 'Webcam proctoring, response timing analysis, and conversation guardrails detect external help and off-topic behavior.' },
              { icon: Clock, title: 'Adaptive difficulty', desc: 'Questions adjust based on responses. Strong answers lead to deeper probes. Struggling candidates get simpler questions.' },
              { icon: Zap, title: 'Practice mode for candidates', desc: 'Candidates can take a practice run before the real interview to get comfortable with the voice format.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200/70 bg-white p-6 hover:border-slate-300/80 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-4">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-[13px] leading-[1.75] text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 py-14 md:px-14 relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-lg">
              <h2 className="text-2xl font-bold text-white leading-[1.25] md:text-3xl">
                Stop spending engineering hours on screening calls.
              </h2>
              <p className="mt-3 text-[15px] leading-[1.65] text-indigo-200">
                Set up your first interview in under 5 minutes.
              </p>
            </div>
            <Link to="/register">
              <button className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[15px] font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-lg cursor-pointer whitespace-nowrap">
                Get started free
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/70">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Focus className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-slate-900">SkillLens</span>
          </div>
          <div className="flex items-center gap-6 text-[13px] text-slate-400">
            <span>&copy; 2026 SkillLens</span>
            <span className="hidden sm:inline">&middot;</span>
            <span className="hidden sm:inline">Built for hiring teams</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
