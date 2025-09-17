"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

const metrics = [
  {
    title: "Monthly Recurring Revenue",
    value: "$847,250",
    change: "+12.5%",
    trend: "up"
  },
  {
    title: "Active Users",
    value: "24,567",
    change: "+8.3%",
    trend: "up"
  },
  {
    title: "Churn Rate",
    value: "2.4%",
    change: "-0.8%",
    trend: "down"
  },
  {
    title: "Customer Acquisition Cost",
    value: "$127",
    change: "-5.2%",
    trend: "down"
  }
]

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-black/20 backdrop-blur-xl border-white/10 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">
              {metric.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className={`flex items-center text-sm ${
                metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {metric.change}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
