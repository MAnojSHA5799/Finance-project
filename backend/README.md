# Finance Tracker Backend API

A robust Node.js backend API for the Personal Finance Tracker application with role-based access control, caching, and comprehensive financial analytics.

## Features

- 🔐 **JWT Authentication** with role-based access control
- 👥 **User Management** with three roles: admin, user, read-only
- 💰 **Transaction Management** with CRUD operations
- 📊 **Financial Analytics** with charts and insights
- 🏷️ **Category Management** for organizing transactions
- ⚡ **Redis Caching** for improved performance
- 🛡️ **Security Features** including rate limiting and input validation
- 📈 **Real-time Analytics** with monthly/yearly trends

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Caching**: Redis
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express-validator

## Prerequisites

- Node.js 16 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp config.env.example config.env
   ```
   
   Edit `config.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=finance_tracker
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h
   
   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb finance_tracker
   
   # Run schema
   psql -d finance_tracker -f config/schema.sql
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

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
- `GET /api/categories/:id` - Get single category
- `GET /api/categories/stats/user` - Get user category stats
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

## Role-Based Access Control

### Admin Role
- Full access to all features
- Can manage users and their roles
- Can create, update, and delete categories
- Can view all user data

### User Role
- Can manage their own transactions
- Can view their own analytics
- Cannot access other users' data
- Cannot manage categories

### Read-Only Role
- Can only view their own transactions and analytics
- Cannot add, edit, or delete anything
- Perfect for auditors or family members

## Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt with salt rounds
- **Input Validation** with express-validator
- **Rate Limiting** with different limits for different endpoints
- **CORS Protection** with configurable origins
- **Helmet Security Headers** for XSS protection
- **SQL Injection Prevention** using parameterized queries

## Performance Features

- **Redis Caching** for frequently accessed data
- **Database Connection Pooling** for efficient database connections
- **Lazy Loading** support for large datasets
- **Pagination** for transaction lists
- **Optimized Queries** with proper indexing

## Error Handling

- Comprehensive error handling with appropriate HTTP status codes
- Detailed error messages for debugging
- Graceful shutdown handling
- Uncaught exception and unhandled rejection handling

## Development

### Running in Development Mode
```bash
npm run dev
```

### Environment Variables
- `NODE_ENV`: Set to 'development' for development mode
- `PORT`: Server port (default: 5000)
- `DB_*`: Database configuration
- `REDIS_*`: Redis configuration
- `JWT_*`: JWT configuration
- `CORS_ORIGIN`: Allowed CORS origins

### Database Schema
The database schema includes:
- Users table with role-based access
- Categories table for transaction categorization
- Transactions table with user relationships
- Proper indexes for performance
- Triggers for automatic timestamp updates

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure proper CORS origins
4. Set up SSL/TLS certificates
5. Use a process manager like PM2
6. Configure proper logging
7. Set up monitoring and health checks

## Health Check

The API includes a health check endpoint:
```
GET /health
```

Returns server status and basic information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
