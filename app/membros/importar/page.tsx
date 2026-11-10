"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, AlertCircle, CheckCircle, Download, Loader2 } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createMember, type MemberInput } from "@/lib/services/members"
import { parseBrazilianDate, parseCsv } from "@/lib/utils/csv"
import type { MemberRole, MemberStatus } from "@/lib/types"

const COLUMNS = [
  "nome",
  "email",
  "telefone",
  "data_nascimento",
  "membro_desde",
  "endereco",
  "status",
  "funcao",
  "batizado",
  "ministerios",
] as const

const TEMPLATE =
  "﻿" +
  COLUMNS.join(";") +
  "\nMaria Silva;maria@email.com;(11) 99999-1111;15/03/1985;10/01/2020;Rua das Flores, 10;ativo;lider;sim;Louvor, Intercessão\n" +
  "João Santos;;(11) 98888-2222;;;;visitante;membro;não;\n"

const MAX_FILE_SIZE = 5 * 1024 * 1024

interface PreviewRow {
  line: number
  data: MemberInput
  errors: string[]
  warnings: string[]
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
}

function buildRows(text: string): PreviewRow[] {
  const [header, ...lines] = parseCsv(text)
  if (!header) return []
  const index = new Map(header.map((h, i) => [normalizeKey(h), i]))
  const get = (row: string[], key: string) => (row[index.get(key) ?? -1] ?? "").trim()

  return lines.map((row, i) => {
    const errors: string[] = []
    const warnings: string[] = []

    const name = get(row, "nome")
    if (!name) errors.push("Nome em branco")

    const email = get(row, "email")
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) warnings.push("Email inválido (será ignorado)")

    const parseDate = (key: string, label: string) => {
      const raw = get(row, key)
      if (!raw) return undefined
      const date = parseBrazilianDate(raw)
      if (!date) warnings.push(`${label} inválida (será ignorada)`)
      return date
    }
    const birthDate = parseDate("data_nascimento", "Data de nascimento")
    const entryDate = parseDate("membro_desde", "Data de entrada") ?? new Date()

    const rawStatus = normalizeKey(get(row, "status"))
    let status: MemberStatus = "ativo"
    if (rawStatus === "inativo" || rawStatus === "visitante" || rawStatus === "ativo") status = rawStatus
    else if (rawStatus) warnings.push(`Status "${get(row, "status")}" desconhecido, usado "ativo"`)

    const rawRole = normalizeKey(get(row, "funcao"))
    let memberRole: MemberRole = "membro"
    if (rawRole === "lider" || rawRole === "voluntario" || rawRole === "membro") memberRole = rawRole
    else if (rawRole) warnings.push(`Função "${get(row, "funcao")}" desconhecida, usado "membro"`)

    const baptized = ["sim", "s", "true", "1", "x"].includes(normalizeKey(get(row, "batizado")))
    const ministries = get(row, "ministerios")
      .split(/[,|]/)
      .map((m) => m.trim())
      .filter(Boolean)

    return {
      line: i + 2,
      errors,
      warnings,
      data: {
        name,
        email: warnings.some((w) => w.startsWith("Email")) ? undefined : email || undefined,
        phone: get(row, "telefone") || undefined,
        address: get(row, "endereco") || undefined,
        birthDate,
        entryDate,
        status,
        memberRole,
        baptized,
        ministries,
        observations: undefined,
      },
    }
  })
}

export default function ImportarMembrosPage() {
  const router = useRouter()
  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [fileError, setFileError] = useState("")
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload")
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState({ imported: 0, failed: [] as string[] })

  const validRows = rows.filter((r) => r.errors.length === 0)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setFileError("")

    if (file.size > MAX_FILE_SIZE) {
      setFileError("O arquivo passa de 5MB.")
      return
    }

    const parsed = buildRows(await file.text())
    if (parsed.length === 0) {
      setFileError("Não encontramos nenhum membro no arquivo. Confira se a primeira linha tem os nomes das colunas.")
      return
    }
    setFileName(file.name)
    setRows(parsed)
    setStep("preview")
  }

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "modelo-membros.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    setStep("importing")
    setProgress(0)
    let imported = 0
    const failed: string[] = []

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        await createMember(row.data)
        imported++
      } catch (error) {
        console.error(`Erro ao importar linha ${row.line}:`, error)
        failed.push(`Linha ${row.line} (${row.data.name})`)
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100))
    }

    setResult({ imported, failed })
    setStep("done")
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Membros", href: "/membros" }, { label: "Importar CSV" }]}>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Importar Membros</h1>
          <p className="text-muted-foreground">Importe membros em lote a partir de um arquivo CSV</p>
        </div>

        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Arquivo</CardTitle>
              <CardDescription>Selecione um arquivo CSV com os dados dos membros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fileError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fileError}</AlertDescription>
                </Alert>
              )}
              <div className="rounded-lg border-2 border-dashed p-12 text-center">
                <input type="file" accept=".csv,text/csv" onChange={handleFileSelect} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-1 text-lg font-medium">Clique para selecionar o arquivo</p>
                  <p className="text-sm text-muted-foreground">Apenas arquivos .csv até 5MB</p>
                </label>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Formato esperado</AlertTitle>
                <AlertDescription>
                  <p>
                    Colunas: {COLUMNS.join(", ")}. Só <strong>nome</strong> é obrigatório. Datas no formato dd/mm/aaaa,
                    status ativo/inativo/visitante, função membro/líder/voluntário e batizado sim/não.
                  </p>
                  <Button variant="link" className="h-auto p-0 text-primary" onClick={downloadTemplate}>
                    <Download className="mr-1 h-3 w-3" />
                    Baixar modelo de CSV
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {step === "preview" && (
          <Card>
            <CardHeader>
              <CardTitle>Prévia: {fileName}</CardTitle>
              <CardDescription>
                {validRows.length} de {rows.length} linhas serão importadas
                {rows.length - validRows.length > 0 && ` (${rows.length - validRows.length} com erro serão ignoradas)`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-h-[420px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.line}>
                        <TableCell>{row.line}</TableCell>
                        <TableCell>{row.data.name || "-"}</TableCell>
                        <TableCell>{row.data.email || "-"}</TableCell>
                        <TableCell>{row.data.phone || "-"}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <Badge variant="destructive">{row.errors.join(", ")}</Badge>
                          ) : row.warnings.length > 0 ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-600">
                              {row.warnings.join("; ")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Escolher outro arquivo
                </Button>
                <Button onClick={handleImport} disabled={validRows.length === 0}>
                  Importar {validRows.length} membro{validRows.length === 1 ? "" : "s"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "importing" && (
          <Card>
            <CardContent className="space-y-4 py-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importando membros...</p>
              <Progress value={progress} className="mx-auto w-full max-w-md" />
              <p className="text-sm text-muted-foreground">{progress}% concluído</p>
            </CardContent>
          </Card>
        )}

        {step === "done" && (
          <Card>
            <CardContent className="space-y-4 py-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="text-lg font-medium">
                {result.imported} membro{result.imported === 1 ? "" : "s"} importado{result.imported === 1 ? "" : "s"}
              </p>
              {result.failed.length > 0 && (
                <Alert variant="destructive" className="text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Não foi possível importar {result.failed.length} linha(s)</AlertTitle>
                  <AlertDescription>{result.failed.join(", ")}</AlertDescription>
                </Alert>
              )}
              <Button onClick={() => router.push("/membros")}>Ver membros</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
