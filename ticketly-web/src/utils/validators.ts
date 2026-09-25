// Importa direto do arquivo (e não do index) pra não criar import circular
import { formatOnlyNumbers } from "./format.helpers"

// ==========================================
// DOCUMENTOS
// ==========================================

/**
 * Valida CPF
 * @param cpf - CPF com ou sem formatação
 * @returns boolean - true se válido
 */
export function validateCpf(cpf: string | number): boolean {
  const numbers = formatOnlyNumbers(cpf)

  if (numbers.length !== 11) return false
  if (/^(\d)\1{10}$/.test(numbers)) return false // Todos os dígitos iguais

  // Dígito verificador: soma dos n primeiros dígitos com pesos decrescentes
  const calc = (n: number) => {
    const sum = numbers
      .slice(0, n)
      .split("")
      .reduce((acc, digit, i) => acc + Number(digit) * (n + 1 - i), 0)
    const remainder = sum % 11

    return remainder < 2 ? 0 : 11 - remainder
  }

  return calc(9) === Number(numbers[9]) && calc(10) === Number(numbers[10])
}

/**
 * Valida CNPJ
 * @param cnpj - CNPJ com ou sem formatação
 * @returns boolean - true se válido
 */
export function validateCnpj(cnpj: string | number): boolean {
  const numbers = formatOnlyNumbers(cnpj)

  if (numbers.length !== 14) return false
  if (/^(\d)\1{13}$/.test(numbers)) return false // Todos os dígitos iguais

  const calc = (n: number) => {
    const weights =
      n === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = numbers
      .slice(0, n)
      .split("")
      .reduce((acc, digit, i) => acc + Number(digit) * weights[i], 0)
    const remainder = sum % 11

    return remainder < 2 ? 0 : 11 - remainder
  }

  return calc(12) === Number(numbers[12]) && calc(13) === Number(numbers[13])
}

/**
 * Valida CPF ou CNPJ
 * @param value - CPF ou CNPJ com ou sem formatação
 * @returns boolean - true se válido
 */
export function validateCpfCnpj(value: string | number): boolean {
  return formatOnlyNumbers(value).length === 11
    ? validateCpf(value)
    : validateCnpj(value)
}

// ==========================================
// CONTATO / ENDEREÇO
// ==========================================

/**
 * Valida email (só o formato — se existe, só mandando pra saber)
 * @param email - Email a ser validado
 * @returns boolean - true se válido
 */
export function validateEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

  return emailRegex.test(email.trim())
}

/**
 * Valida telefone (fixo ou celular, com DDD)
 * @param phone - Telefone com ou sem formatação
 * @returns boolean - true se válido
 */
export function validatePhone(phone: string | number): boolean {
  const numbers = formatOnlyNumbers(phone)

  // Fixo: 10 dígitos, começa com 2-5 | Celular: 11 dígitos, começa com 9
  return /^[1-9]{2}[2-5]\d{7}$/.test(numbers) || validateCellphone(numbers)
}

/**
 * Valida celular (com DDD)
 * @param phone - Celular com ou sem formatação
 * @returns boolean - true se válido
 */
export function validateCellphone(phone: string | number): boolean {
  return /^[1-9]{2}9\d{8}$/.test(formatOnlyNumbers(phone))
}

/**
 * Valida CEP
 * @param cep - CEP com ou sem formatação
 * @returns boolean - true se válido
 */
export function validateCep(cep: string | number): boolean {
  return formatOnlyNumbers(cep).length === 8
}

// ==========================================
// GENÉRICOS
// ==========================================

/**
 * Valida se a string contém apenas números
 * @param value - String a ser validada
 * @returns boolean - true se contém apenas números
 */
export function validateOnlyNumbers(value: string): boolean {
  return /^\d+$/.test(value)
}

/**
 * Valida se a string não está vazia
 * @param value - String a ser validada
 * @returns boolean - true se não está vazia
 */
export function validateNotEmpty(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0
}

