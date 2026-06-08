'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import '@/styles/adminDropdown.css';

export type AdminDropdownOption = {
  value: string;
  label: string;
};

type AdminDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: AdminDropdownOption[];
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'filter';
  id?: string;
  'aria-label'?: string;
  disabled?: boolean;
};

export function AdminDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  variant = 'default',
  id,
  'aria-label': ariaLabel,
  disabled = false,
}: AdminDropdownProps) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const isPlaceholder = !selected;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div
      ref={wrapRef}
      className={`admin_dropdown${variant === 'filter' ? ' filter' : ''}${open ? ' is_open' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        id={triggerId}
        className="admin_dropdown_trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span
          className={`admin_dropdown_trigger_label${isPlaceholder ? ' is_placeholder' : ''}`}
        >
          {displayLabel}
        </span>
        <FaChevronDown className="admin_dropdown_chevron" aria-hidden />
      </button>

      {open && (
        <ul className="admin_dropdown_menu" role="listbox" aria-labelledby={triggerId}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === option.value}
                className={`admin_dropdown_option${value === option.value ? ' is_selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
