import { Focus } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Focus className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">SkillLens</span>
          </div>
        </div>

        <div className="relative z-10 space-y-5">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Screening interviews,<br />automated.
          </h1>
          <p className="text-[15px] text-indigo-200 leading-relaxed max-w-sm">
            Voice-based AI interviews for software roles. Upload a JD, schedule a candidate, get a scored evaluation with evidence from the conversation.
          </p>
          <div className="flex gap-10 pt-3">
            <div>
              <p className="text-2xl font-bold">Voice</p>
              <p className="text-xs text-indigo-300 mt-0.5">Real conversations</p>
            </div>
            <div>
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-indigo-300 mt-0.5">Always available</p>
            </div>
            <div>
              <p className="text-2xl font-bold">Scored</p>
              <p className="text-xs text-indigo-300 mt-0.5">With evidence</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-indigo-400">&copy; 2026 SkillLens. All rights reserved.</p>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Focus className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">SkillLens</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
