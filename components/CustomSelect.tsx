"use client";

import React, { useState, useRef, useEffect, useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
  compact?: boolean;
  showSearch?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  id,
  ariaLabel,
  compact = false,
  showSearch,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options if search is enabled
  const shouldShowSearch = showSearch ?? options.length > 12;
  const filteredOptions = searchTerm.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    : options;

  // Group options if applicable
  const groupedOptions: { group?: string; items: SelectOption[] }[] = [];
  filteredOptions.forEach((opt) => {
    const groupName = opt.group;
    const existing = groupedOptions.find((g) => g.group === groupName);
    if (existing) {
      existing.items.push(opt);
    } else {
      groupedOptions.push({ group: groupName, items: [opt] });
    }
  });

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(0);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && shouldShowSearch) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldShowSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex].value);
        closeDropdown();
      }
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    closeDropdown();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        role="combobox"
        aria-controls={`${selectId}-list`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || placeholder}
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            setIsOpen(true);
          }
        }}
        className={`w-full flex items-center justify-between text-left rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] cursor-pointer transition-all shadow-2xs ${
          compact
            ? "px-3 py-1.5 text-xs font-medium"
            : "px-3.5 py-2.5 text-xs font-medium"
        } ${isOpen ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/15" : ""}`}
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[var(--accent)]" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Flyout Menu */}
      {isOpen && (
        <div
          id={`${selectId}-list`}
          ref={listRef}
          role="listbox"
          aria-labelledby={selectId}
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Optional Search Filter */}
          {shouldShowSearch && (
            <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search options..."
                className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-56 py-1 divide-y divide-[var(--border-subtle)]/30">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs sm:text-sm text-[var(--text-muted)]">
                No matching options found
              </div>
            ) : (
              groupedOptions.map((grp, gIdx) => (
                <div key={grp.group || `grp-${gIdx}`} className="py-0.5">
                  {grp.group && (
                    <div className="px-3 py-1 text-xs font-mono uppercase tracking-wider font-bold text-[var(--text-muted)] bg-[var(--bg-canvas)]/60">
                      {grp.group}
                    </div>
                  )}
                  {grp.items.map((opt) => {
                    const isSelected = opt.value === value;
                    const flatIdx = filteredOptions.indexOf(opt);
                    const isHighlighted = flatIdx === highlightedIndex;

                    return (
                      <div
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(opt.value)}
                        onMouseEnter={() => setHighlightedIndex(flatIdx)}
                        className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold"
                            : isHighlighted
                              ? "bg-[var(--bg-elevated)] text-[var(--text-main)]"
                              : "text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && (
                          <svg
                            className="w-3.5 h-3.5 shrink-0 text-[var(--accent)] ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
