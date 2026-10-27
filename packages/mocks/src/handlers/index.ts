import { dietHandlers, waterHandlers } from './diet'
import { homeHandlers } from './home'
import { profileHandlers } from './profile'
import { shoppingHandlers } from './shopping'
import { workoutHandlers } from './workout'

export const handlers = [...homeHandlers, ...waterHandlers, ...dietHandlers, ...shoppingHandlers, ...workoutHandlers, ...profileHandlers]

export { resetDb, setLatency, setScenario, type Scenario } from '../db'
