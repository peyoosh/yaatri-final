import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

const SearchableSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Search and select...",
  multiple = true,
  displayKey = 'name',
  valueKey = '_id',
  renderOption,
  className = "",
  disabled = false,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            handleOptionClick(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions]);

  const handleOptionClick = (option) => {
    const optionValue = option[valueKey];
    let newValue;

    if (multiple) {
      if (value.includes(optionValue)) {
        // Remove if already selected
        newValue = value.filter(v => v !== optionValue);
      } else {
        // Add if not selected
        newValue = [...value, optionValue];
      }
    } else {
      // Single select
      newValue = value.includes(optionValue) ? [] : [optionValue];
      setIsOpen(false);
      setSearchTerm('');
    }

    onChange(newValue);
  };

  const removeValue = (valueToRemove) => {
    const newValue = value.filter(v => v !== valueToRemove);
    onChange(newValue);
  };

  const getSelectedLabels = () => {
    return value.map(val => {
      const option = options.find(opt => opt[valueKey] === val);
      return option ? (renderOption ? renderOption(option) : option[displayKey] || option.name || option.username) : val;
    });
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return getSelectedLabels()[0];
    return `${value.length} selected`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Selected values display */}
      <div
        className={`min-h-[38px] w-full bg-teal-steel border border-toxic-lime/30 rounded-md px-3 py-2 cursor-pointer flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-toxic-lime/50'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {value.length > 0 ? (
            multiple ? (
              getSelectedLabels().map((label, index) => (
                <span
                  key={value[index]}
                  className="inline-flex items-center gap-1 bg-toxic-lime/20 text-toxic-lime px-2 py-1 rounded text-xs"
                >
                  {label}
                  <X
                    size={12}
                    className="cursor-pointer hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeValue(value[index]);
                    }}
                  />
                </span>
              ))
            ) : (
              <span className="text-white text-sm">{getDisplayText()}</span>
            )
          ) : (
            <span className="text-white/60 text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-teal-steel border border-toxic-lime/30 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search input */}
          <div className="p-2 border-b border-toxic-lime/20">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(-1);
              }}
              className="w-full bg-obsidian border border-toxic-lime/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-toxic-lime"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options */}
          <div className="py-1">
            {loading ? (
              <div className="px-3 py-4 text-center text-white/60 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-toxic-lime mx-auto mb-2"></div>
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-white/60 text-sm">No options found</div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue = option[valueKey];
                const isSelected = value.includes(optionValue);
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={optionValue}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                      isHighlighted ? 'bg-toxic-lime/20' : 'hover:bg-toxic-lime/10'
                    }`}
                    onClick={() => handleOptionClick(option)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {renderOption ? renderOption(option) : (
                        <span className="text-white text-sm">
                          {option[displayKey] || option.name || option.username}
                          {option.email && (
                            <span className="text-white/60 ml-2">({option.email})</span>
                          )}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-toxic-lime" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;