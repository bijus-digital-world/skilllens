import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  CalendarDays,
  ClipboardList,
  Sparkles,
  Shield,
  Radio,
} from 'lucide-react'

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/admin/job-descriptions', icon: FileText, label: 'Job Descriptions' },
      { to: '/admin/cvs', icon: Users, label: 'Candidate CVs' },
    ],
  },
  {
    label: 'Interviews',
    items: [
      { to: '/admin/interviews', icon: ClipboardList, label: 'All Interviews' },
      { to: '/admin/schedule', icon: CalendarDays, label: 'Schedule New' },
      { to: '/admin/compare', icon: Users, label: 'Compare Candidates' },
      { to: '/admin/live', icon: Radio, label: 'Live Monitor' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/admin/profiles', icon: Shield, label: 'Eval Profiles' },
      { to: '/admin/team', icon: Users, label: 'Team' },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { to: '/admin/questions', icon: Sparkles, label: 'Question Generator' },
    ],
  },
]

export function AdminLayout() {
  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <nav className="w-60 shrink-0">
        <div className="sticky top-24 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 no-underline',
                          isActive
                            ? 'bg-primary/8 text-primary shadow-xs'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Page Content */}
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
