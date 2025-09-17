# Klyra SaaS Dashboard

A modern, responsive SaaS management dashboard built with Next.js, TypeScript, and shadcn/ui.

## Features

- **Dashboard Overview**: Key metrics including MRR, Active Users, Churn Rate, and CAC
- **Revenue Analytics**: Interactive charts showing ARR and MRR trends over time
- **Live Activity Feed**: Real-time user actions and events
- **Geographic Distribution**: Global user breakdown with country-specific data
- **Subscription Plans**: Visual breakdown of pricing tiers with pie charts
- **Responsive Design**: Mobile-friendly with collapsible sidebar navigation
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Klyra Branding**: Custom purple-blue gradient theme

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/matiastonello92/saas-dashboard.git
cd saas-dashboard
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Run the development server:
```bash
bun dev
# or
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── dashboard-layout.tsx
│   ├── metrics-cards.tsx
│   ├── revenue-chart.tsx
│   ├── live-activity.tsx
│   ├── geographic-distribution.tsx
│   └── subscription-plans.tsx
├── lib/
│   └── utils.ts
└── hooks/
    └── use-mobile.ts
```

## API Integration

The dashboard is built with API integration in mind. Each component uses mock data that can be easily replaced with real API calls:

- **MetricsCards**: Replace mock metrics with API calls to your analytics endpoints
- **RevenueChart**: Connect to your revenue/billing API
- **LiveActivity**: Integrate with real-time event streams
- **GeographicDistribution**: Connect to user analytics API
- **SubscriptionPlans**: Link to your subscription management system

## Customization

### Branding
- Update the logo and colors in `components/dashboard-layout.tsx`
- Modify the gradient theme in the Tailwind classes
- Replace placeholder brand elements with actual Klyra assets

### Data Sources
- Replace mock data in each component with API calls
- Add loading states and error handling
- Implement real-time updates where needed

## Deployment

The dashboard can be deployed to any platform that supports Next.js:

- **Vercel**: `vercel deploy`
- **Netlify**: Connect your GitHub repository
- **Docker**: Use the included Dockerfile (if added)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
