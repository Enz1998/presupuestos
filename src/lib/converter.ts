import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

/**
 * Convierte un archivo PPTX a PDF usando PowerPoint via PowerShell
 * (Solo funciona en Windows con Office instalado)
 */
export async function convertPptxToPdf(inputPath: string, outputPath: string): Promise<string> {
  const fullInputPath = path.resolve(inputPath)
  const fullOutputPath = path.resolve(outputPath)

  // Script de PowerShell para abrir PPT, guardar como PDF y cerrar
  const psScript = `
    $ppt = New-Object -ComObject PowerPoint.Application
    $opt = [Microsoft.Office.Interop.PowerPoint.PpSaveAsFileType]::ppSaveAsPDF
    $presentation = $ppt.Presentations.Open("${fullInputPath}", [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    $presentation.SaveAs("${fullOutputPath}", $opt)
    $presentation.Close()
    $ppt.Quit()
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
  `

  // Escribimos el script temporalmente
  const scriptPath = path.join(process.cwd(), 'temp_convert.ps1')
  fs.writeFileSync(scriptPath, psScript, 'utf8')

  try {
    await execAsync(`powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`)
    return fullOutputPath
  } finally {
    // Limpieza
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath)
  }
}
