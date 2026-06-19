'use client';

type AdminRowCheckboxProps = {
  checked: boolean;
  label: string;
  onChange: () => void;
};

export function AdminRowCheckbox({ checked, label, onChange }: AdminRowCheckboxProps) {
  return (
    <label className="admin_row_checkbox" onClick={(event) => event.stopPropagation()}>
      <input
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={onChange}
        onClick={(event) => event.stopPropagation()}
      />
    </label>
  );
}
