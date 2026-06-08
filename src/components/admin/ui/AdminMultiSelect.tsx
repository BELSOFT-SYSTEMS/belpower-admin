'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import '@/styles/adminDropdown.css';

export type AdminMultiSelectOption = {
  value: string;
  label: string;
};

type AdminMultiSelectProps = {
  values: string[];
  onChange: (values: string[]) => void;
  options: AdminMultiSelectOption[];
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
};

function formatTriggerLabel(
  values: string[],
  options: AdminMultiSelectOption[],
  placeholder: string
): string {
  if (values.length === 0) return placeholder;
  const labels = values
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .filter(Boolean);
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return labels.join(', ');
  return `${labels[0]}, ${labels[1]} +${labels.length - 2} more`;
}

export function AdminMultiSelect({
  values,
  onChange,
  options,
  placeholder = 'Select options…',
  className = '',
  id,
  'aria-label': ariaLabel,
}: AdminMultiSelectProps) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const triggerLabel = useMemo(
    () => formatTriggerLabel(values, options, placeholder),
    [values, options, placeholder]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const selectedTags = values
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is AdminMultiSelectOption => !!o);

  return (
    <div className={className}>
      <div
        ref={wrapRef}
        className={`admin_multiselect${open ? ' is_open' : ''}`}
      >
        <button
          type="button"
          id={triggerId}
          className="admin_multiselect_trigger"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span
            className={`admin_dropdown_trigger_label${values.length === 0 ? ' is_placeholder' : ''}`}
          >
            {triggerLabel}
          </span>
          <FaChevronDown className="admin_dropdown_chevron" aria-hidden />
        </button>

        {open && (
          <div className="admin_multiselect_menu">
            <div className="admin_multiselect_menu_header">
              <span>
                {values.length} selected
              </span>
              {values.length > 0 && (
                <button
                  type="button"
                  className="admin_multiselect_clear"
                  onClick={() => onChange([])}
                >
                  Clear all
                </button>
              )}
            </div>
            <ul className="admin_multiselect_options" role="listbox" aria-labelledby={triggerId}>
              {options.map((option) => {
                const checked = values.includes(option.value);
                return (
                  <li key={option.value}>
                    <label className="admin_multiselect_option">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleValue(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="admin_multiselect_selected_tags">
          {selectedTags.map((tag) => (
            <span key={tag.value} className="admin_multiselect_tag">
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
