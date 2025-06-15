import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 lg:aspect-none group-hover:opacity-95 lg:h-48">
        <div className="h-full w-full flex items-center justify-center text-gray-400 relative">
          {/* Placeholder for product image with enhanced styling */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 opacity-50 group-hover:opacity-70 transition-opacity duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200 line-clamp-1">
            <Link to={`/products/${product.id}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.name}
            </Link>
          </h3>
          <p className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">${product.price.toFixed(2)}</p>
        </div>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{product.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.category && (
            <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-700/10 transition-colors duration-200 hover:bg-primary-100">
              {product.category}
            </span>
          )}
          {product.tags && product.tags.split(',').slice(0, 2).map(tag => (
            <span key={tag} className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 transition-colors duration-200 hover:bg-gray-100">
              {tag.trim()}
            </span>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <div className="h-7 w-7 rounded-full bg-gradient-to-r from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs shadow-sm">
              {product.creator_username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="ml-2 font-medium">{product.creator_username}</span>
          </div>
          <span className="text-xs text-gray-400">{new Date(product.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;