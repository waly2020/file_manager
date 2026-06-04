import { getCategoryForExtension, removeExtension, getExtension } from "./categories"
import { renameFile, moveFileToDir } from "./fs"
import type { FileInfo } from "./fs"
import type { Category } from "./categories"

export interface OperationResult {
  success: string[]
  errors: Array<{ file: string; error: string }>
}

export type RenameRuleType =
  | "prefix"
  | "suffix"
  | "find-replace"
  | "case"
  | "number"

export interface RenameRule {
  type: RenameRuleType
  prefix?: string
  suffix?: string
  find?: string
  replace?: string
  caseType?: "upper" | "lower" | "title" | "sentence"
  numberStart?: number
  numberPadding?: number
  numberPosition?: "prefix" | "suffix"
  numberSeparator?: string
}

export async function removeExtensionsFromFiles(
  dirHandle: FileSystemDirectoryHandle,
  files: FileInfo[],
  onProgress?: (done: number, total: number) => void
): Promise<OperationResult> {
  const result: OperationResult = { success: [], errors: [] }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i, files.length)

    if (!file.extension) {
      result.errors.push({ file: file.name, error: "Pas d'extension à supprimer" })
      continue
    }

    const newName = removeExtension(file.name)

    try {
      await renameFile(dirHandle, file.name, newName)
      result.success.push(file.name)
    } catch (e) {
      result.errors.push({ file: file.name, error: String(e) })
    }
  }

  onProgress?.(files.length, files.length)
  return result
}

export async function organizeFilesByType(
  dirHandle: FileSystemDirectoryHandle,
  files: FileInfo[],
  categories: Category[],
  onProgress?: (done: number, total: number) => void
): Promise<OperationResult> {
  const result: OperationResult = { success: [], errors: [] }
  const dirCache = new Map<string, FileSystemDirectoryHandle>()

  const groups = new Map<string, FileInfo[]>()
  for (const file of files) {
    const category = getCategoryForExtension(file.extension, categories)
    if (!groups.has(category)) groups.set(category, [])
    groups.get(category)!.push(file)
  }

  let done = 0

  for (const [category, categoryFiles] of groups.entries()) {
    let categoryDir = dirCache.get(category)
    if (!categoryDir) {
      try {
        categoryDir = await dirHandle.getDirectoryHandle(category, { create: true })
        dirCache.set(category, categoryDir)
      } catch (e) {
        for (const file of categoryFiles) {
          result.errors.push({ file: file.name, error: `Impossible de créer le dossier "${category}"` })
          done++
          onProgress?.(done, files.length)
        }
        continue
      }
    }

    for (const file of categoryFiles) {
      try {
        await moveFileToDir(dirHandle, categoryDir!, file.name)
        result.success.push(file.name)
      } catch (e) {
        result.errors.push({ file: file.name, error: String(e) })
      }
      done++
      onProgress?.(done, files.length)
    }
  }

  return result
}

export function applyRenameRule(filename: string, rule: RenameRule, index: number): string {
  const ext = getExtension(filename)
  const base = ext ? filename.slice(0, -(ext.length + 1)) : filename
  const sep = rule.numberSeparator ?? "_"

  let newBase = base

  switch (rule.type) {
    case "prefix":
      newBase = `${rule.prefix ?? ""}${base}`
      break
    case "suffix":
      newBase = `${base}${rule.suffix ?? ""}`
      break
    case "find-replace":
      newBase = base.replaceAll(rule.find ?? "", rule.replace ?? "")
      break
    case "case":
      switch (rule.caseType) {
        case "upper":
          newBase = base.toUpperCase()
          break
        case "lower":
          newBase = base.toLowerCase()
          break
        case "title":
          newBase = base.replace(/\b\w/g, (c) => c.toUpperCase())
          break
        case "sentence":
          newBase = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase()
          break
      }
      break
    case "number": {
      const start = rule.numberStart ?? 1
      const padding = rule.numberPadding ?? 3
      const num = String(start + index).padStart(padding, "0")
      newBase = rule.numberPosition === "suffix"
        ? `${base}${sep}${num}`
        : `${num}${sep}${base}`
      break
    }
  }

  return ext ? `${newBase}.${ext}` : newBase
}

export async function batchRenameFiles(
  dirHandle: FileSystemDirectoryHandle,
  files: FileInfo[],
  rule: RenameRule,
  onProgress?: (done: number, total: number) => void
): Promise<OperationResult> {
  const result: OperationResult = { success: [], errors: [] }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i, files.length)

    const newName = applyRenameRule(file.name, rule, i)

    if (newName === file.name) {
      result.errors.push({ file: file.name, error: "Nom identique, ignoré" })
      continue
    }

    try {
      await renameFile(dirHandle, file.name, newName)
      result.success.push(file.name)
    } catch (e) {
      result.errors.push({ file: file.name, error: String(e) })
    }
  }

  onProgress?.(files.length, files.length)
  return result
}
