import React from "react";
import { AlertCircle, X, Trash2, HelpCircle } from "lucide-react";

/**
 * A premium, reusable confirmation modal for destructive or important actions.
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action may be permanent.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger, warning, info
  loading = false,
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <Trash2 className="w-8 h-8 text-red-400" />,
      btnClass: "bg-red-600 hover:bg-red-700 shadow-red-900/30",
      bgClass: "bg-red-500/10",
      accent: "border-red-500/20",
    },
    warning: {
      icon: <AlertCircle className="w-8 h-8 text-amber-400" />,
      btnClass: "bg-amber-600 hover:bg-amber-700 shadow-amber-900/30",
      bgClass: "bg-amber-500/10",
      accent: "border-amber-500/20",
    },
    info: {
      icon: <HelpCircle className="w-8 h-8 text-blue-400" />,
      btnClass: "bg-blue-600 hover:bg-blue-700 shadow-blue-900/30",
      bgClass: "bg-blue-500/10",
      accent: "border-blue-500/20",
    },
  };

  const config = typeConfig[type] || typeConfig.danger;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transition-all transform scale-100" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
        <div className="p-8 text-center">
          {/* Animated Icon Container */}
          <div
            className={`mx-auto w-20 h-20 rounded-full ${config.bgClass} flex items-center justify-center mb-6 border-4 ${config.accent} animate-bounce-subtle`}
          >
            {config.icon}
          </div>

          <h3 className="text-2xl font-bold text-white mb-3 font-heading">
            {title}
          </h3>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed px-2">
            {message}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onConfirm();
              }}
              disabled={loading}
              className={`w-full px-6 py-3.5 rounded-2xl text-white font-bold text-base transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 ${config.btnClass}`}
            >
              {loading ? "Processing..." : confirmText}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full px-6 py-3.5 rounded-2xl text-gray-400 font-bold text-base hover:bg-surface-2 transition-colors"
              style={{ border: "1px solid rgba(255,102,0,0.1)" }}
            >
              {cancelText}
            </button>
          </div>
        </div>

        {/* Top-right X button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-surface-2 text-gray-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

export default ConfirmModal;
