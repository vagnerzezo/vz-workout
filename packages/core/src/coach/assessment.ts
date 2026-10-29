import type { Skinfolds } from '../schemas/student-detail'

export type Sex = 'male' | 'female'
export type Protocol = 'pollock7' | 'pollock3' | 'bioimpedance'

/** Dobras que entram em cada protocolo. O de 3 dobras muda com o sexo. */
export function protocolFolds(protocol: Exclude<Protocol, 'bioimpedance'>, sex: Sex): (keyof Skinfolds)[] {
  if (protocol === 'pollock7') return ['chest', 'midaxillary', 'triceps', 'subscapular', 'abdominal', 'suprailiac', 'thigh']
  return sex === 'male' ? ['chest', 'abdominal', 'thigh'] : ['triceps', 'suprailiac', 'thigh']
}

export const skinfoldSum = (folds: Skinfolds, keys: (keyof Skinfolds)[]) => keys.reduce((s, k) => s + folds[k], 0)

/** Densidade corporal (Jackson & Pollock, 1978 e 1980). */
export function bodyDensity(protocol: Exclude<Protocol, 'bioimpedance'>, sex: Sex, sum: number, age: number): number {
  const s2 = sum * sum
  if (protocol === 'pollock7') {
    return sex === 'male' ? 1.112 - 0.00043499 * sum + 0.00000055 * s2 - 0.00028826 * age : 1.097 - 0.00046971 * sum + 0.00000056 * s2 - 0.00012828 * age
  }
  return sex === 'male' ? 1.10938 - 0.0008267 * sum + 0.0000016 * s2 - 0.0002574 * age : 1.0994921 - 0.0009929 * sum + 0.0000023 * s2 - 0.0001392 * age
}

/** Equação de Siri: densidade → % de gordura. */
export const siri = (density: number) => 495 / density - 450

/** % de gordura pelo protocolo escolhido (dobras ou o valor do aparelho). */
export function fatPercent(
  protocol: Protocol,
  sex: Sex,
  age: number,
  a: { skinfolds: Skinfolds | null; bioimpedance: { fatPct: number } | null },
): number | null {
  if (protocol === 'bioimpedance') return a.bioimpedance?.fatPct ?? null
  if (!a.skinfolds) return null
  return siri(bodyDensity(protocol, sex, skinfoldSum(a.skinfolds, protocolFolds(protocol, sex)), age))
}

/** Massa gorda e magra a partir do peso e do % de gordura. */
export function composition(weightKg: number, fatPct: number) {
  const fatKg = (weightKg * fatPct) / 100
  return { fatKg, leanKg: weightKg - fatKg }
}

export const bmi = (weightKg: number, heightCm: number) => weightKg / (heightCm / 100) ** 2
export const waistHipRatio = (waist: number, hips: number) => waist / hips

/**
 * Cor da diferença entre duas avaliações: azul quando foi na direção boa, amarelo quando não.
 * `lowerIsBetter` vale para gordura, cintura, dobras; músculo e perímetros de braço e coxa são o contrário.
 */
export function deltaTone(delta: number, lowerIsBetter: boolean): 'good' | 'bad' | 'neutral' {
  if (Math.abs(delta) < 0.05) return 'neutral'
  return delta < 0 === lowerIsBetter ? 'good' : 'bad'
}
