import { getExtension } from "./categories"

export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
  extension: string
  handle: FileSystemFileHandle
}

export function isFileSystemAccessSupported(): boolean {
  return "showDirectoryPicker" in window
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await window.showDirectoryPicker({ mode: "readwrite" })
  } catch {
    return null
  }
}

export async function listFiles(dirHandle: FileSystemDirectoryHandle): Promise<FileInfo[]> {
  const files: FileInfo[] = []
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === "file") {
      const file = await handle.getFile()
      files.push({
        name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        extension: getExtension(name),
        handle,
      })
    }
  }
  return files.sort((a, b) => a.name.localeCompare(b.name, "fr"))
}

export async function renameFile(
  dirHandle: FileSystemDirectoryHandle,
  oldName: string,
  newName: string
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(oldName)

  if ("move" in fileHandle && typeof (fileHandle as any).move === "function") {
    await (fileHandle as any).move(newName)
    return
  }

  // Fallback: copy → write → delete
  const file = await fileHandle.getFile()
  const buffer = await file.arrayBuffer()
  const newHandle = await dirHandle.getFileHandle(newName, { create: true })
  const writable = await newHandle.createWritable()
  await writable.write(buffer)
  await writable.close()
  await dirHandle.removeEntry(oldName)
}

export async function moveFileToDir(
  srcDir: FileSystemDirectoryHandle,
  destDir: FileSystemDirectoryHandle,
  fileName: string
): Promise<void> {
  const fileHandle = await srcDir.getFileHandle(fileName)

  if ("move" in fileHandle && typeof (fileHandle as any).move === "function") {
    await (fileHandle as any).move(destDir)
    return
  }

  const file = await fileHandle.getFile()
  const buffer = await file.arrayBuffer()
  const newHandle = await destDir.getFileHandle(fileName, { create: true })
  const writable = await newHandle.createWritable()
  await writable.write(buffer)
  await writable.close()
  await srcDir.removeEntry(fileName)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 o"
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp))
}
