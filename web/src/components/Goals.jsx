import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Trash2, Check } from 'lucide-react'
import { hapticButton } from '../utils/animations'

const GOAL_EMOJIS = ['✈️', '🚗', '🏠', '💻', '🎓', '💍', '🏖️', '💰', '🚀', '🎯']

const CURRENCY_SYMBOLS = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }

export default function Goals({ currency }) {
  const queryClient = useQueryClient()
  
  // Quick Add Savings state
  const [activeSavingsId, setActiveSavingsId] = useState(null)
  const [quickSavingsAmount, setQuickSavingsAmount] = useState('')

  // Add Goal Form state
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [saved, setSaved] = useState('')
  const [deadline, setDeadline] = useState('')
  const [emoji, setEmoji] = useState('💰')
  const [formShake, setFormShake] = useState(false)
  const [errors, setErrors] = useState({})

  const symbol = CURRENCY_SYMBOLS[currency] || '₦'

  // Fetch Goals
  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/goals`)
      if (!res.ok) throw new Error('Failed to fetch goals')
      return res.json()
    }
  })

  // Add Goal Mutation
  const addGoalMutation = useMutation({
    mutationFn: async (newGoal) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      })
      if (!res.ok) throw new Error('Failed to add goal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setTitle('')
      setTarget('')
      setSaved('')
      setDeadline('')
      setEmoji('💰')
    }
  })

  // Update Goal Mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...updatedData }) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })
      if (!res.ok) throw new Error('Failed to update goal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })

  // Delete Goal Mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/goals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete goal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })

  const handleSubmitGoal = (e) => {
    e.preventDefault()
    const parsedTarget = parseFloat(target)
    const parsedSaved = parseFloat(saved) || 0.0
    const newErrors = {}

    if (!title.trim()) newErrors.title = 'Please enter a goal title'
    if (isNaN(parsedTarget) || parsedTarget <= 0) newErrors.target = 'Please enter a valid target'
    if (parsedSaved < 0) newErrors.saved = 'Saved amount cannot be negative'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setFormShake(true)
      setTimeout(() => setFormShake(false), 500)
      return
    }

    addGoalMutation.mutate({
      title,
      target: parsedTarget,
      saved: parsedSaved,
      deadline: deadline || null,
      emoji
    })
    setErrors({})
  }

  const handleQuickSaveSubmit = (goal) => {
    const parsedAmount = parseFloat(quickSavingsAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    const newSaved = Math.min(parseFloat(goal.target), parseFloat(goal.saved) + parsedAmount)
    updateGoalMutation.mutate({
      id: goal.id,
      saved: newSaved
    })

    setActiveSavingsId(null)
    setQuickSavingsAmount('')
  }

  const radius = 30
  const circumference = 2 * Math.PI * radius // ~188.49

  return (
    <div className="flex flex-col gap-6 px-4 py-4 select-none pb-32">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C5CFC" />
            <stop offset="50%" stopColor="#C850C0" />
            <stop offset="100%" stopColor="#F7971E" />
          </linearGradient>
        </defs>
      </svg>

      {/* Title */}
      <div>
        <h2 className="text-xl font-display font-extrabold">Savings Goals</h2>
        <p className="text-xs text-white/50">Plan and save for your milestones</p>
      </div>

      {/* Main List */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : !goals || goals.length === 0 ? (
          <div className="glass-panel border border-white/10 rounded-2xl p-6 text-center text-white/40 text-xs flex flex-col items-center justify-center min-h-[200px]">
            <span className="text-4xl mb-2 opacity-30">🎯</span>
            No active savings goals found. Create your first goal below!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map((goal) => {
              const pct = Math.min(100, Math.round((parseFloat(goal.saved) / parseFloat(goal.target)) * 100))
              const dashoffset = circumference - (pct / 100) * circumference
              const isSavingsInputActive = activeSavingsId === goal.id

              return (
                <div 
                  key={goal.id} 
                  className="group relative glass-panel rounded-[24px] p-4 border border-white/10 flex items-center gap-4 transition duration-300"
                >
                  {/* Circle Ring */}
                  <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="transparent" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r={radius} 
                        stroke="url(#goalGrad)" 
                        strokeWidth="4" 
                        fill="transparent"
                        strokeDasharray={circumference} 
                        strokeDashoffset={dashoffset} 
                        strokeLinecap="round" 
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold font-numbers">{pct}%</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-grow flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm flex-shrink-0">{goal.emoji}</span>
                      <h4 className="text-xs font-display font-bold text-white truncate">{goal.title}</h4>
                    </div>
                    
                    <span className="text-[9px] text-white/40 block truncate">
                      Target: <span className="font-extrabold text-white font-numbers">{symbol}{parseFloat(goal.target).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </span>

                    <span className="text-[10px] font-bold text-white font-numbers mt-1.5">
                      {symbol}{parseFloat(goal.saved).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[8px] text-white/45 font-medium uppercase">saved</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                    {isSavingsInputActive ? (
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="+ add"
                          value={quickSavingsAmount}
                          onChange={(e) => {
                            if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setQuickSavingsAmount(e.target.value)
                          }}
                          className="bg-transparent text-[10px] font-bold font-numbers focus:outline-none w-12 text-center text-white select-text"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickSaveSubmit(goal)}
                          className="w-5 h-5 rounded-lg bg-success/20 border border-success/35 flex items-center justify-center hover:bg-success/30 transition focus:outline-none"
                        >
                          <Check className="w-2.5 h-2.5 text-success" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSavingsId(goal.id)
                          setQuickSavingsAmount('')
                        }}
                        className="text-[10px] font-bold bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 hover:bg-white/15 transition focus:outline-none cursor-pointer"
                      >
                        Add Savings
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteGoalMutation.mutate(goal.id)}
                      className="w-7 h-7 rounded-lg bg-danger/10 border border-danger/25 flex items-center justify-center hover:bg-danger/20 transition focus:outline-none"
                    >
                      <Trash2 className="w-3 h-3 text-danger" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Goal Form */}
      <div 
        className={`glass-panel rounded-2xl p-5 border border-white/10 bg-white/5 flex flex-col gap-4 ${
          formShake ? 'animate-shake' : ''
        }`}
      >
        <div>
          <h3 className="text-sm font-display font-bold">New Goal</h3>
          <p className="text-[9px] text-white/40">Define a new target milestone</p>
        </div>

        <form onSubmit={handleSubmitGoal} className="flex flex-col gap-3">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase text-white/50 font-bold tracking-wider">Goal Name</label>
            <input
              type="text"
              placeholder="e.g. Travel Fund"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary/50 text-xs select-text text-white bg-bgDark"
            />
            {errors.title && <span className="text-[9px] text-danger font-semibold mt-0.5">{errors.title}</span>}
          </div>

          {/* Target */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase text-white/50 font-bold tracking-wider">Target Amount ({symbol})</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="5000.00"
              value={target}
              onChange={(e) => {
                if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setTarget(e.target.value)
              }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary/50 text-xs font-numbers select-text text-white bg-bgDark"
            />
            {errors.target && <span className="text-[9px] text-danger font-semibold mt-0.5">{errors.target}</span>}
          </div>

          {/* Current Saved */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase text-white/50 font-bold tracking-wider">Initially Saved ({symbol})</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={saved}
              onChange={(e) => {
                if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setSaved(e.target.value)
              }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary/50 text-xs font-numbers select-text text-white bg-bgDark"
            />
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase text-white/50 font-bold tracking-wider">Target Date (Optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary/50 text-xs select-text text-white bg-bgDark"
            />
          </div>

          {/* Emoji Badge Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase text-white/50 font-bold tracking-wider">Badge Icon</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {GOAL_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs border transition focus:outline-none ${
                    emoji === e 
                      ? 'bg-white/15 border-white/30 scale-90' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 w-full bg-hero-gradient hover:opacity-95 text-white font-display font-bold py-3 px-4 rounded-xl shadow-neon shimmer-btn transition text-xs flex items-center justify-center gap-1 cursor-pointer focus:outline-none"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Goal</span>
          </button>
        </form>
      </div>
    </div>
  )
}
