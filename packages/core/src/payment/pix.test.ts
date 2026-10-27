import { describe, expect, it } from 'vitest'
import { crc16, pixPayload } from './pix'

describe('crc16', () => {
  it('vetor de referência do CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
})

describe('pixPayload', () => {
  const payload = pixPayload({ key: '12345678000190', name: 'Carlos Oliveira', city: 'Novo Hamburgo', amount: 600, txid: 'RENATO1512TRI' })

  it('monta os campos do BR Code na ordem do padrão', () => {
    expect(payload.slice(0, -4)).toBe(
      [
        '000201',
        '2636' + '0014BR.GOV.BCB.PIX' + '011412345678000190',
        '52040000',
        '5303986',
        '5406600.00',
        '5802BR',
        '5915CARLOS OLIVEIRA',
        '6013NOVO HAMBURGO',
        '6217' + '0513RENATO1512TRI',
        '6304',
      ].join(''),
    )
  })

  it('termina com o CRC do próprio conteúdo', () => {
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)))
  })

  it('tira acentos e corta nome e cidade no tamanho máximo', () => {
    const p = pixPayload({ key: 'a@b.com', name: 'João da Conceição Ferreira Filho', city: 'São José dos Campos', amount: 89.9, txid: 'x-1' })
    expect(p).toContain('5925JOAO DA CONCEICAO FERREIR')
    expect(p).toContain('6015SAO JOSE DOS CA6')
    expect(p).toContain('540589.90')
    expect(p).toContain('0502x1')
  })
})
