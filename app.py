#!/usr/bin/env python3

import os, re
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData, or_, and_, func, desc, asc
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from flask_cors import CORS

from flask_migrate import Migrate
from flask.cli import with_appcontext
import click



load_dotenv()

app = Flask(__name__, static_folder='frontend/build', static_url_path='')
# configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "postgresql://catalog_user:catalog_pass@localhost/catalog")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-key-for-testing")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600)))
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
app.config["JWT_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Set to True in production
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"

# Print JWT configuration for debugging
print("JWT Configuration:")
print(f"JWT_SECRET_KEY: {'set' if app.config['JWT_SECRET_KEY'] else 'not set'}")
print(f"JWT_TOKEN_LOCATION: {app.config['JWT_TOKEN_LOCATION']}")
print(f"JWT_HEADER_NAME: {app.config['JWT_HEADER_NAME']}")
print(f"JWT_HEADER_TYPE: {app.config['JWT_HEADER_TYPE']}")

# Enable CORS with credentials support
CORS(app, supports_credentials=True)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# ✅ Global schema set here
metadata = MetaData(schema="catalog")

# initialize extensions
db = SQLAlchemy(app, metadata=metadata)
jwt = JWTManager(app)

migrate = Migrate(app, db)

blacklisted_tokens = set()

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    print("Checking token:", jwt_payload['jti'])
    is_blacklisted = jwt_payload['jti'] in blacklisted_tokens
    print("Is blacklisted:", is_blacklisted)
    return is_blacklisted

# User Model
class User(db.Model):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='user')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    def __repr__(self):
        return f"<User id={self.id} username='{self.username}' role={self.role}>"


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))  # Added category for better search
    tags = db.Column(db.String(500))  # Added tags for search
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    creator = db.relationship('User', backref=db.backref('products', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'category': self.category,
            'tags': self.tags,
            'created_by': self.created_by,
            'creator_username': self.creator.username if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active
        }
    def __repr__(self):
    	return f"<Product id={self.id} name='{self.name}' price={self.price}>"

# Role-based access control decorator
def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)

            if not current_user or not current_user.is_active:
                return jsonify({'message': 'User not found or inactive'}), 401

            if current_user.role not in roles:
                return jsonify({'message': 'Insufficient permissions'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Admin only decorator
def admin_required(f):
    return role_required('admin')(f)


def validate_password(password):
    """Enhanced password validation"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is valid"

# Search Helper Functions
def build_product_search_query(query_params):
    """Build search query based on parameters"""
    search_query = Product.query.filter_by(is_active=True)
    
    # Text search (name, description, tags)
    if 'q' in query_params and query_params['q']:
        search_term = f"%{query_params['q']}%"
        search_query = search_query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.tags.ilike(search_term)
            )
        )
    
    # Category filter
    if 'category' in query_params and query_params['category']:
        search_query = search_query.filter(Product.category.ilike(f"%{query_params['category']}%"))
    
    # Price range filters
    if 'min_price' in query_params and query_params['min_price']:
        try:
            min_price = float(query_params['min_price'])
            search_query = search_query.filter(Product.price >= min_price)
        except ValueError:
            pass
    
    if 'max_price' in query_params and query_params['max_price']:
        try:
            max_price = float(query_params['max_price'])
            search_query = search_query.filter(Product.price <= max_price)
        except ValueError:
            pass
    
    # Date range filters
    if 'date_from' in query_params and query_params['date_from']:
        try:
            date_from = datetime.fromisoformat(query_params['date_from'])
            search_query = search_query.filter(Product.created_at >= date_from)
        except ValueError:
            pass
    
    if 'date_to' in query_params and query_params['date_to']:
        try:
            date_to = datetime.fromisoformat(query_params['date_to'])
            search_query = search_query.filter(Product.created_at <= date_to)
        except ValueError:
            pass
    
    # Creator filter
    if 'created_by' in query_params and query_params['created_by']:
        try:
            creator_id = int(query_params['created_by'])
            search_query = search_query.filter(Product.created_by == creator_id)
        except ValueError:
            pass
    
    # Creator username filter
    if 'creator_username' in query_params and query_params['creator_username']:
        search_query = search_query.join(User).filter(
            User.username.ilike(f"%{query_params['creator_username']}%")
        )
    
    return search_query

def apply_sorting(query, sort_by, sort_order='asc'):
    """Apply sorting to query"""
    sort_order = sort_order.lower()
    order_func = asc if sort_order == 'asc' else desc
    
    if sort_by == 'name':
        return query.order_by(order_func(Product.name))
    elif sort_by == 'price':
        return query.order_by(order_func(Product.price))
    elif sort_by == 'created_at':
        return query.order_by(order_func(Product.created_at))
    elif sort_by == 'updated_at':
        return query.order_by(order_func(Product.updated_at))
    elif sort_by == 'category':
        return query.order_by(order_func(Product.category))
    else:
        # Default sort by created_at desc
        return query.order_by(desc(Product.created_at))

def paginate_query(query, page=1, per_page=10):
    """Apply pagination to query"""
    try:
        page = max(1, int(page))
        per_page = min(100, max(1, int(per_page)))  # Limit per_page to 100
    except (ValueError, TypeError):
        page = 1
        per_page = 10
    
    return query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

@app.cli.command("create-sample-data")
@with_appcontext
def create_sample_data_command():
    """Create sample admin user and products for testing"""
    create_sample_data()
    click.echo("Sample data created successfully")

# Authentication Routes

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validation
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    is_valid, message = validate_password(data['password'])
    if not is_valid:
        return jsonify({'message': message}), 400

    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 409

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 409

    # Password strength validation
    password = data['password']
    if len(password) < 8:
        return jsonify({'message': 'Password must be at least 8 characters long'}), 400

    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'user')  # Default to 'user' role
    )
    user.set_password(password)

    # First user becomes admin
    if User.query.count() == 0:
        user.role = 'admin'

    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

@app.route('/auth/login', methods=['POST', 'OPTIONS'])
def login():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response, 200
        
    data = request.get_json()
    print("Login request:", data)

    if not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Username and password are required'}), 400

    user = User.query.filter_by(username=data['username']).first()
    print("User found:", user)

    if user and user.check_password(data['password']) and user.is_active:
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Create access token with explicit expiration
        expires = datetime.utcnow() + timedelta(hours=24)  # Extend token validity
        access_token = create_access_token(
            identity=str(user.id),  # Convert ID to string
            additional_claims={
                'role': user.role, 
                'username': user.username
            },
            expires_delta=timedelta(hours=24)
        )
        print("Generated token:", access_token)

        response = jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        })
        
        # Set JWT as an HTTP-only cookie as well
        response.set_cookie(
            'access_token_cookie',
            access_token,
            httponly=True,
            max_age=86400,  # 24 hours
            path='/',
            samesite='Lax'
        )
        
        # Add CORS headers explicitly
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        
        return response, 200

    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()['jti']
    blacklisted_tokens.add(jti)
    
    response = jsonify({'message': 'Successfully logged out'})
    # Clear the cookie
    response.delete_cookie('access_token_cookie', path='/')
    
    return response, 200

@app.route('/auth/profile', methods=['GET', 'OPTIONS'])
def get_profile():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Headers', 'Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET')
        return response, 200
        
    # Print debug info
    print("Headers:", dict(request.headers))
    print("Cookies:", dict(request.cookies))
    
    # Get token from Authorization header
    auth_header = request.headers.get('Authorization')
    token = None
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        print("Token from header:", token)
    
    # If no token in header, try cookie
    if not token and 'access_token_cookie' in request.cookies:
        token = request.cookies.get('access_token_cookie')
        print("Token from cookie:", token)
    
    if not token:
        return jsonify({'message': 'No token provided'}), 401
    
    try:
        # Manually decode and verify token
        from flask_jwt_extended import decode_token
        decoded_token = decode_token(token)
        print("Decoded token:", decoded_token)
        
        current_user_id = decoded_token['sub']
        print("User ID from token:", current_user_id)
        
        # Convert string ID to integer if needed
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify(user.to_dict()), 200
    except Exception as e:
        print("Token verification error:", str(e))
        return jsonify({'message': 'Invalid token'}), 401

@app.route('/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()

    # Update allowed fields
    if 'email' in data:
        if User.query.filter(User.email == data['email'], User.id != user.id).first():
            return jsonify({'message': 'Email already exists'}), 409
        user.email = data['email']

    if 'password' in data:
        if len(data['password']) < 8:
            return jsonify({'message': 'Password must be at least 8 characters long'}), 400
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200

# Product Routes with Search

@app.route('/products', methods=['GET'])
def get_products():
    """Public endpoint with search functionality"""
    # Build search query
    search_query = build_product_search_query(request.args)
    
    # Apply sorting
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    search_query = apply_sorting(search_query, sort_by, sort_order)
    
    # Apply pagination
    page = request.args.get('page', 1)
    per_page = request.args.get('per_page', 10)
    paginated_results = paginate_query(search_query, page, per_page)
    
    return jsonify({
        'products': [product.to_dict() for product in paginated_results.items],
        'pagination': {
            'page': paginated_results.page,
            'per_page': paginated_results.per_page,
            'total': paginated_results.total,
            'pages': paginated_results.pages,
            'has_prev': paginated_results.has_prev,
            'has_next': paginated_results.has_next,
            'prev_num': paginated_results.prev_num,
            'next_num': paginated_results.next_num
        }
    }), 200

@app.route('/products/search', methods=['GET'])
def search_products():
    """Dedicated search endpoint with advanced features"""
    # Build search query
    search_query = build_product_search_query(request.args)
    
    # Apply sorting
    sort_by = request.args.get('sort_by', 'relevance')
    sort_order = request.args.get('sort_order', 'desc')
    
    if sort_by != 'relevance':
        search_query = apply_sorting(search_query, sort_by, sort_order)
    else:
        # For relevance, we'll order by created_at desc as default
        search_query = search_query.order_by(desc(Product.created_at))
    
    # Apply pagination
    page = request.args.get('page', 1)
    per_page = request.args.get('per_page', 10)
    paginated_results = paginate_query(search_query, page, per_page)
    
    # Get search statistics
    total_products = Product.query.filter_by(is_active=True).count()
    
    return jsonify({
        'products': [product.to_dict() for product in paginated_results.items],
        'pagination': {
            'page': paginated_results.page,
            'per_page': paginated_results.per_page,
            'total': paginated_results.total,
            'pages': paginated_results.pages,
            'has_prev': paginated_results.has_prev,
            'has_next': paginated_results.has_next,
            'prev_num': paginated_results.prev_num,
            'next_num': paginated_results.next_num
        },
        'search_info': {
            'query': request.args.get('q', ''),
            'total_found': paginated_results.total,
            'total_products': total_products
        }
    }), 200

@app.route('/products/categories', methods=['GET'])
def get_product_categories():
    """Get all unique categories"""
    categories = db.session.query(Product.category).filter(
        Product.is_active == True,
        Product.category.isnot(None),
        Product.category != ''
    ).distinct().all()
    
    category_list = [cat[0] for cat in categories if cat[0]]
    return jsonify({'categories': sorted(category_list)}), 200

@app.route('/products/search/suggestions', methods=['GET'])
def search_suggestions():
    """Get search suggestions based on partial input"""
    query = request.args.get('q', '').strip()
    if not query or len(query) < 2:
        return jsonify({'suggestions': []}), 200
    
    # Search in product names and categories
    search_term = f"%{query}%"
    
    # Get product name suggestions
    name_suggestions = db.session.query(Product.name).filter(
        Product.is_active == True,
        Product.name.ilike(search_term)
    ).limit(5).all()
    
    # Get category suggestions
    category_suggestions = db.session.query(Product.category).filter(
        Product.is_active == True,
        Product.category.isnot(None),
        Product.category.ilike(search_term)
    ).distinct().limit(3).all()
    
    suggestions = []
    suggestions.extend([name[0] for name in name_suggestions])
    suggestions.extend([cat[0] for cat in category_suggestions if cat[0]])
    
    # Remove duplicates while preserving order
    unique_suggestions = list(dict.fromkeys(suggestions))
    
    return jsonify({'suggestions': unique_suggestions[:8]}), 200

@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Public endpoint - anyone can view a specific product"""
    product = Product.query.filter_by(id=product_id, is_active=True).first()
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    return jsonify(product.to_dict()), 200

@app.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    """Authenticated users can create products"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Validation
    required_fields = ['name', 'price']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400

    try:
        price = float(data['price'])
        if price < 0:
            return jsonify({'message': 'Price must be non-negative'}), 400
    except ValueError:
        return jsonify({'message': 'Invalid price format'}), 400

    # Create product
    product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=price,
        category=data.get('category', ''),
        tags=data.get('tags', ''),
        created_by=current_user_id
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({
        'message': 'Product created successfully',
        'product': product.to_dict()
    }), 201

@app.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Users can update their own products, admins can update any product"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    # Check permissions
    if current_user.role != 'admin' and product.created_by != current_user_id:
        return jsonify({'message': 'Permission denied'}), 403

    data = request.get_json()

    # Update fields
    if 'name' in data:
        product.name = data['name']
    if 'description' in data:
        product.description = data['description']
    if 'category' in data:
        product.category = data['category']
    if 'tags' in data:
        product.tags = data['tags']
    if 'price' in data:
        try:
            price = float(data['price'])
            if price < 0:
                return jsonify({'message': 'Price must be non-negative'}), 400
            product.price = price
        except ValueError:
            return jsonify({'message': 'Invalid price format'}), 400

    product.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Product updated successfully',
        'product': product.to_dict()
    }), 200

@app.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Users can delete their own products, admins can delete any product"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    # Check permissions
    if current_user.role != 'admin' and product.created_by != current_user_id:
        return jsonify({'message': 'Permission denied'}), 403

    # Soft delete
    product.is_active = False
    db.session.commit()

    return jsonify({'message': 'Product deleted successfully'}), 200

# Admin Routes

@app.route('/admin/users', methods=['GET'])
@admin_required
def get_all_users():
    """Admin only - get all users"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@app.route('/admin/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    """Admin only - update user role and status"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()

    if 'role' in data:
        if data['role'] not in ['user', 'admin', 'moderator']:
            return jsonify({'message': 'Invalid role'}), 400
        user.role = data['role']

    if 'is_active' in data:
        user.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    }), 200

