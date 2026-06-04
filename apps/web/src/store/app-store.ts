import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_CATEGORIES } from "@/lib/categories"
import type { Category } from "@/lib/categories"

export type OperationType = "extension-remove" | "organize" | "batch-rename"

export interface HistoryEntry {
  id: string
  timestamp: number
  type: OperationType
  summary: string
  folderName: string
  successCount: number
  errorCount: number
}

export interface AppSettings {
  confirmBeforeOperation: boolean
  categories: Category[]
}

interface AppStore {
  history: HistoryEntry[]
  settings: AppSettings
  addHistoryEntry: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void
  removeHistoryEntry: (id: string) => void
  clearHistory: () => void
  updateSettings: (patch: Partial<AppSettings>) => void
  resetCategories: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      history: [],
      settings: {
        confirmBeforeOperation: true,
        categories: DEFAULT_CATEGORIES,
      },

      addHistoryEntry: (entry) =>
        set((state) => ({
          history: [
            {
              ...entry,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
            ...state.history,
          ].slice(0, 200),
        })),

      removeHistoryEntry: (id) =>
        set((state) => ({
          history: state.history.filter((e) => e.id !== id),
        })),

      clearHistory: () => set({ history: [] }),

      updateSettings: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch },
        })),

      resetCategories: () =>
        set((state) => ({
          settings: { ...state.settings, categories: DEFAULT_CATEGORIES },
        })),
    }),
    {
      name: "fileflow-v1",
    }
  )
)
