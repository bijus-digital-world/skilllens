import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Focus, Mic, Shield, BarChart3, Clock, Users, ArrowRight } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Focus className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold text-slate-900">SkillLens</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Try it free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-[1.15]">
            Your first-round interviews,<br />handled.
          </h1>
          <p className="mt-5 text-base text-slate-500 leading-relaxed max-w-lg">
            SkillLens runs voice-based screening interviews for software roles.
            Candidates talk to an AI that sounds like a real interviewer.
            You get a scored evaluation with evidence from the conversation.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/register">
              <Button size="lg">Start scheduling interviews</Button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-400">No setup fee. Works with any role.</p>
        </div>
      </section>

      {/* What you get */}
      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-8">What you get</p>
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <Mic className="h-5 w-5 text-slate-700 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">Real voice conversations</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                Not a quiz. Not a chatbot. The AI has a natural back-and-forth conversation
                with follow-up questions based on what the candidate actually says.
              </p>
            </div>
            <div>
              <BarChart3 className="h-5 w-5 text-slate-700 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">Evaluation that's useful</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                Each interview produces a report with per-category scores,
                specific evidence from the transcript, and a clear hire/no-hire call.
                Content and delivery scored separately — so nervousness doesn't mask knowledge.
              </p>
            </div>
            <div>
              <Shield className="h-5 w-5 text-slate-700 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">Built-in integrity checks</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                Proctoring, response timing analysis, and conversation guardrails
                are on by default. You'll know if something looks off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-8">How it works</p>
        <div className="space-y-8 max-w-lg">
          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">1</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Upload a job description and candidate resume</p>
              <p className="mt-1 text-sm text-slate-500">PDF, DOCX, or plain text. The AI reads them and tailors the interview accordingly.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">2</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Schedule and send the invite</p>
              <p className="mt-1 text-sm text-slate-500">Pick a time, interview style, and difficulty. The candidate gets an email with login credentials.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">3</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Review the evaluation</p>
              <p className="mt-1 text-sm text-slate-500">Scores, evidence, strengths, weaknesses, follow-up topics for the next round. Download as PDF or copy the summary into an email.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-8">The details</p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <Clock className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900">Runs any time</p>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Interviews happen on the candidate's schedule. No coordination needed between your team and the candidate's availability.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <Users className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900">Team access</p>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Multiple admins can schedule, review, and compare candidates. Live monitoring lets you watch interviews in progress.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <Mic className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900">Adjusts to the candidate</p>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                If someone's doing well, the questions get harder. If they're struggling, it dials back. Three interviewer styles: friendly, direct, or fast-paced.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <BarChart3 className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900">Practice mode</p>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Candidates can sign up and take a practice interview to get comfortable with the format before the real thing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-2xl bg-slate-900 px-8 py-12 md:px-12">
          <div className="max-w-lg">
            <h2 className="text-2xl font-bold text-white">Stop spending engineering hours on screening calls.</h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Set up your first interview in under 5 minutes. Upload a JD, pick a candidate, and let SkillLens handle the conversation.
            </p>
            <div className="mt-6">
              <Link to="/register">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  Get started <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">SkillLens</span>
          </div>
          <p className="text-xs text-slate-400">&copy; 2026</p>
        </div>
      </footer>
    </div>
  )
}
