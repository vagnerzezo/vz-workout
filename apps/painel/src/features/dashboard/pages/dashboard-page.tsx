import { useState } from 'react'
import { useCoach, useCounters } from '../../../shared/api/coach'
import { ErrorState } from '../../../shared/components/error-state'
import { useDashboard } from '../api/queries'
import { ActivityFeed } from '../components/activity-feed'
import { AdherenceChart } from '../components/adherence-chart'
import { AttentionList } from '../components/attention-list'
import { BirthdaysCard } from '../components/birthdays-card'
import { DashboardHeader, DesktopTopBar } from '../components/dashboard-header'
import { DashboardSkeleton } from '../components/dashboard-skeleton'
import { KpiGrid } from '../components/kpi-grid'
import { QuickActions } from '../components/quick-actions'
import { RankingCard } from '../components/ranking-card'
import { SearchBox } from '../components/search-box'
import { SummaryChips } from '../components/summary-chips'

/** Dashboard (web) / Início (mobile): a mesma rota, montada por largura. */
export default function DashboardPage() {
  const coach = useCoach()
  const dashboard = useDashboard()
  const { data: counters } = useCounters()
  const [now] = useState(() => new Date())
  const unread = counters?.unreadNotifications ?? 0

  return (
    <main className="flex flex-col gap-4.5 px-4 pt-[max(20px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] lg:gap-6 lg:px-8 lg:pt-6 lg:pb-10">
      <DesktopTopBar unread={unread} />
      {coach.isError || dashboard.isError ? (
        <ErrorState
          title="Não foi possível carregar o dashboard"
          retrying={coach.isFetching || dashboard.isFetching}
          onRetry={() => {
            if (coach.isError) coach.refetch()
            if (dashboard.isError) dashboard.refetch()
          }}
        />
      ) : !coach.data || !dashboard.data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <DashboardHeader
            coachFirstName={coach.data.firstName}
            coachFullName={coach.data.fullName}
            now={now}
            unread={unread}
            studentsNeedingAttention={new Set(dashboard.data.attention.map((a) => a.studentId)).size}
          />
          <SearchBox placeholder="Buscar aluno" className="lg:hidden" />
          <QuickActions />
          <KpiGrid dashboard={dashboard.data} />
          <SummaryChips dashboard={dashboard.data} />
          <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:items-start">
            <div className="flex min-w-0 flex-col gap-5 lg:flex-[999_1_560px]">
              <AttentionList items={dashboard.data.attention} now={now} />
              <AdherenceChart weeks={dashboard.data.adherence} goal={dashboard.data.adherenceGoal} />
            </div>
            <div className="flex min-w-0 flex-col gap-5 lg:flex-[1_1_320px]">
              <ActivityFeed events={dashboard.data.activity} now={now} />
              <BirthdaysCard birthdays={dashboard.data.birthdays} />
              <RankingCard ranking={dashboard.data.ranking} now={now} />
            </div>
          </div>
        </>
      )}
    </main>
  )
}
