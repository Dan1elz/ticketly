/**
 * Escolhe preto ou branco para o texto sobre um fundo #RRGGBB
 * @param hex - Cor de fundo
 * @returns string - "#000000" ou "#ffffff", o que tiver mais contraste
 */
export function getReadableTextColor(hex: string): "#000000" | "#ffffff" {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) return "#000000"

  const value = parseInt(match[1], 16)
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255]

  // Luminância percebida (ITU-R BT.601)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? "#000000" : "#ffffff"
}
