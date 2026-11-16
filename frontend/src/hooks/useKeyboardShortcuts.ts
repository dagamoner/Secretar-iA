"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onFocusSearch?: () => void;
  onNewDocument?: () => void;
  onOpenMovement?: () => void;
  onSelectNextRow?: () => void;
  onSelectPrevRow?: () => void;
  onEscape?: () => void;
  onToggleHelp?: () => void;
  onToggleDashboard?: () => void;
}

export function useKeyboardShortcuts({
  onFocusSearch,
  onNewDocument,
  onOpenMovement,
  onSelectNextRow,
  onSelectPrevRow,
  onEscape,
  onToggleHelp,
  onToggleDashboard,
}: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT";

      // Escape always works
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }

      // If user is actively typing in an input, don't trigger single-letter shortcuts
      if (isInput) {
        // Except Ctrl+K
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          onFocusSearch?.();
        }
        return;
      }

      // Shortcut: Focus Search (/ or Ctrl+K)
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      // Shortcut: New Document (n or Alt+N)
      if (e.key.toLowerCase() === "n" || (e.altKey && e.key.toLowerCase() === "n")) {
        e.preventDefault();
        onNewDocument?.();
        return;
      }

      // Shortcut: Toggle Movements Dashboard (d or Alt+D)
      if (e.key.toLowerCase() === "d" || (e.altKey && e.key.toLowerCase() === "d")) {
        e.preventDefault();
        onToggleDashboard?.();
        return;
      }

      // Shortcut: Pass / Movement (p or Enter)
      if (e.key.toLowerCase() === "p" || e.key === "Enter") {
        e.preventDefault();
        onOpenMovement?.();
        return;
      }

      // Shortcut: Navigate rows (ArrowDown / ArrowUp or j / k)
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        onSelectNextRow?.();
        return;
      }
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        onSelectPrevRow?.();
        return;
      }

      // Shortcut: Help dialog (?)
      if (e.key === "?") {
        e.preventDefault();
        onToggleHelp?.();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onFocusSearch,
    onNewDocument,
    onOpenMovement,
    onSelectNextRow,
    onSelectPrevRow,
    onEscape,
    onToggleHelp,
    onToggleDashboard,
  ]);
}
