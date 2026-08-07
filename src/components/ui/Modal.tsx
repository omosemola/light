"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isBottomSheet?: boolean;
}

export function Modal({ isOpen, onClose, title, children, isBottomSheet = false }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex ${isBottomSheet ? "items-end justify-center md:items-center" : "items-center justify-center p-4"}`}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={`relative bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xl w-full flex flex-col transition-all ${
        isBottomSheet 
          ? "h-[70vh] max-h-[70vh] rounded-t-[32px] md:rounded-3xl max-w-lg animate-in slide-in-from-bottom duration-300 overflow-hidden"
          : "max-w-sm rounded-3xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-zinc-800 shrink-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          <h3 className="font-heading font-extrabold text-base md:text-lg text-[#312E81] dark:text-indigo-400">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 active:scale-95 transition-transform"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 md:p-5 flex-1 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
