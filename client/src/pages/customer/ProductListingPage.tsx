import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductCardSkeleton } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { Product, Category } from '../../types';
import { apiClient } from '../../api/client';

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters State from URL params
  const searchQuery = searchParams.get('search') || '';
  const categorySlug = searchParams.get('category') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const sortBy = searchParams.get('sortBy') || 'featured';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const discountFilter = searchParams.get('discount') || '';

  // Load Categories & Brands
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/products/brands'),
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (brandRes.data.success) setBrands(brandRes.data.data);
      } catch (err) {
        console.error('Failed to load categories/brands:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Products on Filter / Query change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (categorySlug) params.set('category', categorySlug);
        if (selectedBrand) params.set('brand', selectedBrand);
        if (sortBy) params.set('sortBy', sortBy);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (inStockOnly) params.set('inStock', 'true');
        if (discountFilter) params.set('minDiscount', discountFilter);
        params.set('page', currentPage.toString());
        params.set('limit', '16');

        const res = await apiClient.get(`/products?${params.toString()}`);
        if (res.data.success) {
          setProducts(res.data.data);
          setTotalCount(res.data.meta?.total || res.data.data.length);
          setTotalPages(res.data.meta?.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [
    searchQuery,
    categorySlug,
    selectedBrand,
    sortBy,
    minPrice,
    maxPrice,
    inStockOnly,
    discountFilter,
    currentPage,
  ]);

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setCurrentPage(1);
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setCurrentPage(1);
  };

  const activeFiltersCount =
    (categorySlug ? 1 : 0) +
    (selectedBrand ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (discountFilter ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const FilterSidebarContent = (
    <div className="space-y-6">
      {/* Active Filter Clear Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-red" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h4>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-semibold text-brand-red hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div>
        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Categories
        </h5>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => updateParam('category', null)}
            className={`w-full flex items-center justify-between text-xs px-2 py-1.5 rounded-lg transition-colors text-left ${
              !categorySlug
                ? 'bg-brand-red-light text-brand-red font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => {
            const isSelected = categorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateParam('category', isSelected ? null : cat.slug)}
                className={`w-full flex items-center justify-between text-xs px-2 py-1.5 rounded-lg transition-colors text-left ${
                  isSelected
                    ? 'bg-brand-red-light text-brand-red font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {cat.productCount !== undefined && (
                  <span className="text-[10px] text-slate-400">({cat.productCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Brand Filter */}
      <div>
        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Popular Brands
        </h5>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {brands.map((b) => {
            const isSelected = selectedBrand === b;
            return (
              <label
                key={b}
                className="flex items-center gap-2 text-xs text-slate-700 hover:text-brand-red cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => updateParam('brand', isSelected ? null : b)}
                  className="rounded border-slate-300 text-brand-red focus:ring-brand-red w-3.5 h-3.5"
                />
                <span className="truncate">{b}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Discount Offers */}
      <div>
        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Discount Offers
        </h5>
        <div className="space-y-1.5 text-xs">
          {['10', '20', '30', '40'].map((disc) => (
            <label
              key={disc}
              className="flex items-center gap-2 text-slate-700 hover:text-brand-red cursor-pointer select-none"
            >
              <input
                type="radio"
                name="discountFilter"
                checked={discountFilter === disc}
                onChange={() => updateParam('discount', discountFilter === disc ? null : disc)}
                className="text-brand-red focus:ring-brand-red"
              />
              <span>{disc}% or more</span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Availability */}
      <div>
        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Availability
        </h5>
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : null)}
            className="rounded border-slate-300 text-brand-red focus:ring-brand-red w-3.5 h-3.5"
          />
          <span>In Stock Items Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. HEADER & SORT BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>
              {categorySlug
                ? categories.find((c) => c.slug === categorySlug)?.name || 'Products'
                : searchQuery
                ? `Search Results for "${searchQuery}"`
                : 'All Grocery Products'}
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {totalCount} items
            </span>
          </h1>
          {searchQuery && (
            <p className="text-xs text-slate-500 mt-0.5">Showing products matching your search term</p>
          )}
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
          >
            <Filter className="w-3.5 h-3.5 text-brand-red" />
            <span>Filters ({activeFiltersCount})</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="sort-dropdown" className="font-semibold text-slate-600 hidden sm:inline">
              Sort by:
            </label>
            <select
              id="sort-dropdown"
              value={sortBy}
              onChange={(e) => updateParam('sortBy', e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-red focus:outline-none"
            >
              <option value="featured">Featured / Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="discount">Biggest Discount</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. MAIN LISTING LAYOUT (SIDEBAR + GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block md:col-span-1 bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle h-fit sticky top-24">
          {FilterSidebarContent}
        </aside>

        {/* Product Grid */}
        <main className="md:col-span-3 lg:col-span-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="btn-secondary !py-1.5 !px-3 text-xs font-semibold disabled:opacity-40"
                  >
                    &larr; Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            currentPage === pageNum
                              ? 'bg-brand-red text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="btn-secondary !py-1.5 !px-3 text-xs font-semibold disabled:opacity-40"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <EmptyState
                title="No grocery items found"
                description="Try adjusting your filters, clearing your search keywords, or selecting a different category."
                actionText="Clear All Filters"
                onActionClick={clearAllFilters}
              />
            </div>
          )}
        </main>
      </div>

      {/* 3. MOBILE FILTER DRAWER */}
      {isMobileFilterOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-4/5 max-w-sm bg-white h-full p-5 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h4 className="font-bold text-sm text-slate-900">Filters</h4>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {FilterSidebarContent}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="btn-primary w-full text-xs font-bold py-2.5"
              >
                Apply Filters ({totalCount} items)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
