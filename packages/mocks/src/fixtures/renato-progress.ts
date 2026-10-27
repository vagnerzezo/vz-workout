import type { Measurement, ProgressPhoto, WeightEntry } from '@workspace/core'

/** Pesagens semanais desde o início (01/08, 85 kg) até a última da Home (14/10, 82,4 kg). */
export const initialWeights = (): WeightEntry[] =>
  (
    [
      ['2026-08-01', 85.0],
      ['2026-08-08', 84.6],
      ['2026-08-15', 84.7],
      ['2026-08-22', 84.2],
      ['2026-08-29', 83.9],
      ['2026-09-05', 83.7],
      ['2026-09-12', 83.4],
      ['2026-09-19', 83.5],
      ['2026-09-26', 83.0],
      ['2026-10-03', 82.8],
      ['2026-10-10', 82.6],
      ['2026-10-14', 82.4],
    ] as const
  ).map(([date, kg], i) => ({ id: `kg${i + 1}`, date, kg }))

/** Medidas da avaliação inicial e do último check-in, como no canvas. */
export const renatoMeasurements: Measurement[] = [
  { date: '2026-08-01', waist: 98, hips: 104, chest: 108, arm: 37, thigh: 61 },
  { date: '2026-10-17', waist: 94, hips: 102, chest: 109, arm: 38.5, thigh: 62 },
]

/** Fotos dos check-ins. Sem arquivo no mock: o app mostra a silhueta no lugar. */
export const renatoPhotos: ProgressPhoto[] = (
  [
    ['2026-08-01', 85.0],
    ['2026-09-01', 83.9],
    ['2026-10-01', 82.8],
    ['2026-10-17', 82.4],
  ] as const
).flatMap(([date, weightKg]) =>
  (['front', 'side', 'back'] as const).map((pose) => ({ id: `ph_${date}_${pose}`, date, pose, weightKg, url: null })),
)
