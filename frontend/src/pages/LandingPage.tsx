import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Focus, Mic, Shield, BarChart3, Clock, Users, Sparkles, CheckCircle } from 'lucide-react'

const features = [
  { icon: Mic, title: 'Voice Interviews', desc: 'Natural bidirectional voice conversations powered by AI — candidates feel like they are talking to a real person' },
  { icon: Sparkles, title: 'Adaptive Difficulty', desc: 'Questions adjust in real-time based on candidate responses — challenging but never overwhelming' },
  { icon: BarChart3, title: 'Deep Evaluation', desc: 'Content vs delivery scoring, evidence-based assessment, seniority-calibrated rubrics with follow-up recommendations' },
  { icon: Shield, title: 'Integrity Monitoring', desc: 'Proctoring, response timing analysis, content guardrails, and AI-cheating detection built in' },
  { icon: Clock, title: 'Always Available', desc: 'Interviews run 24/7 — no scheduling conflicts, no interviewer fatigue, consistent experience every time' },
  { icon: Users, title: 'Team Collaboration', desc: 'Multi-admin support, candidate comparison, shareable reports, and email summaries for hiring panels' },
]

const stats = [
  { value: '10x', label: 'Faster screening' },
  { value: '24/7', label: 'Always available' },
  { value: '90%', label: 'Candidate satisfaction' },
  { value: '$0', label: 'Interviewer fatigue' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Focus className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">SkillLens</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Interview Platform
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            Conduct Level 1 interviews<br />
            <span className="text-indigo-600">without an interviewer</span>
          </h1>
          <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
            SkillLens conducts natural voice interviews that feel human. Adaptive questioning,
            real-time evaluation, and detailed reports — so your team can focus on final-round
            decisions instead of screening.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900">Everything you need for Level 1 screening</h2>
          <p className="mt-3 text-slate-500">From scheduling to evaluation — fully automated</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-500">Three steps to better hiring</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '1', title: 'Upload & Schedule', desc: 'Upload the job description and candidate CV. Pick a date, persona, and difficulty level. The AI does the rest.' },
              { step: '2', title: 'AI Conducts Interview', desc: 'The candidate joins a voice interview that feels like talking to a real person. Adaptive questions, natural conversation flow.' },
              { step: '3', title: 'Review & Decide', desc: 'Get a detailed evaluation with scores, evidence, strengths, weaknesses, and a clear hire/no-hire recommendation.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SkillLens */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900">Why teams choose SkillLens</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
          {[
            'Interviews that sound human — not robotic Q&A',
            'Consistent evaluation across all candidates',
            'No interviewer bias — fair, evidence-based scoring',
            'Works across all software roles and levels',
            'Practice mode for candidates to prepare',
            'Detailed reports with follow-up recommendations',
            'Content vs delivery scoring — nervousness doesn\'t penalize knowledge',
            'Conversation guardrails and integrity monitoring',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 p-4">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to transform your hiring?</h2>
          <p className="mt-4 text-indigo-200 max-w-xl mx-auto">
            Start conducting AI-powered interviews today. No credit card required.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 px-8">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-900">SkillLens</span>
          </div>
          <p className="text-xs text-slate-400">&copy; 2026 SkillLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
