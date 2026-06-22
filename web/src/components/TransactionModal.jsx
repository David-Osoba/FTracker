import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useAnimation } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { X, Calendar } from 'lucide-react'
import { hapticButton } from '../utils/animations'

const CATEGORIES = [
  { id: 'food', label: 'Food & Drink', emoji: '🍔', gradient: 'from-[#FF8008] to-[#FFC837]' },
  { id: 'transport', label: 'Transport', emoji: '🚗', gradient: 'from-[#00c6ff] to-[#0072ff]' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', gradient: 'from-[#F3A183] to-[#E100FF]' },
  { id: 'bills', label: 'Bills', emoji: '💵', gradient: 'from-[#11998e] to-[#38ef7d]' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬', gradient: 'from-[#7F00FF] to-[#E100FF]' },
  { id: 'health', label: 'Health', emoji: '🏥', gradient: 'from-[#ff007f] to-[#ff003f]' },
  { id: 'other', label: 'Other', emoji: '🏷️', gradient: 'from-[#616161] to-[#9bc5c3]' }
]

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']

const CURRENCY_SYMBOLS = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null,
  currency = 'NGN'
}) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('expense') // 'expense' or 'income'
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0])
  const [errorShake, setErrorShake] = useState(false)
  const [errors, setErrors] = useState({})

  // Motion setup for drag dismiss
  const y = useMotionValue(0)
  const controls = useAnimation()

  const symbol = CURRENCY_SYMBOLS[currency] || '₦'

  // Populate form if editing
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAmount(Math.abs(initialData.amount).toString())
        setDescription(initialData.description || '')
        setType(initialData.type)
        setCategory(initialData.category)
        setDateStr(initialData.date)
      } else {
        setAmount('')
        setDescription('')
        setCategory('')
        setType('expense')
        setDateStr(new Date().toISOString().split('T')[0])
      }
      setErrors({})
      setErrorShake(false)
      
      // Animate entry
      y.set(0)
      controls.set({ y: '100%' })
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } })
    }
  }, [initialData, isOpen, controls, y])

  // Automatically set category to 'income' if type is income
  useEffect(() => {
    if (type === 'income') {
      setCategory('income')
    } else if (category === 'income') {
      setCategory('')
    }
  }, [type])

  // Handle keypad taps
  const handleKeypress = (key) => {
    if (key === '⌫') {
      setAmount(prev => prev.slice(0, -1))
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev ? prev + '.' : '0.')
      }
    } else {
      if (amount.includes('.')) {
        const parts = amount.split('.')
        if (parts[1].length >= 2) return
      }
      setAmount(prev => prev + key)
    }
  }

  // Drag Gesture binding
  const bind = useDrag(({ down, movement: [_, my], velocity: [__, vy], cancel }) => {
    if (my < 0) return // only drag down

    if (down) {
      y.set(my)
    } else {
      if (my > 120 || vy > 0.5) {
        controls.start({ y: '100%', transition: { type: 'spring', stiffness: 350, damping: 28 } }).then(() => {
          onClose()
        })
      } else {
        controls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 24 } })
      }
    }
  }, {
    from: () => [0, y.get()],
    filterTaps: true,
    bounds: { top: 0 },
    rubberband: true
  })

  const handleCloseClick = () => {
    controls.start({ y: '100%', transition: { type: 'spring', stiffness: 350, damping: 28 } }).then(() => {
      onClose()
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    const newErrors = {}

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    }
    if (!description.trim()) {
      newErrors.description = 'Please enter a description'
    }
    if (!category) {
      newErrors.category = 'Please select a category'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setErrorShake(true)
      setTimeout(() => setErrorShake(false), 500)
      return
    }

    onSubmit({
      id: initialData?.id,
      amount: parsedAmount,
      description,
      category,
      type,
      date: dateStr
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center max-w-[430px] mx-auto">
        {/* Dark blurred overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseClick}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Drag-dismissible Bottom Sheet Container */}
        <motion.div
          style={{ y }}
          animate={controls}
          exit={{ y: '100%' }}
          className={`relative w-full glass-panel rounded-t-[32px] border-t border-white/15 px-4 pt-4 pb-6 z-10 text-white flex flex-col select-none overflow-hidden max-h-[92vh] ${
            errorShake ? 'animate-shake' : ''
          }`}
        >
          {/* Top Drag Handle (Binds Gesture) */}
          <div 
            {...bind()} 
            className="w-full py-2 cursor-grab active:cursor-grabbing flex justify-center items-center touch-none"
          >
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>

          <div className="flex justify-between items-center mb-4 mt-1 px-1">
            <h2 className="text-lg font-display font-bold">
              {initialData ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <button
              type="button"
              onClick={handleCloseClick}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition focus:outline-none"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-1 no-scrollbar">
            {/* Type Toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-0.5 relative">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2.5 text-center text-xs font-semibold rounded-xl relative z-10 transition duration-300 focus:outline-none bg-transparent border-none ${
                  type === 'expense' ? 'text-white' : 'text-white/40'
                }`}
              >
                {type === 'expense' && (
                  <motion.div
                    layoutId="toggle-active-sheet"
                    className="absolute inset-0 bg-[#FF4D6D]/20 border border-[#FF4D6D]/45 rounded-xl -z-10 shadow-[0_0_15px_rgba(255,77,109,0.15)]"
                  />
                )}
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2.5 text-center text-xs font-semibold rounded-xl relative z-10 transition duration-300 focus:outline-none bg-transparent border-none ${
                  type === 'income' ? 'text-white' : 'text-white/40'
                }`}
              >
                {type === 'income' && (
                  <motion.div
                    layoutId="toggle-active-sheet"
                    className="absolute inset-0 bg-[#00F5A0]/20 border border-[#00F5A0]/45 rounded-xl -z-10 shadow-[0_0_15px_rgba(0,245,160,0.15)]"
                  />
                )}
                Income
              </button>
            </div>

            {/* Centered Large Read-only Amount Display */}
            <div className="flex flex-col items-center justify-center py-2 border-b border-white/10">
              <span className="text-[10px] uppercase text-white/40 font-bold tracking-wider mb-1">Enter Amount</span>
              <div className="flex items-center gap-1 font-numbers min-h-[56px]">
                <span className={`text-3xl font-extrabold ${type === 'income' ? 'text-success' : 'text-danger'}`}>
                  {symbol}
                </span>
                <span className="text-4xl font-extrabold text-white">
                  {amount || '0.00'}
                </span>
              </div>
              {errors.amount && (
                <span className="text-xs text-danger font-semibold mt-1">{errors.amount}</span>
              )}
            </div>

            {/* Description Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Description</label>
              <input
                type="text"
                placeholder="e.g. Starbucks Coffee"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary/50 transition placeholder-white/20 text-xs select-text text-white"
              />
              {errors.description && (
                <span className="text-xs text-danger font-semibold mt-1">{errors.description}</span>
              )}
            </div>

            {/* Date Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary/50 text-xs select-text text-white bg-bgDark"
                />
                <Calendar className="absolute right-3.5 top-2.5 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>

            {/* Category selection */}
            {type === 'expense' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Category</label>
                <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar w-full">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex-shrink-0 w-20 flex flex-col items-center justify-center p-2 rounded-xl border transition focus:outline-none ${
                          isSelected
                            ? 'bg-white/15 border-white/30 scale-95'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${cat.gradient} flex items-center justify-center text-base mb-1 shadow`}>
                          {cat.emoji}
                        </div>
                        <span className="text-[9px] text-white/70 truncate w-full text-center">
                          {cat.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.category && (
                  <span className="text-xs text-danger font-semibold">{errors.category}</span>
                )}
              </div>
            )}

            {/* Custom Numeric Keypad Component */}
            <div className="flex flex-col gap-1 mt-2">
              <label className="text-[10px] uppercase text-white/50 font-bold tracking-wider mb-1">Keypad</label>
              <div className="grid grid-cols-3 gap-2">
                {KEYPAD.map((key) => (
                  <motion.button
                    key={key}
                    type="button"
                    variants={hapticButton}
                    whileTap="tap"
                    onClick={() => handleKeypress(key)}
                    className="h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-display font-extrabold text-sm text-white hover:bg-white/10 active:bg-white/15 focus:outline-none cursor-pointer"
                  >
                    {key}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="mt-3 w-full bg-hero-gradient hover:opacity-95 text-white font-display font-bold py-3 px-4 rounded-xl shadow-neon shimmer-btn transition flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
            >
              <span>{initialData ? 'Save Changes' : 'Confirm Transaction'}</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
