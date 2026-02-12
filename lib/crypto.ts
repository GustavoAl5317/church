/**
 * Funções de criptografia para senhas usando Web Crypto API
 * Compatível com Next.js (funciona no servidor e cliente)
 */

/**
 * Gera um hash SHA-256 da senha com salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Gera um salt aleatório
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Converte senha e salt para ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(password + saltHex)

  // Gera hash SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  // Retorna salt + hash (para poder verificar depois)
  return `${saltHex}:${hashHex}`
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [saltHex, storedHash] = hash.split(':')
    if (!saltHex || !storedHash) return false

    // Converte senha e salt para ArrayBuffer
    const encoder = new TextEncoder()
    const data = encoder.encode(password + saltHex)

    // Gera hash SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    // Compara hashes (timing-safe)
    return hashHex === storedHash
  } catch (error) {
    console.error('Erro ao verificar senha:', error)
    return false
  }
}

/**
 * Gera um token aleatório para recuperação de senha
 */
export function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
