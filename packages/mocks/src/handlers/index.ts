import { dietHandlers, waterHandlers } from './diet'
import { homeHandlers } from './home'
import { workoutHandlers } from './workout'

export const handlers = [...homeHandlers, ...waterHandlers, ...dietHandlers, ...workoutHandlers]

export { resetDb, setLatency, setScenario, type Scenario } from '../db'
