import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence, useMotionValue, useAnimation } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import confetti from 'canvas-confetti'
import TransactionModal from './TransactionModal'
import { hapticFab, fabSuccessRotation } from '../utils/animations'

const MONTHS = [
  { name: 'Jan', value: 1 },
  { name: 'Feb', value: 2 },
  { name: 'Mar', value: 3 },
  { name: 'Apr', value: 4 },
  { name: 'May', value: 5 },
  { name: 'Jun', value: 6 },
  { name: 'Jul', value: 7 },
  { name: 'Aug', value: 8 },
  { name: 'Sep', value: 9 },
  { name: 'Oct', value: 10 },
  { name: 'Nov', value: 11 },
  { name: 'Dec', value: 12 }
]

const CATEGORY_MAP = {
  food: { label: 'Food & Drink', emoji: '🍔', gradient: 'from-[#FF8008] to-[#FFC837]', color: '#FF8008' },
  transport: { label: 'Transport', emoji: '🚗', gradient: 'from-[#00c6ff] to-[#0072ff]', color: '#00c6ff' },
  shopping: { label: 'Shopping', emoji: '🛍️', gradient: 'from-[#F3A183] to-[#E100FF]', color: '#F3A183' },
  bills: { label: 'Bills', emoji: '💵', gradient: 'from-[#11998e] to-[#38ef7d]', color: '#11998e' },
  entertainment: { label: 'Entertainment', emoji: '🎬', gradient: 'from-[#7F00FF] to-[#E100FF]', color: '#7F00FF' },
  health: { label: 'Health', emoji: '🏥', gradient: 'from-[#ff007f] to-[#ff003f]', color: '#ff007f' },
  other: { label: 'Other', emoji: '🏷️', gradient: 'from-[#616161] to-[#9bc5c3]', color: '#616161' },
  income: { label: 'Income', emoji: '💰', gradient: 'from-[#11998e] to-[#38ef7d]', color: '#00F5A0' }
}

const CURRENCY_SYMBOLS = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }

