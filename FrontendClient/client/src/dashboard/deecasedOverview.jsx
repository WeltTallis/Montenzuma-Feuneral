use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
    Building2,
    LayoutDashboard,
    Activity,
    Users,
    MapPin,
    CalendarClock,
    Truck,
    FileBarChart,
    Settings,
    Search,
    Bell,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Heart,
    ArrowDownToLine,
    ArrowUpFromLine,
    Flame,
    Radio,
    Share2,
    ChevronDown,
    Plus,
    Clock,
    Bell as BellIcon,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/* Sidebar nav + dummy data                                                  */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true, badge: null },
    { id: 'operations', label: 'Operations', icon: Activity, badge: null },
    { id: 'deceased', label: 'Deceased Records', icon: Users, badge: '4' },
    { id: 'branches', label: 'Branches', icon: MapPin, badge: null },
    { id: 'schedule', label: 'Schedule', icon: CalendarClock, badge: null },
    { id: 'hearse', label: 'Hearse Fleet', icon: Truck, badge: '8' },
    { id: 'reports', label: 'Reports', icon: FileBarChart, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
] as const

// KPI cards data — like the 3 course cards in designs1
const KPIS = [
    {
        title: 'Total In Care',
        subtitle: 'across 3 branches',
        icon: Heart,
        iconBg: 'bg-rose-100 text-rose-600',
        badge: { text: '+2 today', bg: 'bg-emerald-100 text-emerald-700' },
        completedDots: 5,
        totalDots: 7,
        percent: 75,
        bigValue: '12',
        bigLabel: 'cases',
    },
    {
        title: 'Pending Intakes',
        subtitle: 'awaiting documentation',
        icon: ArrowDownToLine,
        iconBg: 'bg-amber-100 text-amber-700',
        badge: { text: '2 urgent', bg: 'bg-rose-100 text-rose-700' },
        completedDots: 3,
        totalDots: 7,
        percent: 43,
        bigValue: '5',
        bigLabel: 'cases',
    },
    {
        title: 'Released Today',
        subtitle: 'releases completed',
        icon: ArrowUpFromLine,
        iconBg: 'bg-emerald-100 text-emerald-700',
        badge: { text: 'On track', bg: 'bg-sky-100 text-sky-700' },
        completedDots: 4,
        totalDots: 7,
        percent: 57,
        bigValue: '3',
        bigLabel: 'cases',
    },
] as const

// Today's operations — two colored cards like Home Tasks
const TASK_CARDS = [
    {
        title: 'Urgent Cases',
        description:
            'Two pending intakes flagged urgent across branches. Driver unassigned — needs immediate attention before scheduled transfer window closes.',
        metaTitle: 'View urgent queue',
        dueLabel: 'Due today, 18:00',
        badge: { text: 'Urgent', icon: Flame, bg: 'bg-rose-500 text-white' },
        avatars: [
            { initials: 'PO', color: 'bg-rose-500' },
            { initials: 'SW', color: 'bg-amber-500' },
            { initials: 'DM', color: 'bg-emerald-500' },
        ],
        tone: 'dark' as const,
    },
    {
        title: 'Today\'s Releases',
        description:
            'Three releases scheduled across Nairobi, Machakos, and Thika. All paperwork signed off and hearses confirmed. Family viewing at 11:30.',
        metaTitle: 'View release roster',
        dueLabel: 'Due today, 14:00',
        badge: { text: 'Live', icon: Radio, bg: 'bg-orange-500 text-white' },
        avatars: [
            { initials: 'HK', color: 'bg-rose-500' },
            { initials: 'JM', color: 'bg-amber-500' },
            { initials: 'GK', color: 'bg-emerald-500' },
        ],
        tone: 'yellow' as const,
    },
] as const

// Recent activity row — like the Assignments section in designs1
const RECENT_ACTIVITY = {
    title: 'Award Show discussion',
    assignee: 'Melissa Anderson',
    assigneeInitials: 'MA',
    assigneeColor: 'bg-[#f4d03f] text-[#1a1d29]',
    date: '20 June 2024',
    time: '12:30',
    duration: '02 h 45 m',
    branch: 'Nairobi HQ',
}

// Today's schedule — right sidebar items
const SCHEDULE_ITEMS = [
    {
        date: '19 Oct',
        time: '09:00 - 11:00',
        event: 'Sketching',
        sub: 'Intake — J. Mutiso',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
    },
    {
        date: '19 Oct',
        time: '14:30 - 16:00',
        event: 'History of Art',
        sub: 'Release — E. Kamau',
        bg: 'bg-white',
        border: 'border-zinc-200',
    },
] as const

