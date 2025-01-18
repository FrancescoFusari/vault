import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const location = useLocation()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState(
    items.find(item => item.url === location.pathname)?.name || items[0].name
  )

  useEffect(() => {
    const currentItem = items.find(item => item.url === location.pathname)
    if (currentItem) {
      setActiveTab(currentItem.name)
    }
  }, [location.pathname, items])

  return (
    <div className={cn(
      "fixed left-0 right-0 z-50 bg-background/95 border-border/10 backdrop-blur-lg py-2 px-4",
      isMobile ? "bottom-0 border-t" : "top-0 border-b"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {!isMobile && (
          <span className="text-lg font-semibold text-secondary">SecondBrain</span>
        )}
        
        <nav className={cn(
          "flex items-center gap-1 overflow-x-auto no-scrollbar py-1",
          isMobile ? "w-full justify-around" : ""
        )}>
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.name

            return (
              <Link
                key={item.name}
                to={item.url}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  "relative cursor-pointer text-sm font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap",
                  "text-muted-foreground hover:text-primary",
                  isActive && "bg-muted text-primary",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon size={16} strokeWidth={2} />
                  <span className="text-xs">{item.name}</span>
                </span>
                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    <div className={cn(
                      "absolute w-6 h-0.5 bg-primary rounded-t-full left-1/2 -translate-x-1/2",
                      isMobile ? "bottom-full" : "-top-2"
                    )}>
                      <div className="absolute w-8 h-4 bg-primary/20 rounded-full blur-md -top-2 -left-1" />
                      <div className="absolute w-6 h-4 bg-primary/20 rounded-full blur-md -top-1" />
                      <div className="absolute w-3 h-3 bg-primary/20 rounded-full blur-sm top-0 left-1.5" />
                    </div>
                  </motion.div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}