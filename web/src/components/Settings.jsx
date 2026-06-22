import React, { useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, RefreshCw, FileDown, AlertTriangle } from 'lucide-react'
import { hapticButton } from '../utils/animations'

export default function Settings({ 
  currency, 
  setCurrency, 
  startingBalance, 
  setStartingBalance 
}) {
  const queryClient = useQueryClient()
  const [balanceInput, setBalanceInput] = useState(startingBalance.toString())
  const [showConfirm, setShowConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Fetch all transactions and goals so we can delete them
  const { data: allTransactions } = useQuery({
    queryKey: ['all-transactions-for-settings'],
    queryFn: async () => {
      const res = await fetch('/api/transactions')
      return res.json()
    }
  })

  const { data: allGoals } = useQuery({
    queryKey: ['all-goals-for-settings'],
    queryFn: async () => {
      const res = await fetch('/api/goals')
      return res.json()
    }
  })

  const handleUpdateBalance = (val) => {
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setBalanceInput(val)
      const parsed = parseFloat(val) || 0
      setStartingBalance(parsed)
      localStorage.setItem('aura_starting_balance', parsed.toString())
    }
  }

  const handleClearAllData = async () => {
    setIsClearing(true)
    try {
      if (Array.isArray(allTransactions)) {
        await Promise.all(
          allTransactions.map(tx => fetch(`/api/transactions/${tx.id}`, { method: 'DELETE' }))
        )
      }
      if (Array.isArray(allGoals)) {
        await Promise.all(
          allGoals.map(g => fetch(`/api/goals/${g.id}`, { method: 'DELETE' }))
        )
      }
      setStartingBalance(0)
      setBalanceInput('0')
      localStorage.setItem('aura_starting_balance', '0')
      
      // Invalidate query caches
      queryClient.invalidateQueries()
    } catch (e) {
      console.error(e)
    } finally {
      setIsClearing(false)
      setShowConfirm(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/transactions')
      if (!res.ok) return
      const data = await res.json()
      
      const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount']
      const rows = data.map(tx => [
        tx.id,
        tx.date,
        tx.type,
        tx.category,
        tx.description ? tx.description.replace(/"/g, '""') : '',
        tx.amount
      ])
      
      const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `aura_transactions_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 relative select-none">
      {/* App Centered Logo/Version */}
      <div className="flex flex-col items-center justify-center my-6 gap-2">
        <div className="w-16 h-16 rounded-[22px] bg-hero-gradient flex items-center justify-center font-display font-extrabold text-3xl shadow-neon-strong">
          A
        </div>
        <h2 className="text-2xl font-display font-extrabold tracking-tight mt-2">AURA</h2>
        <span className="text-xs text-white/30 font-numbers uppercase tracking-widest">Version 1.0.0 (PWA)</span>
      </div>

      {/* Settings list card container */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col bg-white/5 divide-y divide-white/10">
        
        {/* Currency Row */}
        <div className="flex justify-between items-center px-5 py-4 min-h-[56px]">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-white/80">Currency Symbol</span>
          </div>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value)
              localStorage.setItem('aura_currency', e.target.value)
            }}
            className="bg-bgDark border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-primary/50"
          >
            <option value="NGN">NGN (₦)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        {/* Starting Balance Row */}
        <div className="flex justify-between items-center px-5 py-4 min-h-[56px]">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-white/80">Starting Balance</span>
          </div>
          <div className="flex items-center gap-1 bg-bgDark border border-white/10 rounded-xl px-3 py-1 max-w-[120px] font-numbers">
            <span className="text-xs text-white/40 font-bold">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={balanceInput}
              onChange={(e) => handleUpdateBalance(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none text-right w-full text-white select-text bg-bgDark"
            />
          </div>
        </div>

        {/* Export CSV Row */}
        <motion.button
          variants={hapticButton}
          whileTap="tap"
          onClick={handleExportCSV}
          className="flex justify-between items-center px-5 py-4 min-h-[56px] w-full text-left focus:outline-none cursor-pointer bg-transparent border-none"
        >
          <div className="flex items-center gap-3">
            <FileDown className="w-5 h-5 text-success" />
            <span className="text-sm font-semibold text-white/80">Export Transactions CSV</span>
          </div>
          <span className="text-xs text-white/30 font-bold">Download</span>
        </motion.button>

        {/* Clear All Data Row */}
        <motion.button
          variants={hapticButton}
          whileTap="tap"
          onClick={() => setShowConfirm(true)}
          className="flex justify-between items-center px-5 py-4 min-h-[56px] w-full text-left focus:outline-none cursor-pointer bg-transparent border-none"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-danger" />
            <span className="text-sm font-semibold text-danger">Reset All Finance Data</span>
          </div>
          <span className="text-xs text-danger/50 font-bold">Destructive</span>
        </motion.button>

      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm glass-panel rounded-3xl border border-white/15 p-6 z-10 text-white flex flex-col items-center text-center gap-4 shadow-neon"
            >
              <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center mb-1">
                <AlertTriangle className="w-6 h-6 text-danger animate-pulse" />
              </div>
              <h3 className="text-lg font-display font-bold">Clear all records?</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                This action is irreversible. All transactions and goals will be permanently deleted from database.
              </p>
              
              <div className="flex gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllData}
                  disabled={isClearing}
                  className="flex-1 py-3 text-xs font-bold bg-danger hover:bg-danger/90 rounded-xl transition focus:outline-none shadow-md flex justify-center items-center gap-1.5"
                >
                  {isClearing ? 'Clearing...' : 'Confirm Clear'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
