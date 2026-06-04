import { HashRouter, Route, Routes } from "react-router-dom"
import { Dashboard } from "@/pages/dashboard"
import { ExtensionRemover } from "@/pages/extension-remover"
import { FileOrganizer } from "@/pages/file-organizer"
import { BatchRename } from "@/pages/batch-rename"
import { Statistics } from "@/pages/statistics"
import { History } from "@/pages/history"
import { Settings } from "@/pages/settings"

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/extension-remover" element={<ExtensionRemover />} />
        <Route path="/file-organizer" element={<FileOrganizer />} />
        <Route path="/batch-rename" element={<BatchRename />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  )
}
