export type Category = {
  name: string
  folderName: string
  extensions: string[]
  color: string
  icon: string
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    name: "Images",
    folderName: "Images",
    extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff", "avif", "heic", "raw", "cr2", "nef", "arw"],
    color: "blue",
    icon: "Image",
  },
  {
    name: "Vidéos",
    folderName: "Vidéos",
    extensions: ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv", "m4v", "3gp", "ts", "vob", "mpg", "mpeg"],
    color: "purple",
    icon: "Video",
  },
  {
    name: "Audio",
    folderName: "Audio",
    extensions: ["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma", "opus", "aiff", "ape"],
    color: "green",
    icon: "SpeakerHigh",
  },
  {
    name: "Documents",
    folderName: "Documents",
    extensions: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "rtf", "odt", "ods", "odp", "csv", "pages", "numbers", "key", "epub"],
    color: "orange",
    icon: "FileText",
  },
  {
    name: "Archives",
    folderName: "Archives",
    extensions: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "cab", "iso", "dmg", "tar.gz", "tar.bz2"],
    color: "yellow",
    icon: "Archive",
  },
  {
    name: "Code",
    folderName: "Code",
    extensions: ["js", "ts", "jsx", "tsx", "html", "css", "scss", "sass", "py", "java", "cpp", "c", "cs", "go", "rs", "php", "rb", "swift", "kt", "json", "xml", "yaml", "yml", "sql", "sh", "bash", "zsh", "fish", "ps1", "vue", "svelte"],
    color: "red",
    icon: "Code",
  },
  {
    name: "Polices",
    folderName: "Polices",
    extensions: ["ttf", "otf", "woff", "woff2", "eot", "fon"],
    color: "pink",
    icon: "TextT",
  },
  {
    name: "Exécutables",
    folderName: "Exécutables",
    extensions: ["exe", "msi", "dmg", "pkg", "deb", "rpm", "apk", "appimage", "bat", "cmd"],
    color: "gray",
    icon: "Terminal",
  },
  {
    name: "Autres",
    folderName: "Autres",
    extensions: [],
    color: "slate",
    icon: "File",
  },
]

export function getCategoryForExtension(ext: string, categories: Category[] = DEFAULT_CATEGORIES): string {
  const normalized = ext.toLowerCase().replace(/^\./, "")
  for (const cat of categories) {
    if (cat.extensions.includes(normalized)) {
      return cat.folderName
    }
  }
  return "Autres"
}

export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  if (lastDot <= 0) return ""
  return filename.slice(lastDot + 1).toLowerCase()
}

export function removeExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  if (lastDot <= 0) return filename
  return filename.slice(0, lastDot)
}

export function hasExtension(filename: string): boolean {
  const lastDot = filename.lastIndexOf(".")
  return lastDot > 0
}

export interface RemovableExtension {
  suffix: string  // ex: ".cach" ou ".png.cach"
  result: string  // ex: "img.png" ou "img"
  label: string   // ex: 'Supprimer ".cach"'
}

export function getRemovableExtensions(filename: string): RemovableExtension[] {
  const options: RemovableExtension[] = []
  // On commence à la position 1 pour ignorer les fichiers cachés (.htaccess)
  let pos = filename.indexOf(".", 1)
  while (pos !== -1) {
    const suffix = filename.slice(pos)
    options.push({
      suffix,
      result: filename.slice(0, pos),
      label: `Supprimer "${suffix}"`,
    })
    pos = filename.indexOf(".", pos + 1)
  }
  // On inverse pour mettre la dernière extension en premier (choix le moins agressif)
  return options.reverse()
}

export function computeNewName(filename: string, chosenSuffix?: string): string {
  const options = getRemovableExtensions(filename)
  if (options.length === 0) return filename
  const suffix = chosenSuffix ?? options[0].suffix
  return filename.slice(0, filename.length - suffix.length)
}