@app.route('/admin/products', methods=['GET'])
@admin_required
def get_all_products_admin():
    """Admin only - get all products including inactive ones with search"""
    # Build search query but include inactive products
    search_query = Product.query
    
    # Apply same search filters but don't filter by is_active
    if 'q' in request.args and request.args['q']:
        search_term = f"%{request.args['q']}%"
        search_query = search_query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.tags.ilike(search_term)
            )
        )
    
    # Apply other filters
    search_query = build_product_search_query(request.args)
    search_query = search_query.filter()  # Remove the is_active filter
    
    # Include inactive products for admin
    if 'include_inactive' not in request.args or request.args.get('include_inactive', '').lower() == 'true':
        search_query = Product.query.filter()  # Reset to include all
        # Reapply filters without is_active restriction
        search_query = build_product_search_query(request.args)
        search_query = search_query.filter()  # This will include inactive products
    
    # Apply sorting and pagination
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    search_query = apply_sorting(search_query, sort_by, sort_order)
    
    page = request.args.get('page', 1)
    per_page = request.args.get('per_page', 10)
    paginated_results = paginate_query(search_query, page, per_page)
    
    return jsonify({
        'products': [product.to_dict() for product in paginated_results.items],
        'pagination': {
            'page': paginated_results.page,
            'per_page': paginated_results.per_page,
            'total': paginated_results.total,
            'pages': paginated_results.pages,
            'has_prev': paginated_results.has_prev,
            'has_next': paginated_results.has_next,
            'prev_num': paginated_results.prev_num,
            'next_num': paginated_results.next_num
        }
    }), 200

