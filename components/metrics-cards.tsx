"use client";

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useDashboardMetrics } from '@/lib/hooks/useDashboardMetrics';

type MetricCard = {
  title: string;
  value: ReactNode;
  change?: string;
  trend?: 'up' | 'down';
};

const metrics: MetricCard[] = [
  {
    title: "Monthly Recurring Revenue",
    value: "$847,250",
    change: "+12.5%",
    trend: "up"
  },
  {
    title: "Active Users",
    value: "—",
    change: "—",
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

function isMetricCard(value: unknown): value is MetricCard {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.title !== 'string' || typeof candidate.value !== 'string') {
    return false;
  }

  if ('change' in candidate && candidate.change !== undefined && typeof candidate.change !== 'string') {
    return false;
  }

  if ('trend' in candidate && candidate.trend !== undefined) {
    return candidate.trend === 'up' || candidate.trend === 'down';
  }

  return true;
}

export function MetricsCards() {
  const { data: liveMetrics, activeUsers } = useDashboardMetrics();

  let liveMetricList: MetricCard[] = [];

  if (Array.isArray(liveMetrics)) {
    liveMetricList = liveMetrics.filter(isMetricCard);
  } else if (liveMetrics && typeof liveMetrics === 'object') {
    liveMetricList = Object.values(liveMetrics as Record<string, unknown>).filter(isMetricCard);
  }

  const source: MetricCard[] = liveMetricList.length > 0 ? liveMetricList : metrics;

  const activeUsersValue: React.ReactNode = (() => {
    if (activeUsers.status === 'loading') {
      return (
        <span className="inline-flex items-center gap-2 text-base text-white/80">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading
        </span>
      );
    }
    if (activeUsers.status === 'error') {
      return '—';
    }
    if (typeof activeUsers.value === 'number') {
      return activeUsers.value.toLocaleString();
    }
    return '—';
  })();

  const metricsWithActive = source.map((metric) => {
    if (metric.title !== 'Active Users') {
      return metric;
    }
    return {
      ...metric,
      value: activeUsersValue,
      change: metric.change ?? '—',
      trend: metric.trend ?? 'up',
    } satisfies MetricCard;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsWithActive.map((metric, index) => {
        const trend = metric.trend === 'down' ? 'down' : 'up';
        const change = metric.change ?? '—';

        return (
          <Card key={index} className="bg-black/20 backdrop-blur-xl border-white/10 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {typeof metric.value === 'string' || typeof metric.value === 'number'
                    ? metric.value
                    : metric.value ?? '—'}
                </div>
                <div className={`flex items-center text-sm ${
                  trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {change}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
