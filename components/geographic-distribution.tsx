"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const countries = [
  { rank: 1, name: "United States", code: "US", users: "8,945", growth: "+12.5%" },
  { rank: 2, name: "United Kingdom", code: "GB", users: "3,421", growth: "+8.3%" },
  { rank: 3, name: "Germany", code: "DE", users: "2,876", growth: "+15.2%" },
  { rank: 4, name: "Canada", code: "CA", users: "2,134", growth: "+9.7%" },
  { rank: 5, name: "Australia", code: "AU", users: "1,987", growth: "+11.4%" },
  { rank: 6, name: "France", code: "FR", users: "1,654", growth: "+6.8%" },
  { rank: 7, name: "Netherlands", code: "NL", users: "1,432", growth: "+13.9%" },
  { rank: 8, name: "Sweden", code: "SE", users: "987", growth: "+18.3%" }
]

const countryFlags = {
  US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", CA: "🇨🇦", 
  AU: "🇦🇺", FR: "🇫🇷", NL: "🇳🇱", SE: "🇸🇪"
}

export function GeographicDistribution() {
  return (
    <Card className="bg-black/20 backdrop-blur-xl border-white/10 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Geographic Distribution</CardTitle>
            <p className="text-white/60 text-sm mt-1">Global user and revenue breakdown</p>
          </div>
        </div>
        <div className="flex space-x-2 mt-4">
          <Button variant="secondary" size="sm">Users</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">Revenue</Button>
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">Growth</Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* World Map Placeholder */}
        <div className="mb-6 h-32 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg flex items-center justify-center border border-white/10">
          <div className="text-center">
            <div className="text-4xl mb-2">🌍</div>
            <p className="text-white/60 text-sm">Interactive world map</p>
            <p className="text-white/40 text-xs">(Will be connected to real data)</p>
          </div>
        </div>

        {/* Country Flags */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {Object.entries(countryFlags).map(([code, flag]) => (
            <div key={code} className="text-center p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
              <div className="text-2xl mb-1">{flag}</div>
              <div className="text-xs text-white/60">{code}</div>
            </div>
          ))}
        </div>

        {/* Top Countries List */}
        <div>
          <h4 className="text-sm font-medium text-white/80 mb-3">Top Countries by Users</h4>
          <div className="space-y-2">
            {countries.map((country) => (
              <div key={country.rank} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs font-bold">
                    {country.rank}
                  </div>
                  <div className="text-lg">{countryFlags[country.code as keyof typeof countryFlags]}</div>
                  <div>
                    <div className="font-medium text-sm">{country.name}</div>
                    <div className="text-white/60 text-xs">{country.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">{country.users}</div>
                  <div className="text-green-400 text-xs">{country.growth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