# My Products Route

@app.route('/my/products', methods=['GET'])
@jwt_required()
def get_my_products():
    """Get current user's products with search functionality"""
    current_user_id = get_jwt_identity()
    
    # Start with user's products
    search_query = Product.query.filter_by(created_by=current_user_id)
    
    # Apply search filters
    if 'q' in request.args and request.args['q']:
        search_term = f"%{request.args['q']}%"
        search_query = search_query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.tags.ilike(search_term)
            )
        )
    
    # Apply other filters
    if 'category' in request.args and request.args['category']:
        search_query = search_query.filter(Product.category.ilike(f"%{request.args['category']}%"))
    
    # Apply sorting and pagination
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    search_query = apply_sorting(search_query, sort_by, sort_order)
    
    page = request.args.get('page', 1)
    per_page = request.args.get('per_page', 10)
    paginated_results = paginate_query(search_query, page, per_page)
    
    return jsonify({
        'products': [product.to_dict() for product in paginated_results.items],
        'pagination': {
            'page': paginated_results.page,
            'per_page': paginated_results.per_page,
            'total': paginated_results.total,
            'pages': paginated_results.pages,
            'has_prev': paginated_results.has_prev,
            'has_next': paginated_results.has_next,
            'prev_num': paginated_results.prev_num,
            'next_num': paginated_results.next_num
        }
    }), 200