const REMINDERS = [
    {
        title: 'Art : Sand Tool',
        date: '18 June 2024',
        day: 'Friday',
        icon: BellIcon,
        iconBg: 'bg-sky-100 text-sky-600',
    },
    {
        title: 'Call KNH mortuary',
        date: '19 June 2024',
        day: 'Tuesday',
        icon: BellIcon,
        iconBg: 'bg-rose-100 text-rose-600',
    },
] as const

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Home() {
    const today = new Date()
    const todayDate = today.getDate()
    const monthName = today.toLocaleString('default', { month: 'long' })
    const year = today.getFullYear()
    const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate()
    const firstDay = new Date(year, today.getMonth(), 1).getDay()

    return (
        <div className="min-h-screen bg-[#f5f6fa] text-[#1a1d29]">
            <div className="mx-auto flex min-h-screen max-w-[1440px]">
                {/* ---------------- LEFT SIDEBAR ---------------- */}
                <aside className="sticky top-0 hidden w-[240px] shrink-0 flex-col bg-[#1a1d29] p-5 text-white lg:flex">
                    <div className="flex items-center gap-2.5 px-2 pb-8">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f4d03f] text-[#1a1d29]">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-sm font-bold tracking-tight">FOREVERCARE</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/50">Funeral Home</p>
                        </div>
                    </div>

                    <nav className="flex flex-1 flex-col gap-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.id}
                                    className={cn(
                                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        item.active
                                            ? 'bg-[#f4d03f] text-[#1a1d29]'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white',
                                    )}
                                >
                                    <Icon className="h-[18px] w-[18px]" />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.badge && (
                                        <span
                                            className={cn(
                                                'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                                                item.active ? 'bg-[#1a1d29] text-white' : 'bg-rose-500 text-white',
                                            )}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Help center widget */}
                    <div className="mt-6 rounded-xl bg-[#252836] p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f4d03f] text-[#1a1d29]">
                            <HelpCircle className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-white">Help center</p>
                        <p className="mt-1 text-xs text-white/50">
                            Need help with an intake, transfer, or release?
                        </p>
                        <Button
                            size="sm"
                            className="mt-3 w-full rounded-full bg-white text-[#1a1d29] hover:bg-white/90"
                        >
                            Ask help center
                        </Button>
                    </div>
                </aside>

                {/* ---------------- MAIN + RIGHT SIDEBAR ---------------- */}
                <div className="flex min-w-0 flex-1 flex-col">
                    {/* Top bar */}
                    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-5 lg:px-8">
                        <div>
                            <h1 className="text-2xl font-bold leading-tight tracking-tight">
                                Hello, Melissa <span className="inline-block">👋</span>
                            </h1>
                            <p className="text-sm text-zinc-500">Let&apos;s care for them with dignity today.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative hidden sm:block">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    placeholder="Search for cases, references, branches…"
                                    className="h-10 w-[300px] rounded-lg border-zinc-200 bg-[#f5f6fa] pl-9 text-sm"
                                />
                            </div>
                            <button
                                aria-label="Notifications"
                                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                            >
                                <Bell className="h-5 w-5" />
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                            </button>
                        </div>
                    </header>

                    {/* Main + right sidebar layout */}
                    <div className="flex flex-1 flex-col lg:flex-row">
                        {/* MAIN CONTENT */}
                        <main className="min-w-0 flex-1 px-6 py-6 lg:px-8">
                            {/* Section 1: My KPIs (3 cards like course cards in designs1) */}
                            <section className="mb-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-bold tracking-tight">Today&apos;s KPIs</h2>
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="flex gap-2">
                                            <button className="font-medium text-zinc-900 underline underline-offset-4">All</button>
                                            <button className="text-zinc-400 hover:text-zinc-700">Active</button>
                                            <button className="text-zinc-400 hover:text-zinc-700">Completed</button>
                                        </div>
                                        <button className="font-medium text-zinc-500 hover:text-zinc-900">See all</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {KPIS.map((kpi) => {
                                        const Icon = kpi.icon
                                        return (
                                            <Card
                                                key={kpi.title}
                                                className="border-zinc-200 bg-white shadow-sm"
                                            >
                                                <CardContent className="p-5">
                                                    {/* Header: icon + title + badge */}
                                                    <div className="mb-4 flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={cn(
                                                                    'flex h-10 w-10 items-center justify-center rounded-xl',
                                                                    kpi.iconBg,
                                                                )}
                                                            >
                                                                <Icon className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold tracking-tight">{kpi.title}</p>
                                                                <p className="text-xs text-zinc-500">{kpi.subtitle}</p>
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                                kpi.badge.bg,
                                                            )}
                                                        >
                                                            {kpi.badge.text}
                                                        </span>
                                                    </div>

                                                    {/* Big number + label */}
                                                    <div className="mb-4 flex items-baseline gap-2">
                                                        <p className="text-3xl font-bold leading-none tracking-tight">
                                                            {kpi.bigValue}
                                                        </p>
                                                        <p className="text-xs font-medium text-zinc-500">{kpi.bigLabel}</p>
                                                    </div>

                                                    {/* Progress dots (like designs1) */}
                                                    <ProgressDots
                                                        completed={kpi.completedDots}
                                                        total={kpi.totalDots}
                                                    />

                                                    {/* Completion text */}
                                                    <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
                                                        <span className="text-zinc-500">Completed</span>
                                                        <span className="font-bold text-zinc-900">{kpi.percent}%</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* Section 2: Today's Operations (2 colored task cards like Home Tasks) */}
                            <section className="mb-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold tracking-tight">Today&apos;s Operations</h2>
                                        <Badge variant="outline" className="bg-zinc-100 text-zinc-600">
                                            Today
                                        </Badge>
                                    </div>
                                    <button className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add new
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {TASK_CARDS.map((task) => {
                                        const isDark = task.tone === 'dark'
                                        const BadgeIcon = task.badge.icon
                                        return (
                                            <div
                                                key={task.title}
                                                className={cn(
                                                    'relative overflow-hidden rounded-2xl p-5 shadow-sm',
                                                    isDark
                                                        ? 'bg-[#1a1d29] text-white'
                                                        : 'bg-[#f4d03f] text-[#1a1d29]',
                                                )}
                                            >
                                                {/* Urgent/Live badge */}
                                                <div className="absolute right-4 top-4">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold',
                                                            task.badge.bg,
                                                        )}
                                                    >
                                                        <BadgeIcon className="h-3 w-3" />
                                                        {task.badge.text}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <p className="pr-20 text-lg font-bold tracking-tight">{task.title}</p>

                                                {/* Description */}
                                                <p
                                                    className={cn(
                                                        'mt-2 text-xs leading-relaxed',
                                                        isDark ? 'text-white/60' : 'text-[#1a1d29]/70',
                                                    )}
                                                >
                                                    {task.description}
                                                </p>

                                                {/* Metadata link */}
                                                <p className="mt-4 text-xs">
                                                    <span
                                                        className={cn(
                                                            'underline underline-offset-2',
                                                            isDark ? 'text-white' : 'text-[#1a1d29]',
                                                        )}
                                                    >
                                                        {task.metaTitle}
                                                    </span>
                                                    <span className={cn('ml-2', isDark ? 'text-white/50' : 'text-[#1a1d29]/50')}>
                                                        · {task.dueLabel}
                                                    </span>
                                                </p>

                                                {/* Footer: avatars */}
                                                <div className="mt-4 flex items-center justify-between border-t pt-3"
                                                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,29,41,0.1)' }}
                                                >
                                                    <p className={cn('text-xs', isDark ? 'text-white/60' : 'text-[#1a1d29]/60')}>
                                                        3 staff assigned
                                                    </p>
                                                    <div className="flex -space-x-2">
                                                        {task.avatars.map((a, i) => (
                                                            <span
                                                                key={i}
                                                                className={cn(
                                                                    'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2',
                                                                    a.color,
                                                                    isDark ? 'ring-[#1a1d29]' : 'ring-[#f4d03f]',
                                                                )}
                                                            >
                                                                {a.initials}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* Section 3: Recent activity (single row like Assignments in designs1) */}
                            <section>
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold tracking-tight">Recent Activity</h2>
                                        <button className="text-zinc-400 hover:text-zinc-700">
                                            <Share2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <button className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900">
                                        Sort by
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <Card className="border-zinc-200 bg-white shadow-sm">
                                    <CardContent className="flex flex-wrap items-center gap-4 p-5">
                                        <Avatar className="h-12 w-12 ring-2 ring-zinc-100">
                                            <AvatarFallback className={cn('text-xs font-semibold', RECENT_ACTIVITY.assigneeColor)}>
                                                {RECENT_ACTIVITY.assigneeInitials}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold tracking-tight">{RECENT_ACTIVITY.title}</p>
                                            <p className="text-xs text-zinc-500">
                                                {RECENT_ACTIVITY.date}, {RECENT_ACTIVITY.time} · {RECENT_ACTIVITY.duration} ·{' '}
                                                {RECENT_ACTIVITY.branch}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" className="rounded-full">
                                                Reschedule
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                                            >
                                                Accept invite
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        </main>

                        {/* RIGHT SIDEBAR */}
                        <aside className="w-full shrink-0 border-t border-zinc-200 bg-white px-6 py-6 lg:w-[320px] lg:border-l lg:border-t-0">
                            {/* Profile card */}
                            <div className="mb-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                                        Profile
                                    </p>
                                    <button className="text-zinc-400 hover:text-zinc-600">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="h-20 w-20 ring-4 ring-zinc-100">
                                        <AvatarImage
                                            src="https://i.pravatar.cc/160?img=47"
                                            alt="Melissa Anderson"
                                        />
                                        <AvatarFallback className="bg-[#f4d03f] text-[#1a1d29]">
                                            MA
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="mt-3 text-base font-bold">Melissa Anderson</p>
                                    <p className="text-xs text-zinc-500">Operations Manager · @forevercare</p>
                                    <p className="mt-0.5 text-[11px] text-zinc-400">mel.anderson@forevercare.ke</p>
                                </div>
                            </div>

                            {/* Calendar widget */}
                            <div className="mb-6 rounded-xl border border-zinc-200 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <button className="text-zinc-400 hover:text-zinc-700">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <p className="text-sm font-semibold">
                                        {monthName} {year}
                                    </p>
                                    <button className="text-zinc-400 hover:text-zinc-700">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-zinc-400">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                                        <span key={i} className="py-1">{d}</span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: firstDay + daysInMonth }, (_, i) => {
                                        const day = i - firstDay + 1
                                        const isValid = day >= 1 && day <= daysInMonth
                                        const isToday = day === todayDate
                                        const hasEvent = [3, 12, 18, 21, 25].includes(day)
                                        if (!isValid) return <span key={i} className="h-7" />
                                        return (
                                            <div
                                                key={i}
                                                className={cn(
                                                    'flex h-7 items-center justify-center rounded-full text-[11px] font-medium',
                                                    isToday && 'bg-[#1a1d29] text-white',
                                                    !isToday && hasEvent && 'bg-amber-50 text-amber-700 font-semibold',
                                                    !isToday && !hasEvent && 'text-zinc-600 hover:bg-zinc-100',
                                                )}
                                            >
                                                {day}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Schedule widget */}
                            <div className="mb-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-semibold">Schedule</p>
                                    <button className="text-xs text-zinc-500 hover:text-zinc-900">See all</button>
                                </div>
                                <div className="space-y-2">
                                    {SCHEDULE_ITEMS.map((item, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'flex items-start gap-3 rounded-lg border p-3',
                                                item.bg,
                                                item.border,
                                            )}
                                        >
                                            <div className="min-w-[40px]">
                                                <p className="text-[10px] uppercase text-zinc-500">{item.date}</p>
                                                <p className="text-[11px] font-bold text-zinc-700">{item.time}</p>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-zinc-900">{item.event}</p>
                                                <p className="text-[11px] text-zinc-500">{item.sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reminders widget */}
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-semibold">Reminders</p>
                                </div>
                                <div className="divide-y divide-zinc-100">
                                    {REMINDERS.map((r, i) => {
                                        const Icon = r.icon
                                        return (
                                            <div key={i} className="flex items-start gap-3 py-3">
                                                <div
                                                    className={cn(
                                                        'flex h-8 w-8 items-center justify-center rounded-lg',
                                                        r.iconBg,
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-zinc-900">{r.title}</p>
                                                    <p className="text-[11px] text-zinc-500">
                                                        {r.date} · {r.day}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Progress dots (like course cards in designs1)                              */
/* -------------------------------------------------------------------------- */

function ProgressDots({ completed, total }: { completed: number; total: number }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: total }, (_, i) => {
                const isCompleted = i < completed
                const isCurrent = i === completed
                return (
                    <span
                        key={i}
                        className={cn(
                            'flex h-3 w-3 items-center justify-center rounded-full',
                            isCompleted && 'bg-[#1a1d29] text-white',
                            isCurrent && 'border-2 border-[#1a1d29] bg-white',
                            !isCompleted && !isCurrent && 'bg-zinc-200',
                        )}
                    >
                        {isCompleted && (
                            <svg viewBox="0 0 12 12" className="h-2 w-2" fill="none">
                                <path
                                    d="M2 6L5 9L10 3"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </span>
                )
            })}
        </div>
    )
}
