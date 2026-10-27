import { useState } from 'react'
import { toIsoDate } from '@workspace/core'
import { useMe } from '../../../shared/api/me'
import { useHomeSummary } from '../api/queries'
import { ActivityCard } from '../components/activity-card'
import { HomeHeader } from '../components/home-header'
import { ErrorState } from '../../../shared/components/error-state'
import { HomeSkeleton } from '../components/home-states'
import { NextMealCard } from '../components/next-meal-card'
import { NutritionCard } from '../components/nutrition-card'
import { QuickActions } from '../components/quick-actions'
import { Shortcuts } from '../components/shortcuts'
import { TodayWorkoutCard } from '../components/today-workout-card'
import { WaterCard } from '../components/water-card'
import { WeekStrip } from '../components/week-strip'
import { WeeklyWorkoutsCard } from '../components/weekly-workouts-card'

export default function HomePage() {
  const me = useMe()
  const home = useHomeSummary()
  const [now] = useState(() => new Date())
  const todayIso = toIsoDate(now)
  const [selectedDay, setSelectedDay] = useState(todayIso)

  return (
    <main className="flex flex-col gap-5 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))]">
      {me.isError || home.isError ? (
        <ErrorState
          title="Não foi possível carregar o início"
          retrying={me.isFetching || home.isFetching}
          onRetry={() => {
            if (me.isError) me.refetch()
            if (home.isError) home.refetch()
          }}
        />
      ) : !me.data || !home.data ? (
        <HomeSkeleton />
      ) : (
        <>
          <HomeHeader
            firstName={me.data.firstName}
            now={now}
            unreadNotifications={home.data.unreadNotifications}
            hasUnreadMessages={home.data.hasUnreadMessages}
          />
          <QuickActions streakDays={home.data.streakDays} lastWeightKg={home.data.lastWeightKg} />
          <WeekStrip week={home.data.week} todayIso={todayIso} selectedIso={selectedDay} onSelect={setSelectedDay} />
          <TodayWorkoutCard workout={home.data.todayWorkout} />
          <WeeklyWorkoutsCard {...home.data.weeklyWorkouts} />
          <NutritionCard nutrition={home.data.nutrition} />
          {home.data.nextMeal && <NextMealCard meal={home.data.nextMeal} />}
          <WaterCard />
          <Shortcuts />
          <ActivityCard weeks={home.data.activity} />
        </>
      )}
    </main>
  )
}
