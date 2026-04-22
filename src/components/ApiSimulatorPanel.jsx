import { motion, AnimatePresence } from 'framer-motion'
import { Activity, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useApiSimulator } from '@/contexts/ApiSimulatorContext'

const methodColors = {
  GET: 'bg-sage/40 text-sage-foreground',
  POST: 'bg-peach-light text-primary',
  PUT: 'bg-warm text-warm-foreground',
  PATCH: 'bg-warm text-warm-foreground',
  DELETE: 'bg-destructive/10 text-destructive',
}

const ApiSimulatorPanel = () => {
  const { calls, clear, visible, setVisible } = useApiSimulator()
  const [collapsed, setCollapsed] = useState(false)

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed top-20 right-4 z-40 p-2.5 bg-foreground text-background rounded-full shadow-lg hover:opacity-90 transition-opacity"
        aria-label="Show API activity"
      >
        <Activity className="w-4 h-4" />
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-foreground text-background">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-wide">API ACTIVITY</span>
          <span className="text-[10px] opacity-70">{calls.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clear}
            className="p-1 hover:bg-background/10 rounded transition-colors"
            aria-label="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-background/10 rounded transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setVisible(false)}
            className="p-1 hover:bg-background/10 rounded transition-colors"
            aria-label="Hide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-[60vh] overflow-y-auto">
              {calls.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Interact with the app — API calls will appear here.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {calls.map((c) => (
                      <motion.li
                        key={c.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              methodColors[c.method] ?? 'bg-muted'
                            }`}
                          >
                            {c.method}
                          </span>
                          <code className="text-xs text-foreground font-mono truncate flex-1">
                            {c.endpoint}
                          </code>
                          {c.status === 'pending' ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          ) : c.status === 'success' ? (
                            <span className="text-[10px] font-mono text-sage-foreground">
                              {c.statusCode ?? 200}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-destructive">
                              {c.statusCode ?? 'ERR'}
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-muted-foreground leading-snug">{c.description}</p>
                        )}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ApiSimulatorPanel
