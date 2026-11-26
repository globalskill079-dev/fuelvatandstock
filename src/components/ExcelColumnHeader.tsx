import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown, 
  Filter, 
  Check, 
  X, 
  Search,
  CheckSquare,
  Square
} from 'lucide-react';

export interface ExcelColumnHeaderProps {
  title: string;
  columnKey: string;
  align?: 'left' | 'right' | 'center';
  currentSortKey: string | null;
  currentSortDir: 'asc' | 'desc' | null;
  onSort: (key: string) => void;
  uniqueValues?: { value: string; label: string; count?: number }[];
  selectedFilterValues?: Set<string> | null;
  onFilterChange?: (values: Set<string> | null) => void;
  isNumeric?: boolean;
  className?: string;
}

export const ExcelColumnHeader: React.FC<ExcelColumnHeaderProps> = ({
  title,
  columnKey,
  align = 'left',
  currentSortKey,
  currentSortDir,
  onSort,
  uniqueValues = [],
  selectedFilterValues = null,
  onFilterChange,
  isNumeric = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  const isSorted = currentSortKey === columnKey;
  const isFiltered = selectedFilterValues !== null && selectedFilterValues.size > 0;

  // Initialize temp selection when dropdown opens
  useEffect(() => {
    if (isOpen) {
      if (selectedFilterValues !== null) {
        setTempSelected(new Set(selectedFilterValues));
      } else {
        // All selected by default
        setTempSelected(new Set(uniqueValues.map((u) => u.value)));
      }
      setFilterSearch('');
    }
  }, [isOpen, selectedFilterValues, uniqueValues]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSortClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSort(columnKey);
  };

  const handleToggleValue = (val: string) => {
    const next = new Set(tempSelected);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    setTempSelected(next);
  };

  const handleSelectAll = () => {
    setTempSelected(new Set(uniqueValues.map((u) => u.value)));
  };

  const handleClearAll = () => {
    setTempSelected(new Set());
  };

  const handleApplyFilter = () => {
    if (!onFilterChange) return;
    // If all are selected, filter is effectively null (inactive)
    if (tempSelected.size === uniqueValues.length) {
      onFilterChange(null);
    } else {
      onFilterChange(new Set(tempSelected));
    }
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    if (onFilterChange) {
      onFilterChange(null);
    }
    setIsOpen(false);
  };

  const filteredValuesList = uniqueValues.filter((u) =>
    u.label.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 select-none ${
        align === 'right' ? 'justify-end w-full' : align === 'center' ? 'justify-center w-full' : 'justify-start'
      } ${className}`}
    >
      {/* Title & Click-to-Sort area */}
      <button
        type="button"
        onClick={handleSortClick}
        title={`Sort by ${title}`}
        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer font-bold group"
      >
        <span>{title}</span>
        {isSorted ? (
          currentSortDir === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 opacity-60 group-hover:opacity-100 transition" />
        )}
      </button>

      {/* Excel AutoFilter Dropdown Trigger */}
      {onFilterChange && uniqueValues.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          title={`Excel Filter: ${title}`}
          className={`p-1 rounded transition relative cursor-pointer ${
            isFiltered
              ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Filter className={`w-3 h-3 ${isFiltered ? 'fill-indigo-600 dark:fill-indigo-400 text-indigo-600' : ''}`} />
          {isFiltered && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          )}
        </button>
      )}

      {/* Excel Filter Dropdown Popup */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full mt-1.5 z-50 min-w-[220px] max-w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: align === 'right' ? 'auto' : 0,
            right: align === 'right' ? 0 : 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
              Filter: {title}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Sort Options */}
          <div className="space-y-1 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => {
                if (!isSorted || currentSortDir !== 'asc') onSort(columnKey);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${
                isSorted && currentSortDir === 'asc'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isNumeric ? 'Sort Smallest to Largest' : 'Sort A to Z (Ascending)'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isSorted || currentSortDir !== 'desc') onSort(columnKey);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${
                isSorted && currentSortDir === 'desc'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isNumeric ? 'Sort Largest to Smallest' : 'Sort Z to A (Descending)'}</span>
            </button>
          </div>

          {/* Search Box within Filter Values */}
          <div className="relative mb-2">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search values..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Select All / Clear All toggles */}
          <div className="flex items-center justify-between px-1 mb-1.5 text-[10px] font-semibold text-slate-500">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>

          {/* Values Checkbox List */}
          <div className="max-h-40 overflow-y-auto space-y-0.5 border border-slate-100 dark:border-slate-800 rounded-lg p-1 bg-slate-50/50 dark:bg-slate-950/40">
            {filteredValuesList.length === 0 ? (
              <div className="py-3 text-center text-slate-400 text-[11px]">No matching values</div>
            ) : (
              filteredValuesList.map((item) => {
                const checked = tempSelected.has(item.value);
                return (
                  <label
                    key={item.value}
                    onClick={() => handleToggleValue(item.value)}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer text-[11px] transition"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-3.5 h-3.5 pointer-events-none"
                    />
                    <span className="flex-1 truncate font-medium">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="text-[10px] text-slate-400 font-mono">({item.count})</span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClearFilter}
              className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApplyFilter}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow-xs transition"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
