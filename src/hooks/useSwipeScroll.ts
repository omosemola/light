"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Custom hook for enabling mouse drag-to-swipe scrolling on desktop/big screens
 * while preserving native touch scrolling on mobile devices and preventing
 * accidental clicks on child links/buttons while dragging.
 */
export function useSwipeScroll<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T | null>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const checkScrollable = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkScrollable();
    el.addEventListener("scroll", checkScrollable, { passive: true });
    window.addEventListener("resize", checkScrollable);
    return () => {
      el.removeEventListener("scroll", checkScrollable);
      window.removeEventListener("resize", checkScrollable);
    };
  }, [checkScrollable]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only primary (left) mouse button
    if (e.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;
    isDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDownRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.6;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
      setIsDragging(true);
      e.preventDefault();
      el.scrollLeft = scrollLeftRef.current - walk;
      checkScrollable();
    }
  }, [checkScrollable]);

  const onMouseUp = useCallback(() => {
    isDownRef.current = false;
    setIsDragging(false);
    // Keep hasDraggedRef true for 50ms so click events can be suppressed on drag release
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  }, []);

  const onMouseLeave = useCallback(() => {
    isDownRef.current = false;
    setIsDragging(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  }, []);

  const scrollByAmount = useCallback((amount: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  const scrollLeft = useCallback(() => scrollByAmount(-320), [scrollByAmount]);
  const scrollRight = useCallback(() => scrollByAmount(320), [scrollByAmount]);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    containerRef,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onClickCapture,
    },
    hasDraggedRef,
    isDragging,
    scrollLeft,
    scrollRight,
    canScrollLeft,
    canScrollRight,
    checkScrollable,
  };
}

