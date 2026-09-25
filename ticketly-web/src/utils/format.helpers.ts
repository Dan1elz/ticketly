type Nullable<T> = T | null | undefined

// ==========================================
// NÚMEROS
// ==========================================

/**
 * Remove todos os caracteres não numéricos
 * @param value - String ou número a ser limpo
 * @returns string - Apenas números ("" se vazio)
 */
export function formatOnlyNumbers(value: Nullable<string | number>): string {
  if (value === null || value === undefined) return ""

  return String(value).replace(/\D/g, "")
}

/**
 * Formata número com separadores de milhar
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 0)
 * @returns string - Número formatado (1.000,00)
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formata porcentagem
 * @param value - Valor numérico (0 a 1 ou 0 a 100)
 * @param isDecimal - Se true, assume que o valor está entre 0 e 1. Se false, assume 0 a 100
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns string - Porcentagem formatada (00,00%)
 */
export function formatPercentage(
  value: number,
  isDecimal = false,
  decimals = 2
): string {
  const percentage = isDecimal ? value * 100 : value

  return `${percentage.toFixed(decimals).replace(".", ",")}%`
}

// ==========================================
// DINHEIRO
// ==========================================

/**
 * Formata valor monetário
 * @param value - Valor em reais (não centavos — pra centavos use formatCents)
 * @param currency - Código da moeda (ISO 4217). Padrão: "BRL"
 * @param locale - Locale para formatação. Padrão: "pt-BR"
 * @returns string - Valor formatado (R$ 1.000,00)
 *
 * @example
 * formatCurrency(1000) // "R$ 1.000,00"
 * formatCurrency(1000, "USD") // "US$ 1.000,00"
 */
export function formatCurrency(
  value: number,
  currency = "BRL",
  locale = "pt-BR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value)
}

/**
 * Formata valor em centavos (a API sempre trabalha em centavos, int)
 * @param cents - Valor em centavos
 * @returns string - Valor formatado ("" se vazio)
 *
 * @example
 * formatCents(12345) // "R$ 123,45"
 */
export function formatCents(cents: Nullable<number>): string {
  if (cents === null || cents === undefined) return ""

  return formatCurrency(cents / 100)
}

/**
 * Máscara de input de dinheiro, digitando da direita pra esquerda
 * @param value - O que o usuário digitou
 * @returns string - Valor mascarado sem símbolo
 *
 * @example
 * formatCentsInput("1") // "0,01"
 * formatCentsInput("12345") // "123,45"
 */
export function formatCentsInput(value: Nullable<string>): string {
  const numbers = formatOnlyNumbers(value)
  if (!numbers) return ""

  return formatNumber(Number(numbers) / 100, 2)
}

/**
 * Converte o valor do input de volta pra centavos (pra mandar pra API)
 * @param value - Valor mascarado
 * @returns number - Valor em centavos
 *
 * @example
 * parseCents("R$ 123,45") // 12345
 */
export function parseCents(value: Nullable<string>): number {
  const numbers = formatOnlyNumbers(value)

  return numbers ? Number(numbers) : 0
}

// ==========================================
// DOCUMENTOS
// ==========================================

/**
 * Formata CPF (máximo 11 dígitos)
 * @param value - CPF sem formatação
 * @returns string - CPF formatado (000.000.000-00)
 */
