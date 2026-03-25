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
      <div className="hidden lg:flex lg:w-[440px] xl:w-[500px] flex-col justify-between bg-slate-900 p-12 text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <Focus className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">SkillLens</span>
          </div>
        </div>

        <div className="space-y-5">
          <h1 className="text-3xl font-bold leading-tight">
            First-round interviews,<br />without the bottleneck.
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            SkillLens conducts voice-based screening interviews for software roles.
            Upload a JD, schedule a candidate, and get a scored evaluation back.
          </p>
        </div>

        <p className="text-xs text-slate-600">&copy; 2026 SkillLens</p>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Focus className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold text-slate-900">SkillLens</span>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
