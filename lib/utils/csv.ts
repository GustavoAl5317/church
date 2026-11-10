/**
 * Leitura de CSV simples, aceitando vírgula ou ponto e vírgula (padrão do Excel em português)
 * e campos entre aspas.
 */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "")
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? ""
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ","

  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]
    if (inQuotes) {
      if (char === '"' && clean[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && clean[i + 1] === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((value) => value.trim() !== ""))
}

/** Aceita "dd/mm/aaaa" ou "aaaa-mm-dd". Retorna undefined se a data for inválida. */
export function parseBrazilianDate(value: string): Date | undefined {
  const text = value.trim()
  let day: number, month: number, year: number

  const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (br) {
    ;[day, month, year] = [Number(br[1]), Number(br[2]), Number(br[3])]
  } else if (iso) {
    ;[year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  } else {
    return undefined
  }

  const date = new Date(year, month - 1, day, 12)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined
  return date
}
