"use client";
import React, { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CadetMateSidebar } from "@/components/Sidebar";

const categories = [
  { id: 'all', label: 'All' },
  { id: 'modules', label: 'Modules' },
  { id: 'trb', label: 'TRB' },
  { id: 'seatime', label: 'Sea Time' },
  { id: 'exams', label: 'Exams' },
  { id: 'extras', label: 'Extras' }
];

const StorePage = () => {
  const [activeTab, setActiveTab] = useState('all');

  const getActiveTabPosition = () => {
    return categories.findIndex(cat => cat.id === activeTab);
  };

  // Stripe pricing table configuration
  // Replace these with your actual Stripe pricing table IDs and publishable key
  const stripeTables = {
    all: {
      pricingTableId: 'prctbl_1SkSReRwygITQzeHqWUlfbRI',
      publishableKey: 'pk_test_51S8R2vRwygITQzeHn6B8EW7O3AmdwJHQBknayUD9sO2o7byW50Cp3uuxFL4VW9HDykuCjtdV0D2xoWj3jk8wZFAo0025ArN1iY'
    },
    modules: {
      pricingTableId: 'prctbl_MODULES',
      publishableKey: 'pk_test_YOUR_KEY_HERE'
    },
    trb: {
      pricingTableId: 'prctbl_TRB',
      publishableKey: 'pk_test_YOUR_KEY_HERE'
    },
    seatime: {
      pricingTableId: 'prctbl_SEATIME',
      publishableKey: 'pk_test_YOUR_KEY_HERE'
    },
    exams: {
      pricingTableId: 'prctbl_EXAMS',
      publishableKey: 'pk_test_YOUR_KEY_HERE'
    },
    extras: {
      pricingTableId: 'prctbl_EXTRAS',
      publishableKey: 'pk_test_YOUR_KEY_HERE'
    }
  };

  // Stripe Pricing Table Component
  const StripePricingTable = ({ category }) => {
    React.useEffect(() => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }, []);

    return (
      <div className="w-full">
        <stripe-pricing-table
          pricing-table-id={stripeTables[category].pricingTableId}
          publishable-key={stripeTables[category].publishableKey}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
       <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
            Store
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Choose from our range of maritime training products and services
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs with Sliding Pill */}
          <div className="hidden sm:block mb-8">
            <div className="relative bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm">
              <div className="relative flex">
                {/* Sliding pill background */}
                <div
                  className="absolute top-1 bottom-1 bg-blue-600 rounded-md transition-all duration-300 ease-out"
                  style={{
                    left: `calc(${(getActiveTabPosition() / categories.length) * 100}% + 4px)`,
                    width: `calc(${100 / categories.length}% - 8px)`
                  }}
                />
                {/* Tab buttons */}
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`relative z-10 flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                      activeTab === category.id
                        ? 'text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <div className="sm:hidden mb-6">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 overflow-hidden">
            {categories.map((category) => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="mt-0 focus-visible:outline-none data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=active]:slide-in-from-right-8 data-[state=inactive]:slide-out-to-left-8 data-[state=active]:fade-in data-[state=inactive]:fade-out"
                style={{
                  animationDuration: '400ms',
                  animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
                    {category.label}
                  </h2>
                  <div className="h-1 w-20 bg-slate-900 rounded-full"></div>
                </div>

                {/* Stripe Pricing Table */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <StripePricingTable category={category.id} />
                </div>

              </TabsContent>
            ))}
          </div>
        </Tabs>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Secure payment processing powered by Stripe</p>
        </div>
      </div>
    </div>
  );
};

export default StorePage;