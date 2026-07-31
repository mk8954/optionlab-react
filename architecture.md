src/
├── assets/                 # Images, icons, logos
├── components/             # Reusable UI (Buttons, Modals, Cards)
│   ├── ui/                 # Generic UI components
│   └── shared/             # App-specific shared components (Navbar)
├── features/               # Feature-specific logic and views
│   ├── dashboard/          # Dashboard screen and widgets
│   ├── optionChain/        # Option chain logic and UI
│   ├── trading/            # Order execution, TradeScreen
│   ├── portfolio/          # Open Positions, Wallet, Ledger
│   └── analytics/          # Journal, Heatmaps, Equity curves
├── hooks/                  # Custom hooks for dynamic calculations
│   ├── useAnalytics.js     # Calculates all stats from trades dynamically
│   ├── useRulesEngine.js   # Validates if a trade can be taken
│   └── useExpiries.js      # Auto-generates the next 4 expiries
├── store/                  # Global State (Single Source of Truth)
│   └── useStore.js         # Zustand store (Settings, Wallet, Trades, etc.)
├── utils/                  # Helper functions
│   ├── formatters.js       # Currency and date formatters
│   ├── calculations.js     # Options pricing/margin math
│   └── backup.js           # JSON export/import handlers
└── App.jsx                 # Main layout and routing