// Isolated Swipeable Row Component using @use-gesture/react
function TransactionRow({ tx, onEdit, onDelete, currencySymbol }) {
  const x = useMotionValue(0)
  const controls = useAnimation()
  
  const bind = useDrag(({ down, movement: [mx], velocity: [vx], cancel }) => {
    // Left drag reveals delete (-72px), right drag reveals edit (72px)
    if (down) {
      const boundedX = Math.max(-100, Math.min(100, mx))
      x.set(boundedX)
    } else {
      if (mx < -50) {
        controls.start({ x: -72, transition: { type: 'spring', stiffness: 350, damping: 25 } })
      } else if (mx > 50) {
        controls.start({ x: 72, transition: { type: 'spring', stiffness: 350, damping: 25 } })
      } else {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } })
      }
    }
  }, {
    axis: 'x',
    filterTaps: true,
    bounds: { left: -120, right: 120 }
  })

  const cat = CATEGORY_MAP[tx.category] || CATEGORY_MAP.other
  const isIncome = tx.type === 'income'

  return (
    <div className="relative overflow-hidden rounded-2xl min-h-[68px] bg-white/5 border border-white/10 select-none touch-pan-y">
      {/* Background reveals */}
      <div className="absolute inset-0 flex justify-between items-center z-0">
        <div 
          className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#7C5CFC]/60 flex items-center pl-5 text-white font-bold text-xs rounded-l-2xl cursor-pointer"
          style={{ width: '72px' }}
          onClick={() => {
            onEdit(tx)
            controls.start({ x: 0 })
          }}
        >
          Edit
        </div>
        <div 
          className="h-full bg-gradient-to-l from-[#FF4D6D] to-[#FF4D6D]/60 flex items-center justify-end pr-5 text-white font-bold text-xs rounded-r-2xl cursor-pointer"
          style={{ width: '72px' }}
          onClick={() => {
            onDelete(tx.id)
            controls.start({ x: 0 })
          }}
        >
          Delete
        </div>
      </div>

      {/* Foreground container */}
      <motion.div
        style={{ x }}
        animate={controls}
        {...bind()}
        className="relative z-10 flex items-center justify-between p-4 bg-bgDark border-l border-white/5 cursor-grab active:cursor-grabbing min-h-[68px] touch-none"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cat.gradient} flex items-center justify-center text-lg shadow-md`}>
            {cat.emoji}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-white truncate max-w-[150px]">{tx.description}</span>
            <span className="text-[9px] text-white/40 mt-0.5">{cat.label}</span>
          </div>
        </div>

        <span className={`text-xs font-extrabold font-numbers ${isIncome ? 'text-success' : 'text-danger'}`}>
          {isIncome ? '+' : '-'}{currencySymbol}{parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </motion.div>
    </div>
  )
}

export default function Dashboard({ currency, startingBalance }) {
  const queryClient = useQueryClient()
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [activeFilterCategory, setActiveFilterCategory] = useState(null)
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [chartPop, setChartPop] = useState(false)
  const [rotateFab, setRotateFab] = useState(false)

  const symbol = CURRENCY_SYMBOLS[currency] || '₦'

  // Fetch Summary Data
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['summary', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/summary?year=${selectedYear}&month=${selectedMonth}`)
      if (!res.ok) throw new Error('Network error')
      return res.json()
    }
  })

  // Fetch Transactions List
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?year=${selectedYear}&month=${selectedMonth}`)
      if (!res.ok) throw new Error('Network error')
      return res.json()
    }
  })

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: async (newTx) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      })
      if (!res.ok) throw new Error('Network error')
      return res.json()
    },
    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ['transactions', selectedYear, selectedMonth] })
      await queryClient.cancelQueries({ queryKey: ['summary', selectedYear, selectedMonth] })

      const previousTx = queryClient.getQueryData(['transactions', selectedYear, selectedMonth])
      const previousSummary = queryClient.getQueryData(['summary', selectedYear, selectedMonth])

      const tempTx = {
        ...newTx,
        id: Date.now(),
        created_at: new Date().toISOString()
      }
      queryClient.setQueryData(
        ['transactions', selectedYear, selectedMonth],
        (old) => [tempTx, ...(old || [])]
      )

      queryClient.setQueryData(
        ['summary', selectedYear, selectedMonth],
        (old) => {
          if (!old) return old
          const isIncome = newTx.type === 'income'
          const amt = parseFloat(newTx.amount)
          const updatedIncome = isIncome ? old.total_income + amt : old.total_income
          const updatedExpense = !isIncome ? old.total_expense + amt : old.total_expense
          const updatedBalance = old.total_balance + (isIncome ? amt : -amt)
          
          const updatedBreakdown = { ...old.category_breakdown }
          if (!isIncome) {
            updatedBreakdown[newTx.category] = (updatedBreakdown[newTx.category] || 0) + amt
          }

          return {
            ...old,
            total_income: updatedIncome,
            total_expense: updatedExpense,
            total_balance: updatedBalance,
            net_savings: updatedIncome - updatedExpense,
            category_breakdown: updatedBreakdown
          }
        }
      )

      return { previousTx, previousSummary }
    },
    onError: (err, newTx, context) => {
      queryClient.setQueryData(['transactions', selectedYear, selectedMonth], context.previousTx)
      queryClient.setQueryData(['summary', selectedYear, selectedMonth], context.previousSummary)
    },
    onSuccess: () => {
      // FAB Rotation micro feedback
      setRotateFab(true)
      setTimeout(() => setRotateFab(false), 800)
      
      setChartPop(true)
      setTimeout(() => setChartPop(false), 500)
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.5, y: 0.85 }
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', selectedYear, selectedMonth] })
      queryClient.invalidateQueries({ queryKey: ['summary', selectedYear, selectedMonth] })
    }
  })

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async (updatedTx) => {
      const res = await fetch(`/api/transactions/${updatedTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx)
      })
      if (!res.ok) throw new Error('Network error')
      return res.json()
    },
    onMutate: async (updatedTx) => {
      await queryClient.cancelQueries({ queryKey: ['transactions', selectedYear, selectedMonth] })
      await queryClient.cancelQueries({ queryKey: ['summary', selectedYear, selectedMonth] })

      const previousTx = queryClient.getQueryData(['transactions', selectedYear, selectedMonth])
      const previousSummary = queryClient.getQueryData(['summary', selectedYear, selectedMonth])

      const originalTx = previousTx?.find(t => t.id === updatedTx.id)

      queryClient.setQueryData(
        ['transactions', selectedYear, selectedMonth],
        (old) => (old || []).map(t => t.id === updatedTx.id ? { ...t, ...updatedTx } : t)
      )

      if (originalTx) {
        queryClient.setQueryData(
          ['summary', selectedYear, selectedMonth],
          (old) => {
            if (!old) return old
            const oldIsIncome = originalTx.type === 'income'
            const oldAmt = parseFloat(originalTx.amount)
            let balance = old.total_balance - (oldIsIncome ? oldAmt : -oldAmt)
            let income = oldIsIncome ? old.total_income - oldAmt : old.total_income
            let expense = !oldIsIncome ? old.total_expense - oldAmt : old.total_expense

            const breakdown = { ...old.category_breakdown }
            if (!oldIsIncome && breakdown[originalTx.category]) {
              breakdown[originalTx.category] -= oldAmt
            }

            const newIsIncome = updatedTx.type === 'income'
            const newAmt = parseFloat(updatedTx.amount)
            balance += (newIsIncome ? newAmt : -newAmt)
            income = newIsIncome ? income + newAmt : income
            expense = !newIsIncome ? expense + newAmt : expense

            if (!newIsIncome) {
              breakdown[updatedTx.category] = (breakdown[updatedTx.category] || 0) + newAmt
            }

            for (const key in breakdown) {
              if (breakdown[key] <= 0) delete breakdown[key]
            }

            return {
              ...old,
              total_income: income,
              total_expense: expense,
              total_balance: balance,
              net_savings: income - expense,
              category_breakdown: breakdown
            }
          }
        )
      }

      return { previousTx, previousSummary }
    },
    onError: (err, updatedTx, context) => {
      queryClient.setQueryData(['transactions', selectedYear, selectedMonth], context.previousTx)
      queryClient.setQueryData(['summary', selectedYear, selectedMonth], context.previousSummary)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', selectedYear, selectedMonth] })
      queryClient.invalidateQueries({ queryKey: ['summary', selectedYear, selectedMonth] })
    }
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Network error')
      return res.json()
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['transactions', selectedYear, selectedMonth] })
      await queryClient.cancelQueries({ queryKey: ['summary', selectedYear, selectedMonth] })

      const previousTx = queryClient.getQueryData(['transactions', selectedYear, selectedMonth])
      const previousSummary = queryClient.getQueryData(['summary', selectedYear, selectedMonth])

      const deletedItem = previousTx?.find(t => t.id === id)

      queryClient.setQueryData(
        ['transactions', selectedYear, selectedMonth],
        (old) => (old || []).filter(t => t.id !== id)
      )

      if (deletedItem) {
        queryClient.setQueryData(
          ['summary', selectedYear, selectedMonth],
          (old) => {
            if (!old) return old
            const isIncome = deletedItem.type === 'income'
            const amt = parseFloat(deletedItem.amount)
            const updatedIncome = isIncome ? old.total_income - amt : old.total_income
            const updatedExpense = !isIncome ? old.total_expense - amt : old.total_expense
            const updatedBalance = old.total_balance - (isIncome ? amt : -amt)
            
            const updatedBreakdown = { ...old.category_breakdown }
            if (!isIncome && updatedBreakdown[deletedItem.category]) {
              updatedBreakdown[deletedItem.category] -= amt
              if (updatedBreakdown[deletedItem.category] <= 0) {
                delete updatedBreakdown[deletedItem.category]
              }
            }

            return {
              ...old,
              total_income: updatedIncome,
              total_expense: updatedExpense,
              total_balance: updatedBalance,
              net_savings: updatedIncome - updatedExpense,
              category_breakdown: updatedBreakdown
            }
          }
        )
      }

      return { previousTx, previousSummary }
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['transactions', selectedYear, selectedMonth], context.previousTx)
      queryClient.setQueryData(['summary', selectedYear, selectedMonth], context.previousSummary)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', selectedYear, selectedMonth] })
      queryClient.invalidateQueries({ queryKey: ['summary', selectedYear, selectedMonth] })
    }
  })

  // Format chart data
  const chartData = summary?.category_breakdown
    ? Object.keys(summary.category_breakdown).map((key) => ({
        name: CATEGORY_MAP[key]?.label || key,
        value: summary.category_breakdown[key],
        categoryKey: key,
        color: CATEGORY_MAP[key]?.color || '#9bc5c3'
      }))
    : []

  const totalExpense = summary?.total_expense || 0

  const handleOpenAddModal = () => {
    setEditingTransaction(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (tx) => {
    setEditingTransaction(tx)
    setIsModalOpen(true)
  }

  const handleModalSubmit = (data) => {
    setIsModalOpen(false)
    if (data.id) {
      editMutation.mutate(data)
    } else {
      addMutation.mutate(data)
    }
  }

  // Filter and group transactions
  const filteredTransactions = transactions
    ? transactions.filter((tx) => !activeFilterCategory || tx.category === activeFilterCategory)
    : []

  const groupedTransactions = filteredTransactions.reduce((acc, tx) => {
    const dStr = new Date(tx.date).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    if (!acc[dStr]) acc[dStr] = []
    acc[dStr].push(tx)
    return acc
  }, {})

  const computedBalance = (summary?.total_balance || 0) + parseFloat(startingBalance || 0)

  return (
    <div className="flex flex-col gap-4 px-4 py-4 relative select-none">
      
      {/* Top Bar Month Selector */}
      <header className="flex flex-col justify-between items-start gap-3 border-b border-white/5 pb-3">
        <div>
          <h2 className="text-xl font-display font-extrabold">Aura Dashboard</h2>
          <p className="text-xs text-white/50">Manage and track your wealth</p>
        </div>

        {/* Sliding Month Indicator */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-0.5 w-full overflow-x-auto max-w-full no-scrollbar">
          {MONTHS.map((m) => {
            const isActive = selectedMonth === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  setSelectedMonth(m.value)
                  setActiveFilterCategory(null)
                }}
                className={`relative px-3 py-2 text-[10px] font-bold rounded-xl transition duration-300 focus:outline-none bg-transparent border-none ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-month-indicator"
                    className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <span className="relative z-10">{m.name}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Hero Balance Card (Card Padding: 20px -> p-5) */}
      <section className="relative w-full glass-panel rounded-[24px] p-5 border border-white/10 shadow-neon overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[24px] z-0">
          <div className="absolute top-[-30%] left-[-20%] w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-blob-1" />
          <div className="absolute bottom-[-30%] right-[-10%] w-80 h-80 rounded-full bg-secondary/15 blur-3xl animate-blob-2" />
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase text-white/50 font-extrabold tracking-wider">My Balance</span>
            <h1 
              style={{ fontSize: 'clamp(36px, 10vw, 52px)' }} 
              className="font-extrabold font-numbers flex items-baseline gap-1 tracking-tighter"
            >
              <span>{symbol}</span>
              {isSummaryLoading ? (
                <span className="opacity-20 animate-pulse">00,000</span>
              ) : (
                <span>{computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              )}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Income */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl p-2.5">
              <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/30 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-4 h-4 text-success" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] text-white/40 uppercase font-bold">Income</span>
                <span className="text-xs font-bold text-success font-numbers truncate">
                  +{symbol}{isSummaryLoading ? '0.00' : summary?.total_income?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Expenses */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl p-2.5">
              <div className="w-8 h-8 rounded-lg bg-danger/10 border border-danger/30 flex items-center justify-center flex-shrink-0">
                <ArrowDownRight className="w-4 h-4 text-danger" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] text-white/40 uppercase font-bold">Expenses</span>
                <span className="text-xs font-bold text-danger font-numbers truncate">
                  -{symbol}{isSummaryLoading ? '0.00' : summary?.total_expense?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donut Chart (Breathing Donut Card) */}
      <section className="grid grid-cols-1 gap-4">
        <motion.div
          animate={{ scale: chartPop ? 1.08 : 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 15 }}
          className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden"
        >
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-44 h-44 relative flex items-center justify-center"
          >
            {chartData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <div className="text-3xl mb-1 opacity-30">🍩</div>
                <span className="text-[10px] text-white/40 font-medium">No expenses logged</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="grad-food" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF8008" />
                      <stop offset="100%" stopColor="#FFC837" />
                    </linearGradient>
                    <linearGradient id="grad-transport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00c6ff" />
                      <stop offset="100%" stopColor="#0072ff" />
                    </linearGradient>
                    <linearGradient id="grad-shopping" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F3A183" />
                      <stop offset="100%" stopColor="#E100FF" />
                    </linearGradient>
                    <linearGradient id="grad-bills" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#11998e" />
                      <stop offset="100%" stopColor="#38ef7d" />
                    </linearGradient>
                    <linearGradient id="grad-entertainment" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7F00FF" />
                      <stop offset="100%" stopColor="#E100FF" />
                    </linearGradient>
                    <linearGradient id="grad-health" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff007f" />
                      <stop offset="100%" stopColor="#ff003f" />
                    </linearGradient>
                    <linearGradient id="grad-other" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#616161" />
                      <stop offset="100%" stopColor="#9bc5c3" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={600}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#grad-${entry.categoryKey})`}
                        onClick={() => {
                          setActiveFilterCategory(
                            activeFilterCategory === entry.categoryKey ? null : entry.categoryKey
                          )
                        }}
                        className={`cursor-pointer hover:opacity-80 transition duration-300 ${
                          activeFilterCategory && activeFilterCategory !== entry.categoryKey ? 'opacity-30' : ''
                        }`}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Spent</span>
              <span className="text-base font-bold font-numbers">
                {symbol}{totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Category Mini Cards (Width: 120px each, scrollable, no scrollbars) */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-display font-bold">Category breakdown</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 w-full no-scrollbar">
          {Object.keys(CATEGORY_MAP).filter(k => k !== 'income').map((catKey) => {
            const totalSpent = summary?.category_breakdown?.[catKey] || 0
            const cat = CATEGORY_MAP[catKey]
            const isFilterActive = activeFilterCategory === catKey
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveFilterCategory(isFilterActive ? null : catKey)}
                className={`flex-shrink-0 w-[120px] glass-panel rounded-2xl p-3.5 border transition duration-300 flex flex-col items-start focus:outline-none bg-transparent ${
                  isFilterActive
                    ? 'border-primary/50 bg-white/15 scale-95 shadow-neon'
                    : 'border-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${cat.gradient} flex items-center justify-center text-base mb-2.5 shadow`}>
                  {cat.emoji}
                </div>
                <span className="text-[10px] text-white/70 font-semibold mb-0.5 truncate w-full text-left">
                  {cat.label}
                </span>
                <span className="text-xs font-bold font-numbers text-white truncate w-full text-left">
                  {symbol}{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Transaction List (Swipeable rows) */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-display font-bold">Recent Transactions</h3>
        
        {isTransactionsLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <div className="glass-panel border border-white/10 rounded-2xl p-6 text-center text-white/40 text-xs">
            No records found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.keys(groupedTransactions).map((dateGroup) => (
              <div key={dateGroup} className="flex flex-col gap-2">
                <span className="text-[10px] uppercase text-white/40 font-extrabold tracking-wider pl-1">{dateGroup}</span>
                <div className="flex flex-col gap-2">
                  {groupedTransactions[dateGroup].map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      onEdit={handleOpenEditModal}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      categoryMap={CATEGORY_MAP}
                      currencySymbol={symbol}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Action Button (Rotates on successful add) */}
      <div className="fixed bottom-[80px] right-4 z-40 select-none max-w-[430px]">
        <motion.button
          variants={hapticFab}
          whileTap="tap"
          animate={rotateFab ? "rotate360" : ""}
          variants={{
            ...hapticFab,
            rotate360: fabSuccessRotation.rotate360
          }}
          onClick={handleOpenAddModal}
          className="w-12 h-12 rounded-full bg-hero-gradient hover:opacity-95 text-white shadow-neon-strong animate-pulse-ring flex items-center justify-center cursor-pointer focus:outline-none border-none"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Slide up bottom sheet drawer */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingTransaction}
        currency={currency}
      />
    </div>
  )
}
