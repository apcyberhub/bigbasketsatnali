import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { ProductCard } from '../../components/common/ProductCard';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { getItemQuantity, getItemByProductId, addItem, updateQuantity, removeItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Review Form state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const formatImgSrc = (src?: string) => {
    if (!src) return '/assets/logo.png';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
      return src;
    }
    return `/${src}`;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      try {
        setIsLoading(true);
        const res = await apiClient.get(`/products/${slug}`);
        if (res.data.success) {
          const prodData: Product = res.data.data.product || res.data.data;
          const related: Product[] = res.data.data.relatedProducts || [];
          setProduct(prodData);
          setSelectedImage(prodData.mainImage || 'assets/logo.png');

          if (related && related.length > 0) {
            setRelatedProducts(related);
          } else if (prodData.category?.slug) {
            const relRes = await apiClient.get(`/products?category=${prodData.category.slug}&limit=5`);
            if (relRes.data.success) {
              setRelatedProducts(relRes.data.data.filter((p: Product) => p.id !== prodData.id));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading grocery item details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500">The grocery product you requested does not exist or has been removed.</p>
        <Link to="/products" className="btn-primary">
          Browse All Groceries
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const quantity = getItemQuantity(product.id);
  const cartItem = getItemByProductId(product.id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    await addItem(product.id, 1);
    setIsUpdating(false);
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    if (quantity === 0) {
      await addItem(product.id, 1);
    }
    navigate('/cart');
  };

  const handleIncrement = async () => {
    if (isUpdating || !cartItem || quantity >= product.stock) return;
    setIsUpdating(true);
    await updateQuantity(cartItem.id, quantity + 1);
    setIsUpdating(false);
  };

  const handleDecrement = async () => {
    if (isUpdating || !cartItem) return;
    setIsUpdating(true);
    if (quantity <= 1) {
      await removeItem(cartItem.id);
    } else {
      await updateQuantity(cartItem.id, quantity - 1);
    }
    setIsUpdating(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    try {
      setIsSubmittingReview(true);
      const res = await apiClient.post(`/products/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      if (res.data.success) {
        setReviewMsg('Thank you! Your review has been submitted.');
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewComment('');
          setReviewMsg('');
          // Refresh product reviews
          apiClient.get(`/products/${slug}`).then((r) => {
            if (r.data.success) {
              setProduct(r.data.data.product || r.data.data);
            }
          });
        }, 1200);
      }
    } catch (err: any) {
      setReviewMsg(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. BREADCRUMB */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto pb-1">
        <Link to="/" className="hover:text-brand-red">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-brand-red">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/category/${product.category.slug}`} className="hover:text-brand-red">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-semibold truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* 2. MAIN PRODUCT OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-subtle">
        {/* Left: Product Images Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square bg-slate-50 rounded-xl border border-slate-100 p-6 flex items-center justify-center overflow-hidden">
            <img
              src={formatImgSrc(selectedImage)}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/logo.png';
              }}
            />
            {product.discount > 0 && (
              <span className="absolute top-4 left-4 badge-discount">
                {Math.round(product.discount)}% OFF
              </span>
            )}
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 p-2.5 rounded-full transition-colors shadow-sm ${
                inWishlist ? 'bg-red-50 text-brand-red' : 'bg-white text-slate-400 hover:text-brand-red'
              }`}
              aria-label="Toggle wishlist"
            >
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-brand-red' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`w-16 h-16 rounded-lg border p-1 bg-white overflow-hidden shrink-0 transition-all ${
                    selectedImage === img.imageUrl
                      ? 'border-brand-red ring-2 ring-brand-red/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={formatImgSrc(img.imageUrl)}
                    alt={img.altText || product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/logo.png';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Actions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-red uppercase tracking-wider bg-brand-red-light px-2.5 py-0.5 rounded-md">
                {product.brand}
              </span>
              <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars & Review link */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <a href="#reviews-section" className="text-xs text-slate-500 hover:underline">
                ({product.reviewCount} customer ratings)
              </a>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Freshness
              </span>
            </div>

            {/* Pack Size & Unit */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Pack Size:</label>
              <div className="inline-block bg-slate-100 border border-slate-300 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg">
                {product.unit} {product.weight ? `(${product.weight})` : ''}
              </div>
            </div>

            {/* Price & Savings */}
            <div className="pt-2 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">₹{product.price}</span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-base text-slate-400 line-through">MRP ₹{product.mrp}</span>
                    <span className="badge-discount">
                      Save ₹{Math.round(product.mrp - product.price)} ({Math.round(product.discount)}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400">(Inclusive of all applicable taxes)</p>
            </div>

            {/* Stock Availability */}
            <div className="pt-1">
              {isOutOfStock ? (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
                  Currently Out of Stock
                </span>
              ) : product.stock <= product.lowStockThreshold ? (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md animate-pulse">
                  Hurry! Only {product.stock} items left in stock
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  ✓ In Stock (Ready for Dispatch)
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: Add to Cart / Buy Now */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {quantity === 0 ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isUpdating}
                  className="btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-brand-red text-white rounded-lg px-4 py-2 text-sm font-bold shadow-sm sm:w-48">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={isUpdating}
                    className="p-1 hover:bg-brand-red-dark rounded"
                    aria-label="Decrease"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span>{quantity} in Cart</span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={isUpdating || quantity >= product.stock}
                    className="p-1 hover:bg-brand-red-dark rounded disabled:opacity-40"
                    aria-label="Increase"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="btn-secondary sm:w-48 py-3 text-sm font-bold"
              >
                Buy Now
              </button>
            </div>

            {/* Delivery Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>15-Min Express Doorstep Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-red shrink-0" />
                <span>100% Quality & Freshness Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT DESCRIPTION & SPECIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
            Product Description
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {product.description || product.shortDescription || 'Pure, high-grade grocery product.'}
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
            Specifications
          </h3>
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-slate-100">
              <tr>
                <th className="py-2 text-slate-400 font-medium">Brand</th>
                <td className="py-2 text-slate-900 font-semibold text-right">{product.brand}</td>
              </tr>
              <tr>
                <th className="py-2 text-slate-400 font-medium">Net Quantity</th>
                <td className="py-2 text-slate-900 font-semibold text-right">{product.unit}</td>
              </tr>
              <tr>
                <th className="py-2 text-slate-400 font-medium">Category</th>
                <td className="py-2 text-slate-900 font-semibold text-right">{product.category?.name}</td>
              </tr>
              <tr>
                <th className="py-2 text-slate-400 font-medium">Shelf Life</th>
                <td className="py-2 text-slate-900 font-semibold text-right">Fresh Stock</td>
              </tr>
              <tr>
                <th className="py-2 text-slate-400 font-medium">Country of Origin</th>
                <td className="py-2 text-slate-900 font-semibold text-right">India</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CUSTOMER REVIEWS & RATINGS */}
      <section id="reviews-section" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Customer Reviews</h3>
            <p className="text-xs text-slate-500">Real feedback from verified grocery buyers</p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
              } else {
                setIsReviewModalOpen(true);
              }
            }}
            className="btn-outline-red text-xs font-bold flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Review list */}
        {product.reviews && product.reviews.length > 0 ? (
          <div className="divide-y divide-slate-100 space-y-4">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="pt-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {rev.user?.name || 'Verified Customer'}
                    </span>
                    {rev.isVerifiedPurchase && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            No reviews yet. Be the first to review this product!
          </div>
        )}
      </section>

      {/* 5. WRITE REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in">
            <h4 className="font-bold text-base text-slate-900">Write a Review for {product.name}</h4>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReviewRating(r)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          r <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Review Comments</label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with product quality, packaging, and freshness..."
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-red focus:outline-none"
                />
              </div>

              {reviewMsg && (
                <p className={`text-xs font-semibold ${reviewMsg.includes('Thank') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {reviewMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="btn-primary text-xs font-bold"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. RELATED PRODUCTS SHELF */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
            Similar Grocery Essentials
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
