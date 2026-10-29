import { describe, expect, it } from 'vitest'
import { appInitials, brandContrast, homeScreenName, isValidCref, nextPermission, restLabel } from './settings'

describe('configurações', () => {
  it('CREF', () => {
    expect(isValidCref('012345-G/RS')).toBe(true)
    expect(isValidCref('012345-g/rs')).toBe(true)
    expect(isValidCref('12345-G/RS')).toBe(false)
  })

  it('nome e iniciais do ícone', () => {
    expect(homeScreenName('Team Oliveira')).toBe('Team Oliveira'.slice(0, 11).trim() + '…')
    expect(homeScreenName('Kaue Fit')).toBe('Kaue Fit')
    expect(appInitials('Team Oliveira')).toBe('TO')
    expect(appInitials('kaue')).toBe('KA')
  })

  it('contraste da cor da marca', () => {
    expect(brandContrast('#A3FF12')).toMatchObject({ level: 'good', onBrand: '#0b0c0e' })
    expect(brandContrast('#1A1C21').level).toBe('fadesOnBackground')
    expect(brandContrast('#777777').level).not.toBe('good')
  })

  it('permissões: dieta só a nutricionista edita', () => {
    expect(nextPermission('assistant', 'workouts', 'edit')).toBe('view')
    expect(nextPermission('assistant', 'workouts', 'none')).toBe('edit')
    expect(nextPermission('assistant', 'diets', 'view')).toBe('none')
    expect(nextPermission('assistant', 'diets', 'none')).toBe('view')
    expect(nextPermission('nutritionist', 'diets', 'none')).toBe('edit')
  })

  it('descanso', () => {
    expect([45, 60, 90].map(restLabel)).toEqual(['45s', '1min', '1min 30s'])
  })
})
