import { describe, expect, it } from 'vitest'
import type { Exercise, PrescribedExercise, WorkoutDay } from '../schemas/workout'
import {
  addExercise,
  filterLibrary,
  moveExercise,
  newDay,
  phaseWeeksLabel,
  planSplit,
  removeExercise,
  setRows,
  setWorkingSets,
  swapExercise,
  volumeAlerts,
  volumeTone,
} from './editor'

const item = (id: string, over: Partial<PrescribedExercise> = {}): PrescribedExercise => ({
  id,
  exerciseId: `ex_${id}`,
  warmupSets: 0,
  prepSets: 0,
  workingSets: 3,
  reps: '8–12',
  restSeconds: 90,
  technique: null,
  ...over,
})

const day = (letter: WorkoutDay['letter'], weekday: number, exercises: PrescribedExercise[] = []): WorkoutDay => ({ id: `day_${letter}`, letter, name: 'Push', weekday, focus: [], exercises })
const ids = (d: WorkoutDay) => d.exercises.map((e) => e.id)

describe('edição do dia', () => {
  const d = day('A', 1, [item('a'), item('b'), item('c')])

  it('adiciona no fim com o padrão do canvas', () => {
    const next = addExercise(d, 'ex_novo', 'n1')
    expect(ids(next)).toEqual(['a', 'b', 'c', 'n1'])
    expect(next.exercises[3]).toMatchObject({ exerciseId: 'ex_novo', warmupSets: 0, prepSets: 1, workingSets: 3, reps: '8–12', restSeconds: 90 })
    expect(ids(d)).toEqual(['a', 'b', 'c']) // não mexe no original
  })

  it('sobe, desce e para nas pontas', () => {
    expect(ids(moveExercise(d, 'b', -1))).toEqual(['b', 'a', 'c'])
    expect(ids(moveExercise(d, 'b', 1))).toEqual(['a', 'c', 'b'])
    expect(moveExercise(d, 'a', -1)).toBe(d)
    expect(moveExercise(d, 'c', 1)).toBe(d)
  })

  it('remove, troca e limita as válidas entre 1 e 8', () => {
    expect(ids(removeExercise(d, 'b'))).toEqual(['a', 'c'])
    expect(swapExercise(d, 'b', 'ex_outro').exercises[1]).toMatchObject({ id: 'b', exerciseId: 'ex_outro', workingSets: 3 })
    expect(setWorkingSets(d, 'a', 0).exercises[0]!.workingSets).toBe(1)
    expect(setWorkingSets(d, 'a', 9).exercises[0]!.workingSets).toBe(8)
    expect(setWorkingSets(d, 'a', 4).exercises[0]!.workingSets).toBe(4)
  })

  it('"+ Dia" pega a próxima letra e o primeiro dia livre da semana', () => {
    expect(newDay([day('A', 1), day('B', 2)], 'x')).toMatchObject({ letter: 'C', weekday: 3, name: 'Novo treino', exercises: [] })
    expect(newDay(['A', 'B', 'C', 'D', 'E', 'F'].map((l, i) => day(l as WorkoutDay['letter'], i + 1)), 'x')).toBeNull()
  })
})

describe('setRows', () => {
  it('aquecimento, preparatórias e válidas com a fase', () => {
    const rows = setRows(item('a', { warmupSets: 1, prepSets: 2, workingSets: 3, restSeconds: 150 }), { setMultiplier: 0.7, rir: 3 })
    expect(rows.map((r) => r.label)).toEqual(['Aquecimento', 'Preparatória', 'Preparatória', 'Válida 1', 'Válida 2'])
    expect(rows[4]).toEqual({ kind: 'working', label: 'Válida 2', reps: '8–12', effort: 'RIR 3 · última até a falha técnica', restSeconds: 150 })
  })
})

describe('volume', () => {
  it.each([
    [5, 'danger'],
    [6, 'warning'],
    [10, 'ok'],
    [20, 'ok'],
    [21, 'warning'],
    [25, 'danger'],
  ])('%s séries → %s', (n, tone) => expect(volumeTone(n)).toBe(tone))

  it('alertas abaixo de 10 e acima de 20; no deload um aviso só', () => {
    const v = new Map([['chest', 12], ['biceps', 7.5], ['quads', 22]] as const)
    expect(volumeAlerts(v, ['chest', 'biceps', 'quads'], 'accumulation')).toEqual([
      { muscle: 'biceps', text: '7,5 séries na semana, abaixo de 10.', tone: 'warning' },
      { muscle: 'quads', text: '22 séries na semana, acima de 20. Confira a recuperação.', tone: 'warning' },
    ])
    expect(volumeAlerts(v, ['biceps'], 'deload')).toEqual([{ muscle: null, text: 'volume reduzido de propósito, alertas de faixa desligados.', tone: 'info' }])
  })
})

describe('textos', () => {
  it('semanas da fase e divisão da ficha', () => {
    expect(phaseWeeksLabel({ weeks: [3, 6] })).toBe('Sem. 3–6')
    expect(phaseWeeksLabel({ weeks: [10, 10] })).toBe('Sem. 10')
    expect(planSplit([{ letter: 'A', name: 'Upper' }, { letter: 'B', name: 'Lower' }])).toBe('AB · Upper, Lower')
  })
})

describe('filterLibrary', () => {
  const lib = [
    { id: '1', name: 'Supino reto', primary: 'chest', secondary: [], equipment: 'Barra', videoUrl: null, origin: 'base' },
    { id: '2', name: 'Elevação lateral', primary: 'sideDelts', secondary: [], equipment: 'Halteres', videoUrl: null, origin: 'base' },
    { id: '3', name: 'Elevação pélvica', primary: 'glutes', secondary: [], equipment: 'Barra', videoUrl: null, origin: 'base' },
  ] satisfies Exercise[]
  it('busca sem acento e filtra pelo grupo do músculo principal', () => {
    expect(filterLibrary(lib, 'elevacao', null).map((e) => e.id)).toEqual(['2', '3'])
    expect(filterLibrary(lib, '', 'Ombro').map((e) => e.id)).toEqual(['2'])
    expect(filterLibrary(lib, 'elev', 'Pernas').map((e) => e.id)).toEqual(['3'])
  })
})
