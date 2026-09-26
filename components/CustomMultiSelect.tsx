"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { SelectOption } from "./CustomSelect";

export interface MultiSelectOption extends SelectOption {
  count?: number;
}

interface CustomMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
  compact?: boolean;
  showSearch?: boolean;
  matchMode?: "all" | "any";
  onMatchModeChange?: (mode: "all" | "any") => void;
}

export function CustomMultiSelect({
  values,
  onChange,
  options,
  placeholder = "Select multiple...",
  id,
  ariaLabel,
  compact = false,
  showSearch = true,
  matchMode,
  onMatchModeChange,
}: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const valueSet = useMemo(() => new Set(values), [values]);

  // Selected label summary
  const summaryText = useMemo(() => {
    if (values.length === 0) return placeholder;
    if (values.length === 1) {
      const match = options.find((o) => o.value === values[0]);
      return match ? match.label : values[0];
    }
    const firstMatch = options.find((o) => o.value === values[0]);
    const firstLabel = firstMatch ? firstMatch.label : values[0];
    return `${firstLabel} +${values.length - 1} (${values.length})`;
  }, [values, options, placeholder]);

  // Filter options by search
  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.group && opt.group.toLowerCase().includes(q))
    );
  }, [options, searchTerm]);

  // Group options if applicable
  const groupedOptions = useMemo(() => {
    const groups: { group?: string; items: MultiSelectOption[] }[] = [];
    filteredOptions.forEach((opt) => {
      const groupName = opt.group;
      const existing = groups.find((g) => g.group === groupName);
      if (existing) {
        existing.items.push(opt);
      } else {
        groups.push({ group: groupName, items: [opt] });
      }
    });
    return groups;
  }, [filteredOptions]);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(0);
  };

  const toggleOption = (val: string) => {
    if (valueSet.has(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const handleSelectAllVisible = () => {
    const allVals = Array.from(
      new Set([...values, ...filteredOptions.map((o) => o.value)])
    );
    onChange(allVals);
  };

  const handleClearAll = () => {
    onChange([]);
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
    if (isOpen && showSearch) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showSearch]);

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
    } else if (e.key === "Enter" || e.key === " ") {
      if (
        document.activeElement === searchInputRef.current &&
        e.key === " "
      ) {
        return; // Allow typing space in search input
      }
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        toggleOption(filteredOptions[highlightedIndex].value);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <div
        className={`w-full flex items-center justify-between text-left rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:border-[var(--border-strong)] transition-all shadow-2xs ${
          compact
            ? "px-3 py-1.5 text-xs font-medium"
            : "px-3.5 py-2.5 text-xs font-medium"
        } ${isOpen ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/15" : ""}`}
      >
        <button
          id={selectId}
          type="button"
          role="combobox"
          aria-controls={`${selectId}-list`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel || placeholder}
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-1.5 truncate text-left cursor-pointer focus:outline-none"
        >
          {values.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-[var(--accent)] text-white">
              {values.length}
            </span>
          )}
          <span
            className={`truncate ${
              values.length > 0
                ? "font-semibold text-[var(--text-main)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            {summaryText}
          </span>
        </button>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {values.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              title="Clear selection"
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-0.5 cursor-pointer text-[var(--text-muted)]"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
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
        </div>
      </div>

      {/* Flyout Menu */}
      {isOpen && (
        <div
          id={`${selectId}-list`}
          ref={listRef}
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={selectId}
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-80 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 min-w-[260px]"
        >
          {/* Top Control Bar: Search + Match Mode Toggle */}
          <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-1.5">
            {showSearch && (
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search filter options..."
                className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            )}

            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-0.5 px-0.5">
              {onMatchModeChange && matchMode && (
                <div className="flex items-center gap-1">
                  <span>Match:</span>
                  <div className="inline-flex rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5">
                    <button
                      type="button"
                      onClick={() => onMatchModeChange("all")}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        matchMode === "all"
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                      title="Match ALL selected (AND logic, e.g. both Subaru AND Emilia)"
                    >
                      All (AND)
                    </button>
                    <button
                      type="button"
                      onClick={() => onMatchModeChange("any")}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        matchMode === "any"
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                      title="Match ANY selected (OR logic, e.g. either Subaru OR Emilia)"
                    >
                      Any (OR)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="text-[var(--accent)] hover:underline cursor-pointer font-medium"
                >
                  Select All
                </button>
                <span className="text-[var(--border-strong)]">•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[var(--text-muted)] hover:text-red-400 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Options Checklist */}
          <div className="overflow-y-auto max-h-60 py-1 divide-y divide-[var(--border-subtle)]/30">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs sm:text-sm text-[var(--text-muted)]">
                No matching options found
              </div>
            ) : (
              groupedOptions.map((grp, gIdx) => (
                <div key={grp.group || `grp-${gIdx}`} className="py-0.5">
                  {grp.group && (
                    <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)] bg-[var(--bg-canvas)]/60">
                      {grp.group}
                    </div>
                  )}
                  {grp.items.map((opt) => {
                    const isSelected = valueSet.has(opt.value);
                    const flatIdx = filteredOptions.indexOf(opt);
                    const isHighlighted = flatIdx === highlightedIndex;

                    return (
                      <div
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => toggleOption(opt.value)}
                        onMouseEnter={() => setHighlightedIndex(flatIdx)}
                        className={`flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[var(--accent-bg)]/60 text-[var(--text-main)]"
                            : isHighlighted
                              ? "bg-[var(--bg-elevated)] text-[var(--text-main)]"
                              : "text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Controlled by outer div click
                          className="h-3.5 w-3.5 rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer shrink-0 pointer-events-none"
                        />
                        <span className={`truncate flex-1 ${isSelected ? "font-semibold" : ""}`}>
                          {opt.label}
                        </span>
                        {opt.count !== undefined && (
                          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)] shrink-0">
                            {opt.count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer with done button */}
          <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">
              {values.length} selected
            </span>
            <button
              type="button"
              onClick={closeDropdown}
              className="px-3 py-1 text-xs font-semibold rounded bg-[var(--accent)] text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