export function formatCpf(value: Nullable<string | number>): string {
  return formatOnlyNumbers(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

/**
 * Formata CNPJ (máximo 14 dígitos)
 * @param value - CNPJ sem formatação
 * @returns string - CNPJ formatado (00.000.000/0000-00)
 */
export function formatCnpj(value: Nullable<string | number>): string {
  return formatOnlyNumbers(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

/**
 * Formata CPF ou CNPJ, decidindo pela quantidade de dígitos
 * @param value - CPF ou CNPJ sem formatação
 * @returns string - CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)
 */
export function formatCpfCnpj(value: Nullable<string | number>): string {
  const numbers = formatOnlyNumbers(value)

  return numbers.length <= 11 ? formatCpf(numbers) : formatCnpj(numbers)
}

/**
 * Esconde parte do CPF (ex: tela de pedidos do admin)
 * @param value - CPF com ou sem formatação
 * @returns string - CPF mascarado (***.000.000-**)
 */
export function maskCpf(value: Nullable<string | number>): string {
  const numbers = formatOnlyNumbers(value)
  if (numbers.length !== 11) return formatCpf(numbers)

  return `***.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-**`
}

// ==========================================
// CONTATO / ENDEREÇO
// ==========================================

/**
 * Formata telefone
 * @param value - Telefone sem formatação
 * @returns string - Telefone formatado ((00) 00000-0000 ou (00) 0000-0000)
 */
export function formatPhone(value: Nullable<string | number>): string {
  const numbers = formatOnlyNumbers(value).slice(0, 11)

  if (numbers.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }

  // Celular: (00) 00000-0000
  return numbers
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
}

/**
 * Monta o link do WhatsApp a partir de um telefone
 * @param value - Telefone com ou sem formatação (com DDD)
 * @returns string - Link (https://wa.me/5500000000000)
 */
export function getWhatsappLink(value: Nullable<string | number>): string {
  return `https://wa.me/55${formatOnlyNumbers(value)}`
}

/**
 * Formata CEP
 * @param value - CEP sem formatação
 * @returns string - CEP formatado (00000-000)
 */
export function formatCep(value: Nullable<string | number>): string {
  return formatOnlyNumbers(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})/, "$1-$2")
}

// ==========================================
// TEXTO
// ==========================================

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculo (útil em buscas)
 * @param value - String a ser normalizada
 * @returns string - String normalizada ("São Paulo" → "sao paulo")
 */
export function normalizeString(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
}

/**
 * Formata nome próprio (capitaliza, mantendo "da", "de", "do"... em minúsculo)
 * @param value - Nome digitado
 * @returns string - Nome formatado ("  maria  DA silva " → "Maria da Silva")
 */
export function formatName(value: Nullable<string>): string {
  if (!value) return ""

  const lowercaseWords = ["da", "de", "do", "das", "dos", "e"]

  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && lowercaseWords.includes(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
}

/**
 * Pega as iniciais do primeiro e do último nome (ex: avatar)
 * @param value - Nome completo
 * @returns string - Iniciais ("Maria da Silva" → "MS")
 */
export function getInitials(value: Nullable<string>): string {
  if (!value) return ""

  const words = value.trim().split(/\s+/)
  const first = words[0]?.charAt(0) ?? ""
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : ""

  return (first + last).toUpperCase()
}

/**
 * Corta o texto e adiciona reticências
 * @param value - Texto
 * @param maxLength - Tamanho máximo
 * @returns string - Texto cortado ("Texto muito comprido", 10 → "Texto muit…")
 */
export function truncate(value: Nullable<string>, maxLength: number): string {
  if (!value) return ""

  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
}

// ==========================================
// DATAS
// ==========================================

/**
 * Converte o valor em Date. Strings "YYYY-MM-DD" (só data) são parseadas como
 * data local — senão o JS trata como UTC e "2026-09-25" vira 24/09 no Brasil.
 */
function toDate(value: Nullable<string | Date>): Date | null {
  if (!value) return null

  let date: Date

  if (value instanceof Date) {
    date = value
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split("-").map(Number)
    date = new Date(year, month - 1, day)
  } else {
    date = new Date(value.replace(" ", "T"))
  }

  return isNaN(date.getTime()) ? null : date
}

/**
 * Formata data apenas
 * @param value - Data (Date ou string ISO)
 * @returns string - Data formatada (DD/MM/YYYY)
 */
export function formatDateOnly(value: Nullable<string | Date>): string {
  return toDate(value)?.toLocaleDateString("pt-BR") ?? ""
}

/**
 * Formata data e hora (no fuso do navegador)
 * @param value - Data (Date ou string ISO)
 * @returns string - Data e hora formatadas (DD/MM/YYYY, HH:mm)
 */
export function formatDateTime(value: Nullable<string | Date>): string {
  return (
    toDate(value)?.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }) ?? ""
  )
}

/**
 * Formata só a hora (no fuso do navegador)
 * @param value - Data (Date ou string ISO)
 * @returns string - Hora formatada (HH:mm)
 */
export function formatTime(value: Nullable<string | Date>): string {
  return (
    toDate(value)?.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }) ?? ""
  )
}

/**
 * Formata data por extenso (ex: página do show)
 * @param value - Data (Date ou string ISO)
 * @returns string - "sexta-feira, 25 de setembro de 2026"
 */
export function formatDateLong(value: Nullable<string | Date>): string {
  return toDate(value)?.toLocaleDateString("pt-BR", { dateStyle: "full" }) ?? ""
}

/**
 * Máscara de input de data
 * @param value - O que o usuário digitou
 * @returns string - Data mascarada ("25092026" → "25/09/2026")
 */
export function formatDateInput(value: Nullable<string>): string {
  const numbers = formatOnlyNumbers(value).slice(0, 8)

  if (numbers.length <= 2) return numbers
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`

  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`
}

/**
 * Converte a data do input pro formato da API
 * @param value - Data no formato DD/MM/YYYY
 * @returns string - Data no formato YYYY-MM-DD ("" se incompleta)
 */
export function parseDateInput(value: Nullable<string>): string {
  const numbers = formatOnlyNumbers(value)
  if (numbers.length !== 8) return ""

  return `${numbers.slice(4)}-${numbers.slice(2, 4)}-${numbers.slice(0, 2)}`
}

/**
 * Máscara de input de mês/ano
 * @param value - O que o usuário digitou
 * @returns string - Mês/ano mascarado ("092026" → "09/2026")
 */
export function formatMonthYear(value: Nullable<string>): string {
  const numbers = formatOnlyNumbers(value).slice(0, 6)

  if (numbers.length <= 2) return numbers

  return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
}

/**
 * Formata segundos em contador (ex: os 10 min da reserva)
 * @param totalSeconds - Segundos restantes
 * @returns string - Contador (125 → "02:05")
 */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0")
  const ss = String(seconds % 60).padStart(2, "0")

  return `${mm}:${ss}`
}
