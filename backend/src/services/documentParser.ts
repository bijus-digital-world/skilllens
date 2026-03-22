import fs from 'fs'
import path from 'path'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import { getFilePath } from './fileStorage'

export async function extractText(filename: string): Promise<string> {
  const filePath = getFilePath(filename)
  const ext = path.extname(filename).toLowerCase()

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath)
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await parser.getText()
    await parser.destroy()
    return result.text.trim()
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value.trim()
  }

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8').trim()
  }

  throw new Error(`Unsupported file type: ${ext}`)
}
