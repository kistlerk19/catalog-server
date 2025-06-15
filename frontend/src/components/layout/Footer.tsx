import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
          </svg>
          <span className="ml-2 text-sm font-medium text-gray-700">Catalog</span>
        </div>
        
        <nav className="mt-4 md:mt-0">
          <ul className="flex space-x-6">
            <li>
              <Link to="/products" className="text-xs text-gray-500 hover:text-primary-600">
                Products
              </Link>
            </li>
            <li>
              <a href="#" className="text-xs text-gray-500 hover:text-primary-600">
                Terms
              </a>
            </li>
            <li>
              <a href="#" className="text-xs text-gray-500 hover:text-primary-600">
                Privacy
              </a>
            </li>
          </ul>
        </nav>
        
        <p className="mt-4 text-xs text-gray-500 md:mt-0">
          &copy; {new Date().getFullYear()} Catalog, Inc.
        </p>
      </div>
    </footer>
  );
};

export default Footer;