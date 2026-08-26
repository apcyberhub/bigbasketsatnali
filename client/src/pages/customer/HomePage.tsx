import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Clock,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductCardSkeleton, BannerSkeleton } from '../../components/common/SkeletonLoader';
import { Product, Category, Banner } from '../../types';
import { apiClient } from '../../api/client';

export const HomePage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [fruitsVegProducts, setFruitsVegProducts] = useState<Product[]>([]);
  const [dairyProducts, setDairyProducts] = useState<Product[]>([]);
  const [stapleProducts, setStapleProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        const [bannerRes, catRes, prodRes] = await Promise.all([
          apiClient.get('/banners'),
          apiClient.get('/categories'),
          apiClient.get('/products?limit=30'),
        ]);

        if (bannerRes.data.success) {
          setBanners(bannerRes.data.data);
        }
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
        if (prodRes.data.success) {
          const allProds: Product[] = prodRes.data.data;
          setFeaturedProducts(allProds.filter((p) => p.isFeatured));
          setDealProducts(allProds.filter((p) => p.discount >= 15));
          setFruitsVegProducts(allProds.filter((p) => p.category?.slug === 'fruits-vegetables'));
          setDairyProducts(allProds.filter((p) => p.category?.slug === 'dairy-bakery'));
          setStapleProducts(allProds.filter((p) => p.category?.slug === 'atta-rice-dal'));
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Auto-scroll hero banner carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="space-y-10 pb-12">
      {/* 1. HERO BANNER CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {isLoading ? (
          <BannerSkeleton />
        ) : banners.length > 0 ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 shadow-md text-white">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeBannerIdx * 100}%)` }}
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="min-w-full min-h-[220px] sm:min-h-[320px] md:min-h-[380px] flex flex-col justify-center p-6 sm:p-12 relative"
                >
                  <div className="max-w-xl z-10 space-y-3">
                    <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      ⚡ Daily Special
                    </span>
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold leading-tight drop-shadow-sm">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-md">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.ctaText && (
                      <div className="pt-2">
                        <Link
                          to={banner.linkUrl || '/products'}
                          className="inline-flex items-center gap-2 bg-white text-brand-red hover:bg-slate-100 font-bold px-5 py-2.5 rounded-full text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
                        >
                          <span>{banner.ctaText}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Arrow Controls */}
            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveBannerIdx((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBannerIdx((prev) => (prev + 1) % banners.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors"
                  aria-label="Next banner"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveBannerIdx(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeBannerIdx === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>

      {/* 2. EXPLORE CATEGORIES SHELF */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Shop by Category</h3>
            <p className="text-xs text-slate-500">Explore fresh groceries & household items</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4">
          {categories.slice(0, 14).map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="flex flex-col items-center text-center p-3 rounded-xl bg-white border border-slate-200/70 hover:border-brand-red/50 hover:shadow-card transition-all group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-50 flex items-center justify-center p-2 mb-2 group-hover:scale-105 transition-transform overflow-hidden">
                <img
                  src={`/${cat.image}`}
                  alt={cat.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/logo.png';
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-brand-red">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. DEALS OF THE DAY (DISCOUNTS >= 15%) */}
      {dealProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 sm:p-6 rounded-2xl border border-red-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-red text-white flex items-center justify-center">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Mega Savings & Deals
                  </h3>
                  <p className="text-xs text-slate-600">Grab up to 40% OFF on pantry staples & daily goods</p>
                </div>
              </div>
              <Link to="/products?discount=15" className="btn-outline-red !py-1 text-xs">
                See All Deals &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : dealProducts.slice(0, 5).map((prod) => <ProductCard key={prod.id} product={prod} />)}
            </div>
          </div>
        </section>
      )}

      {/* 4. FEATURED BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Popular Best Sellers</h3>
              <p className="text-xs text-slate-500">Most ordered daily groceries by our customers</p>
            </div>
          </div>
          <Link to="/products?featured=true" className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1">
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts.slice(0, 10).map((prod) => <ProductCard key={prod.id} product={prod} />)}
        </div>
      </section>

      {/* 5. FRESH FRUITS & VEGETABLES SHELF */}
      {fruitsVegProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                🥬 Farm Fresh Fruits & Vegetables
              </h3>
              <p className="text-xs text-slate-500">Naturally grown, fresh handpicked daily produce</p>
            </div>
            <Link
              to="/category/fruits-vegetables"
              className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {fruitsVegProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 6. DAIRY, MILK & BAKERY SHELF */}
      {dairyProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                🥛 Dairy, Fresh Paneer & Bread
              </h3>
              <p className="text-xs text-slate-500">Pure milk, golden butter, paneer, and artisan breads</p>
            </div>
            <Link
              to="/category/dairy-bakery"
              className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {dairyProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 7. PROMOTIONAL COUPON BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-card">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
              <Percent className="w-3.5 h-3.5" /> Special Offer
            </span>
            <h3 className="text-xl sm:text-2xl font-black">Get 20% OFF On Your First Order</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Apply coupon <code className="bg-slate-700 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">WELCOME20</code> during checkout.
            </p>
          </div>
          <Link
            to="/products"
            className="btn-primary !bg-white !text-slate-900 hover:!bg-slate-100 font-bold text-xs sm:text-sm px-6 py-3 rounded-full shrink-0"
          >
            Start Shopping Now
          </Link>
        </div>
      </section>
    </div>
  );
};
