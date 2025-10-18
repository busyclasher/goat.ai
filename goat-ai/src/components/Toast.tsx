"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  duration?: number;
  onClose: () => void;
}

export function Toast({ 
  message, 
  type = "info", 
  duration = 3000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const toastTypeClasses = {
    error: "bg-red-100 border-red-400 text-red-700",
    success: "bg-blue-100 border-blue-400 text-blue-700",
    info: "bg-gray-100 border-gray-400 text-gray-700",
  };

  const IconComponent = {
    error: X,
    success: X,
    info: X,
  };

  const Icon = IconComponent[type];

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        toastTypeClasses[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm">{message}</p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
          aria-label="Close notification"
        >
          <Icon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
