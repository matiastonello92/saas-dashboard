"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'

const data = [
  { month: 'Nov 2024', ARR: 5200000, MRR: 433333 },
  { month: 'Dec 2024', ARR: 5500000, MRR: 458333 },
  { month: 'Jan 2025', ARR: 5800000, MRR: 483333 },
  { month: 'Feb 2025', ARR: 6200000, MRR: 516667 },
  { month: 'Mar 2025', ARR: 6600000, MRR: 550000 },
  { month: 'Apr 2025', ARR: 7000000, MRR: 583333 },
  { month: 'May 2025', ARR: 7500000, MRR: 625000 },
  { month: 'Jun 2025', ARR: 8000000, MRR: 666667 },
  { month: 'Jul 2025', ARR: 8600000, MRR: 716667 },
  { month: 'Aug 2025', ARR: 9200000, MRR: 766667 },
  { month: 'Sep 2025', ARR: 10000000, MRR: 833333 }
]

export function RevenueChart() {
  return (
    <Card className="bg-black/20 backdrop-blur-xl border-white/10 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Revenue Analytics</CardTitle>
            <p className="text-white/60 text-sm mt-1">Track your recurring revenue and growth</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">7D</Button>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">30D</Button>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">90D</Button>
              <Button variant="secondary" size="sm">1Y</Button>
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              Export
            </Button>
          </div>
        </div>
        <div className="flex space-x-2 mt-4">
          <Badge variant="secondary" className="bg-purple-600 text-white">MRR</Badge>
          <Badge variant="outline" className="border-white/20 text-white/80">ARR</Badge>
          <Badge variant="outline" className="border-white/20 text-white/80">Churn Rate</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="ARR" 
                stroke="#06b6d4" 
                strokeWidth={3}
                dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                name="ARR"
              />
              <Line 
                type="monotone" 
                dataKey="MRR" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                name="MRR"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