# Health Check

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}), 200

# Error Handlers

@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'message': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'message': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'message': 'Authorization token is required'}), 401

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Initialize Database

def create_sample_data():
    """Create sample admin user and products for testing"""
    # Create admin user if it doesn't exist
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(username='admin', email='admin@catalog.com', role='admin')
        admin.set_password('Admin123!')
        db.session.add(admin)
        db.session.commit()
        print("Created admin user: admin/Admin123!")

    # Create sample products if none exist
    if Product.query.count() == 0:
        sample_products = [
            Product(
                name='MacBook Pro', 
                description='High-end laptop for developers and creatives', 
                price=1999.00, 
                category='Electronics',
                tags='laptop,apple,development,creative',
                created_by=admin.id
            ),
            Product(
                 name='iPhone 15 Pro', 
                description='Latest flagship smartphone with advanced camera system', 
                price=1099.00, 
                category='Electronics',
                tags='smartphone,apple,camera,mobile',
                created_by=admin.id
            ),
            Product(
                name='Wireless Bluetooth Headphones', 
                description='Premium noise-cancelling headphones with 30-hour battery', 
                price=249.99, 
                category='Electronics',
                tags='headphones,wireless,bluetooth,audio',
                created_by=admin.id
            ),
            Product(
                name='Gaming Mechanical Keyboard', 
                description='RGB backlit mechanical keyboard for gaming enthusiasts', 
                price=129.99, 
                category='Electronics',
                tags='keyboard,gaming,mechanical,rgb',
                created_by=admin.id
            ),
            Product(
                name='Ergonomic Office Chair', 
                description='Comfortable office chair with lumbar support and adjustable height', 
                price=399.00, 
                category='Furniture',
                tags='chair,office,ergonomic,furniture',
                created_by=admin.id
            ),
            Product(
                name='Coffee Maker', 
                description='Programmable coffee maker with thermal carafe', 
                price=89.99, 
                category='Kitchen',
                tags='coffee,kitchen,appliance,thermal',
                created_by=admin.id
            ),
            Product(
                name='Yoga Mat', 
                description='Non-slip yoga mat with carrying strap', 
                price=29.99, 
                category='Fitness',
                tags='yoga,fitness,exercise,mat',
                created_by=admin.id
            ),
            Product(
                name='Instant Pot', 
                description='Multi-use pressure cooker, slow cooker, and rice cooker', 
                price=119.99, 
                category='Kitchen',
                tags='pressure cooker,kitchen,appliance,cooking',
                created_by=admin.id
            ),
            Product(
                name='Wireless Mouse', 
                description='Precision wireless mouse with ergonomic design', 
                price=39.99, 
                category='Electronics',
                tags='mouse,wireless,computer,ergonomic',
                created_by=admin.id
            ),
            Product(
                name='Standing Desk', 
                description='Height-adjustable standing desk for modern workspace', 
                price=449.00, 
                category='Furniture',
                tags='desk,standing,adjustable,office',
                created_by=admin.id
            ),
            Product(
                name='Air Purifier', 
                description='HEPA air purifier for rooms up to 300 sq ft', 
                price=179.99, 
                category='Home',
                tags='air purifier,hepa,home,health',
                created_by=admin.id
            ),
            Product(
                name='Fitness Tracker', 
                description='Waterproof fitness tracker with heart rate monitor', 
                price=79.99, 
                category='Fitness',
                tags='fitness,tracker,health,waterproof',
                created_by=admin.id
            ),
            Product(
                name='Bluetooth Speaker', 
                description='Portable waterproof speaker with 12-hour battery', 
                price=59.99, 
                category='Electronics',
                tags='speaker,bluetooth,portable,waterproof',
                created_by=admin.id
            )
        ]
        
        for product in sample_products:
            db.session.add(product)
        
        db.session.commit()
        print(f"Created {len(sample_products)} sample products")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_sample_data()
    app.run(debug=True, host='0.0.0.0', port=5000)