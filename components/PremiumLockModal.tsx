"use client";
import { Lock, Sparkles, X } from "lucide-react";

interface PremiumLockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumLockModal({ isOpen, onClose }: PremiumLockModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="relative bg-blue-600 text-white p-8 rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3">
            <Lock size={32} />
            <h2 className="text-3xl font-bold text-white">Premium Content Locked</h2>
          </div>
          <p className="text-blue-100">Unlock full access to all training modules and features</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Upgrade to Premium to unlock:
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <Sparkles size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">All Unit Modules</p>
                  <p className="text-sm text-gray-600">Complete access to all maritime training modules</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <Sparkles size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Work Based Learning</p>
                  <p className="text-sm text-gray-600">Practical training resources and guidance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <Sparkles size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">TRB & Sea Survival</p>
                  <p className="text-sm text-gray-600">Essential training record book and safety modules</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <Sparkles size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">General Tips</p>
                  <p className="text-sm text-gray-600">Expert advice and industry insights</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Pricing Table Container */}
          <div id="stripe-pricing-table-container" className="mb-6">
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-1 text-center">
              <div className="mt-4 bg-white rounded p-4 text-left">
                <code className="text-xs text-gray-700 block">
                  <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
<stripe-pricing-table pricing-table-id="prctbl_1SlcPrRwygITQzeHu2JCNiqy"
publishable-key="pk_test_51S8R2vRwygITQzeHn6B8EW7O3AmdwJHQBknayUD9sO2o7byW50Cp3uuxFL4VW9HDykuCjtdV0D2xoWj3jk8wZFAo0025ArN1iY">
</stripe-pricing-table>
                </code>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                // Navigate to subscribe page or trigger Stripe checkout
                window.location.href = '/auth';
              }}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium shadow-lg"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}