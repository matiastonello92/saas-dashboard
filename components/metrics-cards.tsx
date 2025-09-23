"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useDashboardMetrics } from '@/lib/hooks/useDashboardMetrics';

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
  // LIVE DATA: carica metriche reali (fallback su mock esistente)
  const { data: liveMetrics, isLoading: isLoadingMetrics, isError: isErrorMetrics } = useDashboardMetrics();

  // Helper che fonde live->mock mantenendo compatibilità con il widget
  function mergeMetrics<T extends Record<string, any>>(mockObj: T | null | undefined, liveObj: any | null | undefined): T | any {
    // Se live disponibile, preferiscilo; altrimenti mock.
    if (liveObj && typeof liveObj === 'object') {
      // Merge superficiale: live sovrascrive mock quando la chiave esiste
      return mockObj ? { ...mockObj, ...liveObj } : liveObj;
    }
    return mockObj ?? null;
  }

  // FONTE EFFETTIVA: live > mock (non distruttivo)
  const EFFECTIVE_METRICS = mergeMetrics(
    typeof metrics !== 'undefined' ? metrics : null,
    liveMetrics
  );

  // Stati di caricamento/errore senza toccare il markup
  const isLoadingMetricsUI = typeof isLoadingMetrics !== 'undefined' ? isLoadingMetrics : false;
  const isErrorMetricsUI = typeof isErrorMetrics !== 'undefined' ? isErrorMetrics : false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {(EFFECTIVE_METRICS || metrics).map((metric, index) => (
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
