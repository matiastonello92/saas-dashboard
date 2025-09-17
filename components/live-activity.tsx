"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw } from "lucide-react"

const activities = [
  {
    id: 1,
    user: "New User",
    action: "signup",
    emoji: "👋",
    description: "signed up for Professional plan",
    time: "less than a minute ago",
    amount: "+$114",
    type: "signup"
  },
  {
    id: 2,
    user: "New User",
    action: "upgrade",
    emoji: "⬆️",
    description: "upgraded to Professional plan",
    time: "less than a minute ago",
    amount: "+$165",
    type: "upgrade"
  },
  {
    id: 3,
    user: "New User",
    action: "upgrade",
    emoji: "⬆️",
    description: "upgraded to Professional plan",
    time: "less than a minute ago",
    amount: "+$525",
    type: "upgrade"
  },
  {
    id: 4,
    user: "New User",
    action: "payment",
    emoji: "💳",
    description: "made a payment of $123",
    time: "1 minute ago",
    amount: "+$123",
    type: "payment"
  },
  {
    id: 5,
    user: "New User",
    action: "signup",
    emoji: "👋",
    description: "signed up for Professional plan",
    time: "1 minute ago",
    amount: "+$229",
    type: "signup"
  },
  {
    id: 6,
    user: "Sarah Chen",
    action: "downgrade",
    emoji: "⬇️",
    description: "downgraded to Starter plan",
    time: "1 day ago",
    amount: "+$536",
    type: "downgrade"
  },
  {
    id: 7,
    user: "Maria Garcia",
    action: "payment",
    emoji: "💳",
    description: "made a payment of $601",
    time: "1 day ago",
    amount: "+$601",
    type: "payment"
  },
  {
    id: 8,
    user: "Jessica Taylor",
    action: "cancellation",
    emoji: "❌",
    description: "cancelled their subscription",
    time: "2 days ago",
    amount: "",
    type: "cancellation"
  }
]

export function LiveActivity() {
  return (
    <Card className="bg-black/20 backdrop-blur-xl border-white/10 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Live Activity</CardTitle>
            <p className="text-white/60 text-sm mt-1">Real-time user actions</p>
          </div>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="flex space-x-2 mt-4">
          <Button variant="secondary" size="sm">All</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">Signups</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">Upgrades</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">Payments</Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">{activity.emoji}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{activity.user}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs border-white/20 ${
                          activity.type === 'signup' ? 'text-green-400' :
                          activity.type === 'upgrade' ? 'text-blue-400' :
                          activity.type === 'payment' ? 'text-purple-400' :
                          activity.type === 'downgrade' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}
                      >
                        {activity.action}
                      </Badge>
                    </div>
                    <p className="text-white/60 text-sm">{activity.description}</p>
                    <p className="text-white/40 text-xs">{activity.time}</p>
                  </div>
                </div>
                {activity.amount && (
                  <div className="text-green-400 font-medium text-sm">
                    {activity.amount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
