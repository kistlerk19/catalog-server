# Product Catalog API

A full-stack product catalog application with a Flask RESTful API backend and React TypeScript frontend.

**Author**: Ishmael Gyamfi  
**Last Updated**: June 16, 2025

## Features

- **User Authentication**: Register, login, and profile management with JWT
- **Product Management**: Create, read, update, and delete products
- **Advanced Search**: Filter products by name, category, price range, and more
- **Role-Based Access Control**: Different permissions for users and administrators
- **Responsive UI**: Modern interface built with React and Tailwind CSS

## Todo

- **Rate Limiting**: Implement API rate limiting to prevent abuse

## Tech Stack

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: ORM for database interactions
- **Flask-JWT-Extended**: Authentication with JSON Web Tokens
- **PostgreSQL**: Relational database
- **Flask-Migrate**: Database migrations
- **Flask-CORS**: Cross-Origin Resource Sharing support

### Frontend
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Headless UI**: Unstyled, accessible UI components

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables (create a .env file):
```
DATABASE_URL=postgresql://catalog_user:catalog_pass@localhost/catalog
JWT_SECRET_KEY=your_secret_key
SECRET_KEY=another_secret_key
```

4. Set up the database:
```bash
# Create PostgreSQL database named 'catalog' with user 'catalog_user' and password 'catalog_pass'
flask db upgrade
```

5. Create sample data (optional):
```bash
flask create-sample-data
```

6. Run the Flask application:
```bash
flask run
```

The API will be available at http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm start
# or
pnpm start
```

The frontend will be available at http://localhost:3000

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get access token
- `POST /auth/logout` - Logout (invalidate token)
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update user profile

### Products
- `GET /products` - List all products with search and filtering
- `GET /products/search` - Advanced search for products
- `GET /products/categories` - Get all product categories
- `GET /products/search/suggestions` - Get search suggestions
- `GET /products/:id` - Get a specific product
- `POST /products` - Create a new product (authenticated)
- `PUT /products/:id` - Update a product (owner or admin)
- `DELETE /products/:id` - Delete a product (owner or admin)

### User Products
- `GET /my/products` - Get current user's products

### Admin
- `GET /admin/users` - Get all users (admin only)
- `PUT /admin/users/:id` - Update user role and status (admin only)
- `GET /admin/products` - Get all products including inactive ones (admin only)

## Building for Production

1. Build the React frontend:
```bash
cd frontend
npm run build
# or
pnpm build
```

2. Run the Flask application:
```bash
cd ..
gunicorn app:app
```

## Development

### Database Migrations

When making changes to the database models:

```bash
flask db migrate -m "Description of changes"
flask db upgrade
```
