"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, AlertCircle, CheckCircle, Download, Loader2 } from "lucide-react"

// Sample preview data
const previewData = [
  { name: "João Santos", email: "joao@email.com", phone: "(11) 99999-1111", status: "valid" },
  { name: "Maria Silva", email: "maria@email.com", phone: "(11) 99999-2222", status: "valid" },
  { name: "", email: "invalido@email.com", phone: "(11) 99999-3333", status: "error" },
  { name: "Pedro Costa", email: "pedro@email.com", phone: "", status: "warning" },
]

export default function ImportarMembrosPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload")
  const [progress, setProgress] = useState(0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setStep("preview")
    }
  }

  const handleImport = async () => {
    setStep("importing")
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setProgress(i)
    }
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
              <CardTitle>Upload do Arquivo</CardTitle>
              <CardDescription>Selecione um arquivo CSV com os dados dos membros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-1">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-sm text-muted-foreground">Apenas arquivos .csv até 5MB</p>
                </label>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Formato esperado</AlertTitle>
                <AlertDescription>
                  O arquivo deve conter as colunas: nome, email, telefone, data_nascimento, endereco, status,
                  ministerios
                  <br />
                  <Button variant="link" className="p-0 h-auto text-primary">
                    <Download className="mr-1 h-3 w-3" />
                    Baixar modelo de CSV
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prévia da Importação</CardTitle>
                <CardDescription>
                  Arquivo: {file?.name} • {previewData.length} registros encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {previewData.filter((d) => d.status === "valid").length} válidos
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {previewData.filter((d) => d.status === "warning").length} com avisos
                  </Badge>
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {previewData.filter((d) => d.status === "error").length} com erros
                  </Badge>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {row.status === "valid" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                            {row.status === "warning" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                            {row.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                          </TableCell>
                          <TableCell className={!row.name ? "text-red-500" : ""}>{row.name || "(vazio)"}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell className={!row.phone ? "text-amber-500" : ""}>{row.phone || "(vazio)"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  Registros com erros serão ignorados. Registros com avisos serão importados com dados incompletos.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Voltar
              </Button>
              <Button onClick={handleImport}>
                Importar {previewData.filter((d) => d.status !== "error").length} Membros
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">Importando membros...</h3>
              <p className="text-sm text-muted-foreground mb-4">Aguarde enquanto processamos os dados</p>
              <Progress value={progress} className="max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{progress}% concluído</p>
            </CardContent>
          </Card>
        )}

        {step === "done" && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Importação Concluída!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {previewData.filter((d) => d.status !== "error").length} membros foram importados com sucesso.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Importar Mais
                </Button>
                <Button onClick={() => router.push("/membros")}>Ver Membros</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
