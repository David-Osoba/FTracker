import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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

const CATEGORY_EMOJIS = {
  food: '🍔',
  transport: '🚗',
  shopping: '🛍️',
  bills: '💵',
  entertainment: '🎬',
  health: '🏥',
  other: '🏷️'
}

const CURRENCY_SYMBOLS = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }

export default function Summary({ currency, startingBalance }) {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())

  const symbol = CURRENCY_SYMBOLS[currency] || '₦'

  // Fetch summary
  const { data: summary, isLoading } = useQuery({
    queryKey: ['summary', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/summary?year=${selectedYear}&month=${selectedMonth}`)
      if (!res.ok) throw new Error('Failed to fetch summary')
      return res.json()
    }
  })

  // Format currency
  const formatVal = (val) => {
    return symbol + parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  // Savings rate calculation
  const savingsRate = summary && summary.total_income > 0
    ? Math.max(0, Math.round((summary.net_savings / summary.total_income) * 100))
    : 0

  // Apply starting balance offset to daily running balances
  const lineChartData = summary?.line_chart_data
    ? summary.line_chart_data.map((item) => ({
        ...item,
        balance: item.balance + parseFloat(startingBalance || 0)
      }))
    : []

  return (
    <div className="flex flex-col gap-4 px-4 py-4 select-none pb-8">
      
      {/* Header & Month Picker */}
      <header className="flex flex-col justify-between items-start gap-3 border-b border-white/5 pb-3">
        <div>
          <h2 className="text-xl font-display font-extrabold">Monthly Analytics</h2>
          <p className="text-xs text-white/50">Deeper insights into your cashflow</p>
        </div>

        {/* Month Selector */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-0.5 w-full overflow-x-auto max-w-full no-scrollbar">
          {MONTHS.map((m) => {
            const isActive = selectedMonth === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelectedMonth(m.value)}
                className={`relative px-3 py-2 text-[10px] font-bold rounded-xl transition duration-300 focus:outline-none bg-transparent border-none ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-summary-month"
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

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {/* Income Card */}
          <div className="glass-panel rounded-2xl p-3.5 border border-white/10 bg-white/5 flex flex-col justify-between">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-0.5">Earned</span>
            <span className="text-xs font-extrabold text-success font-numbers truncate">
              +{symbol}{summary?.total_income?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Expenses Card */}
          <div className="glass-panel rounded-2xl p-3.5 border border-white/10 bg-white/5 flex flex-col justify-between">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-0.5">Spent</span>
            <span className="text-xs font-extrabold text-danger font-numbers truncate">
              -{symbol}{summary?.total_expense?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Savings Rate Card */}
          <div className="glass-panel rounded-2xl p-3.5 border border-white/10 bg-white/5 flex flex-col justify-between">
            <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-0.5">Saved</span>
            <span className="text-xs font-extrabold text-highlight font-numbers truncate">
              {savingsRate}%
            </span>
          </div>
        </div>
      )}

      {/* Line Chart: Daily Wealth Balance */}
      <div className="glass-panel rounded-[24px] p-5 border border-white/10 relative overflow-hidden min-h-[300px]">
        <div className="mb-4">
          <h3 className="text-sm font-display font-bold">Daily Wealth Balance</h3>
          <p className="text-[9px] text-white/40">Tracking absolute balance fluctuations</p>
        </div>

        <div className="h-52 w-full">
          {isLoading ? (
            <div className="h-full w-full bg-white/5 animate-pulse rounded-xl" />
          ) : lineChartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-white/40 text-xs">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5CFC" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7C5CFC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={8} 
                  tickLine={false} 
                  dy={5}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={8} 
                  tickLine={false} 
                  tickFormatter={formatVal}
                  dx={-5}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(13, 13, 26, 0.95)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontFamily: 'Inter',
                    fontSize: '10px'
                  }}
                  formatter={(val) => [`${symbol}${parseFloat(val).toLocaleString()}`, 'Balance']}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#7C5CFC" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#balanceGrad)" 
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
          {isLoading ? (
            <div className="h-full w-full bg-white/5 animate-pulse rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.bar_chart_data} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="week" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={8} 
                  tickLine={false} 
                  dy={5}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={8} 
                  tickLine={false} 
                  tickFormatter={formatVal}
                  dx={-5}
                />
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
                <Bar dataKey="income" fill="#00F5A0" radius={[4, 4, 0, 0]} maxBarSize={18} name="Income" />
                <Bar dataKey="expense" fill="#FF4D6D" radius={[4, 4, 0, 0]} maxBarSize={18} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Spending Categories List */}
      <div className="glass-panel rounded-[24px] p-5 border border-white/10 relative">
        <div className="mb-4">
          <h3 className="text-sm font-display font-bold">Top Spending Categories</h3>
          <p className="text-[9px] text-white/40">Highest spending areas ranked</p>
        </div>

        <div className="flex flex-col gap-3 max-h-52 overflow-y-auto pr-1 no-scrollbar">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-full rounded-xl bg-white/5 animate-pulse" />
            ))
          ) : !summary?.top_categories || summary.top_categories.length === 0 ? (
            <div className="text-center text-xs text-white/40 py-6">No expenses logged</div>
          ) : (
            summary.top_categories.map((cat) => {
              const emoji = CATEGORY_EMOJIS[cat.category] || '🏷'
              return (
                <div key={cat.category} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{emoji}</span>
                      <span className="capitalize text-white/70">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2 font-numbers">
                      <span className="text-white/45">{cat.percentage}%</span>
                      <span className="text-white font-bold">{symbol}{cat.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 border border-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-hero-gradient h-full rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
