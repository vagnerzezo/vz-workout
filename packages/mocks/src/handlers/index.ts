import { billingHandlers } from './billing'
import { checkInHandlers } from './checkin'
import { dietHandlers, waterHandlers } from './diet'
import { homeHandlers } from './home'
import { profileHandlers } from './profile'
import { progressHandlers } from './progress'
import { shoppingHandlers } from './shopping'
import { workoutHandlers } from './workout'

export const handlers = [...homeHandlers, ...waterHandlers, ...dietHandlers, ...shoppingHandlers, ...workoutHandlers, ...profileHandlers, ...progressHandlers, ...checkInHandlers, ...billingHandlers]

export { resetDb, setLatency, setScenario, type Scenario } from '../db'
