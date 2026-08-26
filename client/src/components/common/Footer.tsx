import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-24 md:pb-12 border-t border-slate-800">
      {/* 1. Value Proposition Highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-800/60 rounded-2xl border border-slate-700/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">15-Min Express Delivery</h4>
              <p className="text-xs text-slate-400">Delivered hot & fresh to your door</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Quality Assurance</h4>
              <p className="text-xs text-slate-400">Directly sourced farm-fresh goods</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Instant Easy Returns</h4>
              <p className="text-xs text-slate-400">No questions asked return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Open 7 Days a Week</h4>
              <p className="text-xs text-slate-400">07:00 AM to 11:00 PM every day</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
        {/* Brand & Store Info */}
        <div className="lg:col-span-2 space-y-4">
          <BrandLogo size="lg" variant="light" showTagline />
          <p className="text-xs text-slate-400 leading-relaxed pr-6">
            Big Basket is your neighborhood trusted grocery store, dedicated to providing the freshest produce, daily milk, authentic spices, and essential household goods with lighting-fast doorstep delivery.
          </p>
          <div className="space-y-2 text-xs text-slate-300 pt-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
              <span>Shop 14, Ground Floor, Central Plaza, Main Market, Indore, MP 452001</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-brand-green shrink-0" />
              <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <a href="mailto:support@bigbasket.local" className="hover:text-white transition-colors">support@bigbasket.local</a>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Categories
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/category/fruits-vegetables" className="hover:text-white transition-colors">Fruits & Vegetables</Link></li>
            <li><Link to="/category/dairy-bakery" className="hover:text-white transition-colors">Dairy, Milk & Bread</Link></li>
            <li><Link to="/category/atta-rice-dal" className="hover:text-white transition-colors">Atta, Rice & Pulses</Link></li>
            <li><Link to="/category/oil-ghee" className="hover:text-white transition-colors">Edible Oils & Desi Ghee</Link></li>
            <li><Link to="/category/masalas-spices" className="hover:text-white transition-colors">Masalas & Spices</Link></li>
            <li><Link to="/category/beverages" className="hover:text-white transition-colors">Tea, Coffee & Juices</Link></li>
            <li><Link to="/category/snacks-munchies" className="hover:text-white transition-colors">Snacks & Namkeen</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Customer Care
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
            <li><Link to="/account/addresses" className="hover:text-white transition-colors">Delivery Addresses</Link></li>
            <li><Link to="/cart" className="hover:text-white transition-colors">My Cart</Link></li>
            <li><Link to="/wishlist" className="hover:text-white transition-colors">Saved Wishlist</Link></li>
            <li><Link to="/account/profile" className="hover:text-white transition-colors">Account Settings</Link></li>
          </ul>
        </div>

        {/* Payment & Security */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Payment Options
          </h4>
          <div className="space-y-3">
            <span className="inline-block bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-md">
              ✓ Cash on Delivery (COD)
            </span>
            <span className="inline-block bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1 rounded-md">
              ✓ UPI & Cards (Razorpay)
            </span>
            <p className="text-[11px] text-slate-500 pt-2">
              100% Secure Encrypted Payments. No credit card details stored on server.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} <strong className="text-slate-400">BIG BASKET</strong>. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="text-slate-400">15-Min Express Delivery in Indore</span>
          <span>•</span>
          <span className="text-slate-400">Fresh Groceries & Daily Essentials</span>
        </div>
      </div>
    </footer>
  );
};
