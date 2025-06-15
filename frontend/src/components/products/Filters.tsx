import React, { useState, useEffect } from 'react';
import { productsAPI } from '../../services/api';

interface FiltersProps {
  onFilterChange: (filters: Record<string, string>) => void;
  initialFilters?: Record<string, string>;
}

const Filters: React.FC<FiltersProps> = ({ onFilterChange, initialFilters = {} }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [minPrice, setMinPrice] = useState(initialFilters.min_price || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.max_price || '');
  const [sortBy, setSortBy] = useState(initialFilters.sort_by || 'created_at');
  const [sortOrder, setSortOrder] = useState(initialFilters.sort_order || 'desc');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesList = await productsAPI.getCategories();
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleApplyFilters = () => {
    const filters: Record<string, string> = {};
    
    if (selectedCategory) filters.category = selectedCategory;
    if (minPrice) filters.min_price = minPrice;
    if (maxPrice) filters.max_price = maxPrice;
    if (sortBy) filters.sort_by = sortBy;
    if (sortOrder) filters.sort_order = sortOrder;
    
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('created_at');
    setSortOrder('desc');
    
    onFilterChange({
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
      
      <div className="space-y-4">
        {/* Category Filter */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Price Range</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="min-price" className="sr-only">
                Minimum Price
              </label>
              <input
                type="number"
                id="min-price"
                name="min-price"
                placeholder="Min"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="max-price" className="sr-only">
                Maximum Price
              </label>
              <input
                type="number"
                id="max-price"
                name="max-price"
                placeholder="Max"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            id="sort"
            name="sort"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_at">Date Added</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="order" className="block text-sm font-medium text-gray-700">
            Sort Order
          </label>
          <select
            id="order"
            name="order"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            type="button"
            className="flex-1 bg-primary-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
          <button
            type="button"
            className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={handleClearFilters}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;