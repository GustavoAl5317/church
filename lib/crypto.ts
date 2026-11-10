/**
 * Funções de criptografia para senhas usando Web Crypto API
 * Compatível com Next.js (funciona no servidor e no cliente)
 */

const PBKDF2_ITERATIONS = 210_000
const HASH_PREFIX = 'pbkdf2'

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

/** Compara duas strings sem vazar, pelo tempo de resposta, onde elas diferem. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Gera o hash da senha com PBKDF2-SHA256 e salt aleatório.
 * Formato: pbkdf2$<iterações>$<salt>$<hash>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt, PBKDF2_ITERATIONS)
  return `${HASH_PREFIX}$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [prefix, iterationsStr, saltHex, expected] = stored.split('$')
    if (prefix !== HASH_PREFIX || !iterationsStr || !saltHex || !expected) return false

    const iterations = Number(iterationsStr)
    if (!Number.isInteger(iterations) || iterations <= 0) return false

    const actual = await derive(password, fromHex(saltHex), iterations)
    return safeEqual(actual, expected)
  } catch (error) {
    console.error('Erro ao verificar senha:', error)
    return false
  }
}

/**
 * Gera um token aleatório
 */
export function generateToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)))
}

/**
 * Gera uma senha provisória legível (sem caracteres ambíguos como 0/O e 1/l)
 */
export function generateTemporaryPassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}
