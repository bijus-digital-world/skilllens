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
      <div className="hidden lg:flex lg:w-[460px] xl:w-[520px] flex-col justify-between bg-[#09090b] p-12 text-white relative overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -bottom-[200px] -left-[100px] h-[400px] w-[400px] rounded-full bg-indigo-500/[0.06] blur-[100px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.08]">
              <Focus className="h-4 w-4 text-white/70" />
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">SkillLens</span>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-white/90">
            First-round interviews,<br />without the bottleneck.
          </h1>
          <p className="text-[14px] leading-[1.65] text-white/30 max-w-[340px]">
            Voice-based screening interviews for software roles.
            Upload a JD, schedule a candidate, get a scored evaluation.
          </p>
        </div>

        <p className="relative z-10 text-[11px] text-white/15">&copy; 2026 SkillLens</p>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#09090b] text-white">
              <Focus className="h-3.5 w-3.5" />
            </div>
            <span className="text-[15px] font-semibold text-slate-900">SkillLens</span>
          </div>

          <div className="mb-7">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-slate-900">{title}</h2>
            <p className="mt-1 text-[14px] text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
