import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProductGrid from '../components/products/ProductGrid';
import SearchBar from '../components/products/SearchBar';
import { productsAPI } from '../services/api';
import { Product } from '../types';
import { SparklesIcon } from '@heroicons/react/24/solid';


const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get latest products
        const productsResponse = await productsAPI.getProducts({
          sort_by: 'created_at',
          sort_order: 'desc',
          per_page: 8
        });
        setFeaturedProducts(productsResponse.products);

        // Get categories
        const categoriesData = await productsAPI.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
        <div className="absolute inset-0">
          <svg className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/4 transform text-primary-500 opacity-20" width="800" height="800" fill="none" viewBox="0 0 800 800">
            <circle cx="400" cy="400" r="400" fill="currentColor" />
          </svg>
          <svg className="absolute left-0 bottom-0 -translate-x-1/3 translate-y-1/4 transform text-primary-500 opacity-20" width="800" height="800" fill="none" viewBox="0 0 800 800">
            <circle cx="400" cy="400" r="400" fill="currentColor" />
          </svg>
          {/* Add animated dots pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
        </div>
        <div className="relative">
          <div className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-block mb-6">
                <span className="inline-flex items-center rounded-full bg-primary-400/10 px-4 py-1 text-sm font-medium text-primary-100 ring-1 ring-inset ring-primary-400/20">
                  <svg className="mr-1 h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Welcome to Catalog
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-100 animate-fade-in">
                Discover Amazing Products
              </h1>
              <p className="mt-6 text-lg leading-8 text-primary-100 animate-slide-up">
                Find the perfect items for your needs from our extensive collection of high-quality products.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="w-full max-w-md">
                  <SearchBar onSearch={handleSearch} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="bg-white py-24 sm:py-32 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f9ff_1px,transparent_1px),linear-gradient(to_bottom,#f0f9ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 mb-4">
                <SparklesIcon className="h-4 w-4 mr-1" />
                New Arrivals
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Latest Products</h2>
              <p className="mt-2 text-lg text-gray-600">Check out our newest additions to the catalog.</p>
            </div>
            <Link
              to="/products"
              className="mt-4 sm:mt-0 text-primary-600 hover:text-primary-500 font-medium flex items-center group bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full shadow-sm hover:shadow transition-all duration-200"
            >
              View all
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-1 transition-transform duration-200 group-hover:translate-x-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
          <ProductGrid products={featuredProducts} loading={loading} />
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              Categories
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Browse by Category</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of product categories to find exactly what you need.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              // Enhanced loading skeleton
              [...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse bg-white rounded-2xl shadow-soft p-8 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="h-7 bg-gray-200 rounded-full w-3/4 mb-4"></div>
                    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full w-1/2 mt-4"></div>
                </div>
              ))
            ) : categories.length > 0 ? (
              // Enhanced category cards
              categories.map((category, index) => (
                <Link
                  key={category}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="group block bg-white rounded-2xl shadow-soft p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-primary-100"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">{category}</h3>
                    <div className="rounded-full bg-primary-50 p-3 text-primary-600 group-hover:bg-primary-100 transition-all duration-200 group-hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    Explore {category.toLowerCase()} products
                  </p>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">No categories available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-primary-600 to-primary-900 px-6 py-24 text-center shadow-xl rounded-3xl sm:px-16 border border-primary-500/20">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
            <div className="absolute -top-24 -left-20 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow"></div>
            <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
            
            <div className="relative">
              <span className="inline-flex items-center rounded-full bg-primary-400/10 px-4 py-1 text-sm font-medium text-primary-100 ring-1 ring-inset ring-primary-400/20 mb-6">
                <SparklesIcon className="mr-1 h-4 w-4" />
                Join Our Community
              </span>
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to dive in?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
                Join our community today and discover amazing products from creators around the world.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-y-4 gap-x-6">
                <Link
                  to="/register"
                  className="rounded-full bg-white px-6 py-3 text-base font-semibold text-primary-600 shadow-md hover:shadow-lg hover:bg-primary-50 transition-all duration-200 w-full sm:w-auto"
                >
                  Get started
                </Link>
                <Link
                  to="/products"
                  className="text-base font-semibold leading-6 text-white hover:text-primary-100 group flex items-center justify-center w-full sm:w-auto"
                >
                  Browse products 
                  <span aria-hidden="true" className="ml-1 transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
            
            <svg
              viewBox="0 0 1024 1024"
              className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
              aria-hidden="true"
            >
              <circle cx="512" cy="512" r="512" fill="url(#gradient)" fillOpacity="0.15" />
              <defs>
                <radialGradient id="gradient">
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="white" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;