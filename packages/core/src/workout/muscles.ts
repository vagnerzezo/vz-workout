import type { Muscle } from '../schemas/workout'

export const muscleLabel: Record<Muscle, string> = {
  chest: 'Peito',
  lats: 'Dorsais',
  upperBack: 'Costas',
  shoulders: 'Ombros',
  sideDelts: 'Deltoide lateral',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quads: 'Quadríceps',
  hamstrings: 'Posterior de coxa',
  glutes: 'Glúteos',
  adductors: 'Adutores',
  calves: 'Panturrilhas',
  core: 'Core',
}

/** "Quadríceps · Glúteos": principal primeiro, depois os secundários. */
export function musclesLine(primary: Muscle, secondary: Muscle[]): string {
  return [primary, ...secondary].map((m) => muscleLabel[m]).join(' · ')
}
