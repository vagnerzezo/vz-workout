/** CRC-16/CCITT-FALSE (polinômio 0x1021, início 0xFFFF), em 4 dígitos hexadecimais maiúsculos. */
export function crc16(text: string): string {
  let crc = 0xffff
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Campo EMV: id, tamanho com 2 dígitos e valor. */
const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`

/** Nome e cidade no BR Code: sem acento, maiúsculas e no tamanho máximo do padrão. */
const plain = (text: string, max: number) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, max)

export type PixPayloadInput = {
  key: string // chave Pix: CNPJ/CPF só com números, e-mail, telefone (+55…) ou aleatória
  name: string // recebedor
  city: string
  amount: number // em reais
  txid: string // identificador da cobrança (até 25 letras e números)
}

/** "Pix copia e cola" (BR Code estático do Banco Central), com o valor e o identificador da cobrança. */
export function pixPayload({ key, name, city, amount, txid }: PixPayloadInput): string {
  const body =
    field('00', '01') +
    field('26', field('00', 'BR.GOV.BCB.PIX') + field('01', key)) +
    field('52', '0000') +
    field('53', '986') + // real
    field('54', amount.toFixed(2)) +
    field('58', 'BR') +
    field('59', plain(name, 25)) +
    field('60', plain(city, 15)) +
    field('62', field('05', txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***')) +
    '6304'
  return body + crc16(body)
}
