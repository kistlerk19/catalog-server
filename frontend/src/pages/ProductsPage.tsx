import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProductGrid from '../components/products/ProductGrid';
import SearchBar from '../components/products/SearchBar';
import Filters from '../components/products/Filters';
import Pagination from '../components/products/Pagination';
import { productsAPI } from '../services/api';
import { Product, PaginationData } from '../types';

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    per_page: 12,
    total: 0,
    pages: 0,
    has_prev: false,
    has_next: false,
    prev_num: 0,
    next_num: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState({
    query: searchParams.get('q') || '',
    total_found: 0,
    total_products: 0,
  });

  // Get current search parameters using useMemo to prevent unnecessary recalculations
  const currentParams = useMemo(() => ({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: searchParams.get('sort_order') || 'desc',
    page: searchParams.get('page') || '1',
    per_page: searchParams.get('per_page') || '12',
  }), [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Convert search params to API params
        const apiParams: Record<string, string> = {};
Object.entries(currentParams).forEach(([key, value]) => {
  // Only add non-empty values (exclude empty strings, null, undefined)
  if (value && value.trim() !== '') {
    apiParams[key] = value.trim();
  }
});

        // Use search endpoint if there's a query, otherwise use regular products endpoint
        if (apiParams.q) {
          const searchResponse = await productsAPI.searchProducts(apiParams);
          if (searchResponse?.products) {
            setProducts(searchResponse.products);
          }
          if (searchResponse?.pagination) {
            setPagination(searchResponse.pagination);
          }
          if (searchResponse?.search_info) {
            setSearchInfo(searchResponse.search_info);
          }
        } else {
          const productsResponse = await productsAPI.getProducts(apiParams);
          if (productsResponse?.products) {
            setProducts(productsResponse.products);
          }
          if (productsResponse?.pagination) {
            setPagination(productsResponse.pagination);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again.');
        setProducts([]);
        // Reset pagination to prevent undefined errors
        setPagination({
          page: 1,
          per_page: 12,
          total: 0,
          pages: 0,
          has_prev: false,
          has_next: false,
          prev_num: 0,
          next_num: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentParams]);

  const handleSearch = useCallback((query: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('q', query);
    } else {
      newParams.delete('q');
    }
    newParams.set('page', '1'); // Reset to first page on new search
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleFilterChange = useCallback((filters: Record<string, string>) => {
    const newParams = new URLSearchParams();
    
    // Preserve search query if exists
    if (currentParams.q) {
      newParams.set('q', currentParams.q);
    }
    
    // Add new filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      }
    });
    
    // Reset to first page
    newParams.set('page', '1');
    newParams.set('per_page', currentParams.per_page);
    
    setSearchParams(newParams);
  }, [currentParams, setSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    
    // Scroll to top of products section
    window.scrollTo({
      top: document.getElementById('products-section')?.offsetTop || 0,
      behavior: 'smooth',
    });
  }, [searchParams, setSearchParams]);

  // Safe access to pagination properties with fallbacks
  const safePagination = {
    page: pagination?.page || 1,
    per_page: pagination?.per_page || 12,
    total: pagination?.total || 0,
    pages: pagination?.pages || 1,
    has_prev: pagination?.has_prev || false,
    has_next: pagination?.has_next || false,
    prev_num: pagination?.prev_num || 0,
    next_num: pagination?.next_num || 0,
  };

  return (
    <Layout>
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="pb-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  {currentParams.q ? 'Search Results' : 'Browse Products'}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {currentParams.q ? `Results for "${currentParams.q}"` : 'All Products'}
                </h1>
                {currentParams.q && (
                  <p className="mt-2 text-sm text-gray-500">
                    Found <span className="font-medium text-primary-600">{searchInfo.total_found}</span> results out of {searchInfo.total_products} total products
                  </p>
                )}
              </div>
              <div className="mt-4 sm:mt-0 sm:w-96">
                <SearchBar onSearch={handleSearch} initialQuery={currentParams.q} />
              </div>
            </div>
          </div>

          <div className="pt-6 pb-24" id="products-section">
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
              {/* Filters */}
              <div className="hidden lg:block">
                <Filters onFilterChange={handleFilterChange} initialFilters={currentParams} />
              </div>

              {/* Product grid */}
              <div className="lg:col-span-3">
                {/* Mobile filters */}
                <div className="block lg:hidden mb-6">
                  <Filters onFilterChange={handleFilterChange} initialFilters={currentParams} />
                </div>

                {/* Results info */}
                <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                  <p className="text-sm text-gray-600">
                    Showing{' '}
                    <span className="font-medium text-primary-700">
                      {(products?.length || 0) > 0 ? (safePagination.page - 1) * safePagination.per_page + 1 : 0}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-primary-700">
                      {Math.min(safePagination.page * safePagination.per_page, safePagination.total)}
                    </span>{' '}
                    of <span className="font-medium text-primary-700">{safePagination.total}</span> products
                  </p>
                  
                  <div className="text-sm text-gray-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-primary-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                    Page {safePagination.page} of {safePagination.pages}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                {/* Products */}
                <ProductGrid products={products || []} loading={loading} />

                {/* Pagination - only show if there are multiple pages */}
                {safePagination.pages > 1 && (
                  <div className="mt-8">
                    <Pagination pagination={safePagination} onPageChange={handlePageChange} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductsPage;