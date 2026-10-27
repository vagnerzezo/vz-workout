import { beforeEach, describe, expect, it, vi } from 'vitest'
import { restLeft, restRunning, useActiveWorkout } from './active-workout'

const store = () => useActiveWorkout.getState()
const meta = { prescribedId: 'day_c_1', kind: 'working' as const }

beforeEach(() => {
  store().reset()
  store().setAutoRest(true)
  store().start('day_c')
})

const advance = (seconds: number) => vi.setSystemTime(Date.now() + seconds * 1000)

describe('timer de descanso', () => {
  it('conta pela hora de término, então sobrevive ao app fechado', () => {
    store().startRest(120)
    advance(48)
    expect(restLeft(store().rest, Date.now())).toBe(72)
    advance(200)
    expect(restLeft(store().rest, Date.now())).toBe(0)
    expect(restRunning(store().rest, Date.now())).toBe(false)
  })

  it('pausa e continua de onde parou', () => {
    store().startRest(90)
    advance(30)
    store().pauseRest()
    advance(100)
    expect(restLeft(store().rest, Date.now())).toBe(60)
    store().resumeRest()
    advance(10)
    expect(restLeft(store().rest, Date.now())).toBe(50)
  })

  it('±15 s ajusta o restante e aumenta o total se passar dele', () => {
    store().startRest(60)
    store().adjustRest(15)
    expect(restLeft(store().rest, Date.now())).toBe(75)
    expect(store().rest.total).toBe(75)
    store().adjustRest(-100)
    expect(restLeft(store().rest, Date.now())).toBe(0)
  })

  it('pular zera o descanso', () => {
    store().startRest(60)
    store().skipRest()
    expect(restLeft(store().rest, Date.now())).toBe(0)
  })
})

describe('séries', () => {
  it('ao concluir, usa a sugestão nos campos vazios e entra na fila de envio', () => {
    expect(store().toggleDone('day_c_1:v1', meta, { kg: 85, reps: 9 })).toBe(true)
    expect(store().entries['day_c_1:v1']).toMatchObject({ kg: 85, reps: 9 })
    expect(store().entries['day_c_1:v1']!.doneAt).not.toBeNull()
    expect(store().pendingSync).toEqual({ 'day_c_1:v1': 1 })
  })

  it('mantém o que o aluno digitou', () => {
    store().editSet('day_c_1:v1', meta, { kg: 87.5 })
    expect(store().pendingSync).toEqual({}) // rascunho não vai para a API
    store().toggleDone('day_c_1:v1', meta, { kg: 85, reps: 9 })
    expect(store().entries['day_c_1:v1']).toMatchObject({ kg: 87.5, reps: 9 })
  })

  it('não tira da fila uma série que mudou durante o envio', () => {
    store().toggleDone('day_c_1:v1', meta, { kg: 85, reps: 9 })
    store().editSet('day_c_1:v1', meta, { reps: 10 }) // versão 2
    store().markSynced('day_c_1:v1', 1)
    expect(store().pendingSync).toEqual({ 'day_c_1:v1': 2 })
    store().markSynced('day_c_1:v1', 2)
    expect(store().pendingSync).toEqual({})
  })

  it('guarda o treino no aparelho', () => {
    store().toggleDone('day_c_1:v1', meta, { kg: 85, reps: 9 })
    const saved = JSON.parse(localStorage.getItem('treino-ativo')!)
    expect(saved.state.dayId).toBe('day_c')
    expect(saved.state.entries['day_c_1:v1'].kg).toBe(85)
  })
})
