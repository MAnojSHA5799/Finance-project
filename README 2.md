# Personal Finance Tracker

A comprehensive full-stack personal finance management application with role-based access control, real-time analytics, and beautiful responsive UI.

![Finance Tracker](https://img.shields.io/badge/Finance-Tracker-blue)
![React](https://img.shields.io/badge/React-18+-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-16+-339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791)
![Redis](https://img.shields.io/badge/Redis-6+-dc382d)

## 🚀 Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with secure token handling
- **Role-Based Access Control (RBAC)** with three user roles:
  - **Admin**: Full access to all features and user management
  - **User**: Can manage their own transactions and view analytics
  - **Read-only**: Can only view data, no modification permissions
- **Password hashing** with bcrypt and salt rounds
- **Session management** with automatic token refresh

### 💰 Transaction Management
- **CRUD operations** for income and expense transactions
- **Category-based organization** with customizable categories
- **Advanced filtering and search** capabilities
- **Pagination** for large transaction lists
- **Bulk operations** support

### 📊 Analytics & Reporting
- **Real-time financial analytics** with interactive charts
- **Multiple chart types**: Pie charts, line charts, bar charts
- **Monthly/yearly trends** analysis
- **Category-wise breakdown** of expenses and income
- **Savings rate calculation** and financial insights
- **Export capabilities** for reports

### ⚡ Performance & Caching
- **Redis caching** for frequently accessed data
- **Database connection pooling** for optimal performance
- **Lazy loading** for components and routes
- **Rate limiting** to prevent API abuse
- **Optimized queries** with proper indexing

### 🛡️ Security Features
- **Input validation** with express-validator
- **SQL injection prevention** using parameterized queries
- **XSS protection** with helmet middleware
- **CORS configuration** for secure cross-origin requests
- **Rate limiting** with different limits for different endpoints

### 🎨 Modern UI/UX
- **Responsive design** that works on all devices
- **Dark/Light mode** with system preference detection
- **Beautiful charts** using Recharts library
- **Intuitive navigation** with sidebar layout
- **Loading states** and error handling
- **Form validation** with real-time feedback

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL 12+
- **Caching**: Redis 6+
- **Authentication**: JWT
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form with Yup
- **Icons**: Heroicons
- **Routing**: React Router DOM
- **HTTP Client**: Axios

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** 16 or higher
- **PostgreSQL** 12 or higher
- **Redis** 6 or higher
- **npm** or **yarn** package manager

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd finance-tracker
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp config.env.example config.env

# Edit environment variables
nano config.env
```

Configure your environment variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

```bash
# Create database
createdb finance_tracker

# Run schema
psql -d finance_tracker -f config/schema.sql
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 5. Start the Application

```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory, in new terminal)
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👥 Demo Accounts

For testing purposes, you can use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| User | user@demo.com | user123 |
| Read-only | readonly@demo.com | readonly123 |

## 📁 Project Structure

```
finance-tracker/
├── backend/                 # Backend API
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── frontend/               # Frontend application
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   └── package.json       # Frontend dependencies
└── README.md              # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:userId/role` - Update user role (admin only)

### Transactions
- `GET /api/transactions` - Get user transactions
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Analytics
- `GET /api/analytics/dashboard` - Get user analytics
- `GET /api/analytics/categories` - Get category analytics
- `GET /api/analytics/trends` - Get spending trends

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

## 🔒 Security Features

### Authentication
- JWT tokens with configurable expiration
- Secure password hashing with bcrypt
- Automatic token refresh mechanism
- Session management

### Authorization
- Role-based access control (RBAC)
- Route-level permissions
- Conditional UI rendering based on user role
- Admin-only features protection

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting

## 📊 Analytics Features

### Financial Overview
- Total income and expenses
- Net income calculation
- Savings rate analysis
- Transaction count statistics

### Visual Analytics
- **Pie Charts**: Category breakdown
- **Line Charts**: Monthly trends
- **Bar Charts**: Income vs expenses comparison
- **Interactive Tooltips**: Detailed information on hover

### Filtering & Periods
- Monthly and yearly views
- Custom date ranges
- Category-based filtering
- Type-based filtering (income/expense)

## 🚀 Deployment

### Backend Deployment

1. **Set environment variables** for production
2. **Configure database** with production credentials
3. **Set up Redis** for caching
4. **Use PM2** for process management
5. **Configure SSL/TLS** certificates
6. **Set up monitoring** and logging

### Frontend Deployment

1. **Build the application**: `npm run build`
2. **Deploy to static hosting** (Netlify, Vercel, etc.)
3. **Configure environment variables**
4. **Set up custom domain** if needed

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information
4. Contact the maintainers

## 🔮 Future Enhancements

- [ ] Mobile app development
- [ ] Budget planning features
- [ ] Investment tracking
- [ ] Bill reminders
- [ ] Multi-currency support
- [ ] Advanced reporting
- [ ] Data import/export
- [ ] API rate limiting dashboard
- [ ] Real-time notifications
- [ ] Integration with banking APIs

---

**Built with ❤️ using modern web technologies**
