// File System Access API — types non encore inclus dans lib.dom.d.ts de TypeScript 6
interface Window {
  showDirectoryPicker(options?: {
    id?: string
    mode?: "read" | "readwrite"
    startIn?:
      | FileSystemHandle
      | "desktop"
      | "documents"
      | "downloads"
      | "music"
      | "pictures"
      | "videos"
  }): Promise<FileSystemDirectoryHandle>
  showOpenFilePicker(options?: object): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(options?: object): Promise<FileSystemFileHandle>
}
