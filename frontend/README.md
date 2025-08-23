# Finance Tracker Frontend

A modern React TypeScript frontend for the Personal Finance Tracker application with beautiful UI and comprehensive features.

## Features

- 🎨 **Modern UI** with Tailwind CSS and responsive design
- 🌙 **Dark/Light Mode** with system preference detection
- 📱 **Mobile Responsive** with touch-friendly interface
- ⚡ **Performance Optimized** with lazy loading and code splitting
- 🔐 **Role-Based Access** with conditional rendering
- 📊 **Interactive Charts** with Recharts library
- 🎯 **Form Validation** with React Hook Form and Yup
- 🔄 **Real-time Updates** with optimistic UI updates

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form with Yup validation
- **Icons**: Heroicons
- **Routing**: React Router DOM
- **State Management**: React Context with useReducer
- **HTTP Client**: Axios

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts for state management
├── pages/              # Page components
├── services/           # API services
├── types/              # TypeScript type definitions
├── App.tsx            # Main app component
└── index.tsx          # Entry point
```

## Key Components

- **Layout**: Main layout with sidebar navigation
- **ProtectedRoute**: Route protection with role-based access
- **LoadingSpinner**: Reusable loading component
- **Charts**: Various chart components using Recharts

## Pages

- **Dashboard**: Overview with analytics and charts
- **Transactions**: Transaction management with CRUD operations
- **Analytics**: Detailed financial analytics
- **Profile**: User profile management
- **Admin**: Admin panel for user management
- **Login/Register**: Authentication pages

## Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Ensure responsive design
4. Test on multiple devices
5. Update documentation as needed
