import React, { useState, useEffect } from 'react'
import { LayoutDashboard, BarChart3, Target, Settings as SettingsIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Dashboard from './components/Dashboard'
import Summary from './components/Summary'
import Goals from './components/Goals'
import Settings from './components/Settings'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // Global PWA State
  const [currency, setCurrency] = useState('NGN')
  const [startingBalance, setStartingBalance] = useState(0)

  // Load PWA storage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('aura_currency')
    if (savedCurrency) {
      setCurrency(savedCurrency)
    } else {
      localStorage.setItem('aura_currency', 'NGN')
    }

    const savedBalance = localStorage.getItem('aura_starting_balance')
    if (savedBalance) {
      setStartingBalance(parseFloat(savedBalance))
    } else {
      localStorage.setItem('aura_starting_balance', '0')
    }
  }, [])

  // Navigation Items
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, component: Dashboard },
    { id: 'summary', label: 'Analytics', icon: BarChart3, component: Summary },
    { id: 'goals', label: 'Goals', icon: Target, component: Goals },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, component: Settings }
  ]

  const ActiveComponent = tabs.find(t => t.id === activeTab).component

  return (
    <div className="min-h-screen bg-bgDark text-white flex justify-center items-center relative overflow-hidden select-none">
      {/* Drifting Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-blob-1 pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/8 blur-[150px] animate-blob-2 pointer-events-none z-0" />

      {/* MOBILE SHELL CONTAINER */}
      <div className="w-full max-w-[430px] h-[100dvh] bg-bgDark border-x border-white/5 relative z-10 flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        
        {/* Notch Safe Padding Area */}
        <div style={{ paddingTop: 'max(44px, env(safe-area-inset-top))' }} />

        {/* Scrollable Content Container */}
        <div className="flex-grow overflow-y-auto no-scrollbar pb-[80px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              className="h-full"
            >
              <ActiveComponent 
                currency={currency} 
                startingBalance={startingBalance} 
                setCurrency={setCurrency}
                setStartingBalance={setStartingBalance}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Tab Bar Navigation (64px) */}
        <nav className="absolute bottom-0 left-0 right-0 h-[64px] glass-panel border-t border-white/10 flex justify-around items-center z-40 px-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-300 focus:outline-none bg-transparent border-none ${
                  isActive ? 'text-white' : 'text-white/40'
                }`}
              >
                <Icon className={`w-5.5 h-5.5 z-10 transition duration-300 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-[9px] font-bold z-10 transition duration-300">{tab.label}</span>
                
                {/* Magnetic Glowing Indicator underline */}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-glow"
                    className="absolute bottom-1.5 w-8 h-1 rounded-full bg-primary shadow-[0_0_12px_#7C5CFC]"
                    transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
