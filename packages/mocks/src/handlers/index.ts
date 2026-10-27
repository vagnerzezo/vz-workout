import { dietHandlers, waterHandlers } from './diet'
import { homeHandlers } from './home'
import { shoppingHandlers } from './shopping'
import { workoutHandlers } from './workout'

export const handlers = [...homeHandlers, ...waterHandlers, ...dietHandlers, ...shoppingHandlers, ...workoutHandlers]

export { resetDb, setLatency, setScenario, type Scenario } from '../db'
