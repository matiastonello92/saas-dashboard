"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { MetricsCards } from "@/components/metrics-cards"
import { RevenueChart } from "@/components/revenue-chart"
import { LiveActivity } from "@/components/live-activity"
import { GeographicDistribution } from "@/components/geographic-distribution"
import { SubscriptionPlans } from "@/components/subscription-plans"

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Key Metrics */}
        <MetricsCards />
        
        {/* Revenue Analytics Chart */}
        <RevenueChart />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Activity Feed */}
          <LiveActivity />
          
          {/* Geographic Distribution */}
          <GeographicDistribution />
        </div>
        
        {/* Subscription Plans */}
        <SubscriptionPlans />
      </div>
    </DashboardLayout>
  )
}
