import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import './Shop.css';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // Filters from URL params
  const currentCategory = searchParams.get('category') || '';
  const currentSearch   = searchParams.get('search')   || '';
  const currentSort     = searchParams.get('sort')     || 'newest';
  const currentPage     = parseInt(searchParams.get('page') || '1');

  // Search input local state (debounced before pushing to URL)
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Fetch categories once
  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.categories || []));
  }, []);

  // Fetch products when filters change
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (currentCategory) params.set('category', currentCategory);
      if (currentSearch)   params.set('search', currentSearch);
      if (currentSort)     params.set('sort', currentSort);
      params.set('page', currentPage);
      params.set('limit', 12);

      const res = await api.get(`/products?${params}`);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentCategory, currentSearch, currentSort, currentPage]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchInput) next.set('search', searchInput);
      else next.delete('search');
      next.delete('page');
      setSearchParams(next);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const setPage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', page);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const activeFilters = currentCategory || currentSearch;

  return (
    <div className="shop-page">
      {/* ── Header ── */}
      <div className="shop-header">
        <div className="shop-header-inner">
          <h1>🛒 Fresh Groceries</h1>
          <p>Order fresh produce, dairy, snacks & more — delivered to your door.</p>
        </div>
      </div>

      <div className="shop-layout">
        {/* ── Sidebar ── */}
        <aside className="shop-sidebar">
          <div className="sidebar-section">
            <h3>Categories</h3>
            <ul className="category-list">
              <li
                className={!currentCategory ? 'active' : ''}
                onClick={() => setFilter('category', '')}
              >All Products</li>
              {categories.map(cat => (
                <li
                  key={cat.id}
                  className={currentCategory === cat.slug ? 'active' : ''}
                  onClick={() => setFilter('category', cat.slug)}
                >
                  {cat.name}
                  <span className="cat-count">{cat.product_count}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="shop-main">
          {/* Toolbar */}
          <div className="shop-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button className="clear-search" onClick={() => setSearchInput('')}>✕</button>
              )}
            </div>

            <select
              className="sort-select"
              value={currentSort}
              onChange={e => setFilter('sort', e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A–Z</option>
            </select>

            {activeFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>

          {/* Results info */}
          {!loading && (
            <div className="results-info">
              {pagination.total > 0
                ? `Showing ${products.length} of ${pagination.total} products`
                : ''}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="shop-loading">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : error ? (
            <div className="shop-error">{error}</div>
          ) : products.length === 0 ? (
            <div className="shop-empty">
              <p>😕 No products found.</p>
              <button onClick={clearFilters}>Clear filters</button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >← Prev</button>

              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={currentPage === i + 1 ? 'active' : ''}
                  onClick={() => setPage(i + 1)}
                >{i + 1}</button>
              ))}

              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => setPage(currentPage + 1)}
              >Next →</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
