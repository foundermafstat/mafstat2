import { Home, Settings, Clock, List, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: "main-table", icon: Home, label: "Main Table" },
    { id: "game-settings", icon: Settings, label: "Settings" },
    { id: "game-stages", icon: List, label: "Stages" },
    { id: "night-actions", icon: Moon, label: "Night" },
    { id: "game-timer", icon: Clock, label: "Timer" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center p-2 text-xs",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              <tab.icon className="h-6 w-6 mb-1" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