/**
 * Valida tamanho mínimo da string
 * @param value - String a ser validada
 * @param minLength - Tamanho mínimo
 * @returns boolean - true se atende ao tamanho mínimo
 */
export function validateMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength
}

/**
 * Valida tamanho máximo da string
 * @param value - String a ser validada
 * @param maxLength - Tamanho máximo
 * @returns boolean - true se não excede o tamanho máximo
 */
export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength
}

/**
 * Valida se o valor está dentro de um range
 * @param value - Valor numérico
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns boolean - true se está dentro do range
 */
export function validateRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max
}

/**
 * Valida URL
 * @param url - URL a ser validada
 * @returns boolean - true se válida
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ==========================================
// SENHA
// ==========================================

interface IPasswordOptions {
  minLength?: number
  maxLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumber?: boolean
  requireSpecialChar?: boolean
}

/**
 * Valida se a senha atende aos critérios (padrão: senha forte, pro login do admin)
 * @param password - Senha a ser validada
 * @param options - Critérios (padrão: 8 a 50 caracteres, maiúscula, minúscula, número e símbolo)
 * @returns object - { valid: boolean, errors: string[] } — errors pronto pra mostrar na tela
 */
export function validatePassword(
  password: string,
  {
    minLength = 8,
    maxLength = 50,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecialChar = true,
  }: IPasswordOptions = {}
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < minLength) {
    errors.push(`A senha deve ter no mínimo ${minLength} caracteres`)
  }

  if (password.length > maxLength) {
    errors.push(`A senha deve ter no máximo ${maxLength} caracteres`)
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula")
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula")
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push("A senha deve conter pelo menos um número")
  }

  if (requireSpecialChar && !/[^A-Za-z\d]/.test(password)) {
    errors.push("A senha deve conter pelo menos um caractere especial")
  }

  return { valid: errors.length === 0, errors }
}

// ==========================================
// DATAS
// ==========================================

function toDate(date: string | Date): Date | null {
  const dateObj = date instanceof Date ? date : new Date(date)

  return isNaN(dateObj.getTime()) ? null : dateObj
}

/**
 * Valida data (qualquer formato que o JS entenda)
 * @param date - Data a ser validada (string ou Date)
 * @returns boolean - true se válida
 */
export function validateDate(date: string | Date): boolean {
  return toDate(date) !== null
}

/**
 * Valida data no formato da API, checando se o dia existe (30/02 não passa)
 * @param value - Data no formato YYYY-MM-DD
 * @returns boolean - true se válida
 */
export function validateDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split("-").map(Number)

  if (year < 1900 || year > 2100 || month === 0 || month > 12) return false

  // new Date(2026, 1, 30) vira 02/03 — se "mudou", a data não existe
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * Valida data no formato do input
 * @param value - Data no formato DD/MM/YYYY
 * @returns boolean - true se válida
 */
export function validateDateInput(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return false

  const [, day, month, year] = match
  return validateDateString(`${year}-${month}-${day}`)
}

/**
 * Valida se a data é futura
 * @param date - Data a ser validada
 * @returns boolean - true se é futura
 */
export function validateFutureDate(date: string | Date): boolean {
  const dateObj = toDate(date)

  return dateObj !== null && dateObj > new Date()
}

/**
 * Valida se a data é passada
 * @param date - Data a ser validada
 * @returns boolean - true se é passada
 */
export function validatePastDate(date: string | Date): boolean {
  const dateObj = toDate(date)

  return dateObj !== null && dateObj < new Date()
}

/**
 * Valida idade mínima a partir da data de nascimento (ex: show +18)
 * @param birthDate - Data de nascimento
 * @param minAge - Idade mínima
 * @returns boolean - true se tem a idade mínima
 */
export function validateMinimumAge(
  birthDate: string | Date,
  minAge: number
): boolean {
  const birth = toDate(birthDate)
  if (!birth) return false

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate())

  if (!hadBirthday) age--

  return age >= minAge
}
