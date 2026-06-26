import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  CartesianGrid 
} from 'recharts'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

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

export default function Summary({ currency, startingBalance }) {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())

  const symbol = CURRENCY_SYMBOLS[currency] || '₦'

  // Fetch summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['summary', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/summary?year=${selectedYear}&month=${selectedMonth}`)
      if (!res.ok) throw new Error('Failed to fetch summary')
      return res.json()
    }
  })

  // Fetch transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/transactions?year=${selectedYear}&month=${selectedMonth}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    }
  })

  const formatVal = (val) => {
    return symbol + parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const computedNetWorth = (summary?.total_balance || 0) + parseFloat(startingBalance || 0)
  const avgDailySpend = summary?.line_chart_data?.length 
    ? (summary.total_expense / summary.line_chart_data.length) 
    : 0

  return (
    <div className="flex flex-col gap-5 px-4 py-4 select-none pb-32">
      {/* Top Bar Month Selector */}
      <header className="flex flex-col justify-between items-start gap-3 border-b border-white/5 pb-3">
        <div>
          <h2 className="text-xl font-display font-extrabold">Aura Analytics</h2>
          <p className="text-xs text-white/50">Deeper insights into your cashflow</p>
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
                }}
                className={`relative px-3 py-2 text-[10px] font-bold rounded-xl transition duration-300 focus:outline-none bg-transparent border-none ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-summary-month-indicator"
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

      {isSummaryLoading || isTransactionsLoading ? (
        <div className="flex flex-col gap-4">
          {/* Net Worth Card Skeleton */}
          <div className="h-32 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
          {/* Charts Skeletons */}
          <div className="h-64 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
          <div className="h-64 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Net Worth Card */}
          <div className="relative w-full glass-panel rounded-[24px] p-5 border border-white/10 shadow-neon overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[24px] z-0">
              <div className="absolute top-[-30%] left-[-20%] w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-blob-1" />
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase text-white/50 font-extrabold tracking-wider">Net Worth</span>
                <h1 
                  style={{ fontSize: 'clamp(32px, 9vw, 48px)' }} 
                  className="font-extrabold font-numbers flex items-baseline gap-1 tracking-tighter"
                >
                  <span>{symbol}</span>
                  <span>{computedNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </h1>
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-3 text-[11px] text-white/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-success/10 flex items-center justify-center">
                    <ArrowUpRight className="w-3 h-3 text-success" />
                  </div>
                  <span>Income: <span className="font-bold text-success font-numbers">+{symbol}{summary?.total_income?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-danger/10 flex items-center justify-center">
                    <ArrowDownRight className="w-3 h-3 text-danger" />
                  </div>
                  <span>Expenses: <span className="font-bold text-danger font-numbers">-{symbol}{summary?.total_expense?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-white/5 flex flex-col justify-between min-h-[80px]">
              <span className="text-[9px] text-white/40 uppercase font-extrabold tracking-wider">Total In</span>
              <span className="text-sm font-extrabold text-success font-numbers mt-1.5">
                +{symbol}{summary?.total_income?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-white/5 flex flex-col justify-between min-h-[80px]">
              <span className="text-[9px] text-white/40 uppercase font-extrabold tracking-wider">Total Out</span>
              <span className="text-sm font-extrabold text-danger font-numbers mt-1.5">
                -{symbol}{summary?.total_expense?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-white/5 flex flex-col justify-between min-h-[80px]">
              <span className="text-[9px] text-white/40 uppercase font-extrabold tracking-wider">Net Savings</span>
              <span className={`text-sm font-extrabold font-numbers mt-1.5 ${(summary?.net_savings || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                {(summary?.net_savings || 0) >= 0 ? '+' : ''}{symbol}{summary?.net_savings?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-white/5 flex flex-col justify-between min-h-[80px]">
              <span className="text-[9px] text-white/40 uppercase font-extrabold tracking-wider">Avg Daily Spend</span>
              <span className="text-sm font-extrabold text-white font-numbers mt-1.5">
                {symbol}{avgDailySpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Spending Trend */}
          <div className="glass-panel rounded-[24px] p-5 border border-white/10 relative overflow-hidden min-h-[300px]">
            <div className="mb-4">
              <h3 className="text-sm font-display font-bold">Spending Trend</h3>
              <p className="text-[9px] text-white/40">Daily spending breakdown for the month</p>
            </div>

            <div className="h-52 w-full">
              {summary?.line_chart_data?.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-white/40 text-xs">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary?.line_chart_data || []} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C5CFC" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#7C5CFC" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      stroke="rgba(255,255,255,0.4)" 
                      fontSize={8} 
                      dy={5}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      stroke="rgba(255,255,255,0.4)" 
                      fontSize={8} 
                      tickFormatter={formatVal}
                      dx={-5}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <Tooltip 
                      contentStyle={{
                        background: 'rgba(13, 13, 26, 0.95)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontFamily: 'Inter',
                        fontSize: '10px'
                      }}
                      formatter={(val) => [`${symbol}${parseFloat(val).toLocaleString()}`, 'Spent']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#7C5CFC" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#spendingGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Weekly Bar Chart */}
          <div className="glass-panel rounded-[24px] p-5 border border-white/10 relative min-h-[300px]">
            <div className="mb-4">
              <h3 className="text-sm font-display font-bold">Income vs Expenses</h3>
              <p className="text-[9px] text-white/40">Weekly aggregate cashflows</p>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.bar_chart_data || []} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="week" 
                    axisLine={false}
                    tickLine={false}
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={8} 
                    dy={5}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={8} 
                    tickFormatter={formatVal}
                    dx={-5}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(13, 13, 26, 0.95)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontFamily: 'Inter',
                      fontSize: '10px'
                    }}
                    formatter={(val) => [`${symbol}${parseFloat(val).toLocaleString()}`]}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={30} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginTop: '-10px' }}
                  />
                  <Bar dataKey="income" fill="#00F5A0" radius={[4, 4, 0, 0]} maxBarSize={14} name="Income" />
                  <Bar dataKey="expense" fill="#FF4D6D" radius={[4, 4, 0, 0]} maxBarSize={14} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Spending Categories List */}
          <div className="glass-panel rounded-[24px] p-5 border border-white/10 relative">
            <div className="mb-4">
              <h3 className="text-sm font-display font-bold">Top Spending Categories</h3>
              <p className="text-[9px] text-white/40">Highest spending areas ranked</p>
            </div>

            <div className="flex flex-col gap-3 max-h-52 overflow-y-auto pr-1 no-scrollbar">
              {!summary?.top_categories || summary.top_categories.length === 0 ? (
                <div className="text-center text-xs text-white/40 py-6">No expenses logged</div>
              ) : (
                summary.top_categories.map((cat) => {
                  const categoryDetails = CATEGORY_MAP[cat.category] || CATEGORY_MAP.other
                  const emoji = categoryDetails.emoji
                  const label = categoryDetails.label
                  return (
                    <div key={cat.category} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{emoji}</span>
                          <span className="text-white/70">{label}</span>
                        </div>
                        <div className="flex items-center gap-2 font-numbers">
                          <span className="text-white/45">{cat.percentage}%</span>
                          <span className="text-white font-bold">{symbol}{cat.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 border border-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#7C5CFC] to-[#C850C0] h-full rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
