"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

const plansData = [
  { name: 'Starter', value: 51, users: 12450, revenue: 124500, price: 10, color: '#8b5cf6' },
  { name: 'Professional', value: 36, users: 8932, revenue: 446600, price: 50, color: '#06b6d4' },
  { name: 'Team', value: 12, users: 2876, revenue: 287600, price: 100, color: '#10b981' },
  { name: 'Enterprise', value: 1, users: 309, revenue: 185400, price: 600, color: '#f59e0b' }
]

const totalUsers = plansData.reduce((sum, plan) => sum + plan.users, 0)
const totalRevenue = plansData.reduce((sum, plan) => sum + plan.revenue, 0)

export function SubscriptionPlans() {
  return (
    <Card className="bg-black/20 backdrop-blur-xl border-white/10 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Subscription Plans</CardTitle>
            <p className="text-white/60 text-sm mt-1">Distribution across pricing tiers</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={plansData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {plansData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
                <div className="text-white/60 text-sm">Total Users</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</div>
                <div className="text-white/60 text-sm">Total Revenue</div>
              </div>
            </div>

            {/* Plan Details */}
            <div className="space-y-3">
              {plansData.map((plan, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: plan.color }}
                      ></div>
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-white/60 text-sm">${plan.price}/user</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-white/60">Users</div>
                      <div className="font-medium">{plan.users.toLocaleString()}</div>
                      <div className="text-white/40 text-xs">{((plan.users / totalUsers) * 100).toFixed(1)}% of total</div>
                    </div>
                    <div>
                      <div className="text-white/60">Revenue</div>
                      <div className="font-medium">${(plan.revenue / 1000).toFixed(0)}K</div>
                      <div className="text-white/40 text-xs">{((plan.revenue / totalRevenue) * 100).toFixed(1)}% of total</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
