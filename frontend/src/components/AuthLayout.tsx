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
      <div className="hidden lg:flex lg:w-[460px] xl:w-[520px] flex-col justify-between bg-slate-900 p-12 text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Focus className="h-4 w-4 text-white/80" />
            </div>
            <span className="text-[15px] font-semibold">SkillLens</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-[26px] font-bold leading-[1.2] tracking-[-0.01em]">
            First-round interviews,<br />without the bottleneck.
          </h1>
          <p className="text-[14px] leading-[1.7] text-slate-400 max-w-[340px]">
            Voice-based screening interviews for software roles.
            Upload a JD, schedule a candidate, get a scored evaluation.
          </p>
        </div>

        <p className="text-[11px] text-slate-600">&copy; 2026 SkillLens</p>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Focus className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-slate-900">SkillLens</span>
          </div>

          <div className="mb-7">
            <h2 className="text-[20px] font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-[14px] text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
