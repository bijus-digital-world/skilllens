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
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Focus className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">SkillLens</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            AI-Powered<br />Interview Intelligence
          </h1>
          <p className="text-lg text-indigo-200 leading-relaxed max-w-sm">
            Evaluate candidates with precision. Generate tailored questions, conduct voice interviews, and get instant AI-powered assessments.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold">10x</p>
              <p className="text-sm text-indigo-300">Faster screening</p>
            </div>
            <div>
              <p className="text-3xl font-bold">AI</p>
              <p className="text-sm text-indigo-300">Powered evaluation</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-indigo-300">Always available</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-indigo-300">&copy; 2026 SkillLens. All rights reserved.</p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <Focus className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">SkillLens</span>
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
