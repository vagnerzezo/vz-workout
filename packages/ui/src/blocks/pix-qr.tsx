import { useMemo } from "react"
import QRCode from "qrcode"

type PixQrProps = {
  payload: string // "Pix copia e cola"
  label: string // obrigatório: o QR é uma imagem; o leitor de tela ouve isto
  size?: number
}

/** QR Code do Pix em SVG (nítido em qualquer tela), sempre preto no branco para o app do banco ler. */
export function PixQr({ payload, label, size = 180 }: PixQrProps) {
  const { count, path } = useMemo(() => {
    const { modules } = QRCode.create(payload, { errorCorrectionLevel: "M" })
    let d = ""
    for (let y = 0; y < modules.size; y++)
      for (let x = 0; x < modules.size; x++) if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`
    return { count: modules.size, path: d }
  }, [payload])

  const quiet = 2 // margem branca mínima em módulos
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-quiet} ${-quiet} ${count + quiet * 2} ${count + quiet * 2}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect x={-quiet} y={-quiet} width={count + quiet * 2} height={count + quiet * 2} fill="#FFFFFF" />
      <path d={path} fill="#0B0C0E" />
    </svg>
  )
}
