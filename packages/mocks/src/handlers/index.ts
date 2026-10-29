import { authHandlers } from './auth'
import { billingHandlers } from './billing'
import { chatHandlers } from './chat'
import { checkInHandlers } from './checkin'
import { coachHandlers } from './coach'
import { coachNewStudentHandlers } from './coach-new-student'
import { coachStudentHandlers } from './coach-student'
import { dietHandlers, waterHandlers } from './diet'
import { homeHandlers } from './home'
import { notificationHandlers } from './notifications'
import { profileHandlers } from './profile'
import { progressHandlers } from './progress'
import { shoppingHandlers } from './shopping'
import { workoutHandlers } from './workout'

// authHandlers primeiro: o 401 sem sessão vale para todas as rotas /api/me
export const handlers = [...authHandlers, ...homeHandlers, ...waterHandlers, ...dietHandlers, ...shoppingHandlers, ...workoutHandlers, ...profileHandlers, ...progressHandlers, ...checkInHandlers, ...billingHandlers, ...notificationHandlers, ...chatHandlers, ...coachHandlers, ...coachNewStudentHandlers, ...coachStudentHandlers]

export { resetDb, setLatency, setScenario, type Scenario } from '../db'
