# Ocean City - Fleet Management System

A comprehensive fleet management system built with React, TypeScript, and Supabase for managing trucks, trailers, drivers, and shipments.

## 🚀 Features

- **Fleet Management**: Manage trucks, trailers, and their assignments
- **Driver Management**: Track drivers and their vehicle assignments
- **Company Management**: Organize and manage transportation companies
- **Shipment Tracking**: Monitor shipments and their status
- **User Authentication**: Secure login and role-based access control
- **Real-time Updates**: Live data synchronization with Supabase
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/bossbee4u/oceancity.git
cd oceancity
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and utilities
├── lib/                # Utility functions
├── pages/              # Application pages/routes
│   ├── admin/          # Admin-only pages
│   └── ...
└── types/              # TypeScript type definitions
```

## 🗄️ Database Schema

The application uses the following main tables:
- `profiles` - User profiles with roles (admin/manager)
- `drivers` - Driver information and assignments
- `companies` - Transportation companies
- `trucks` - Fleet vehicles with tracking data
- `trailers` - Trailer inventory with types and colors
- `shipments` - Shipment tracking and status

## 🚀 Deployment

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

## 🔧 Development

### Available Scripts:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Quality:
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting (via shadcn/ui)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)