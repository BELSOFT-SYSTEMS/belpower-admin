'use client';

import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import type { AdminFormValues, AdminRole, AdminStatus } from '@/types/adminManagement';
import { ADMIN_ROLE_LABELS, ADMIN_ROLES } from '@/types/adminManagement';

type AdminFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: AdminFormValues;
  onClose: () => void;
  onSubmit: (values: AdminFormValues) => void;
};

const emptyForm: AdminFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: 'admin',
  status: 'active',
};

export function AdminFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: AdminFormModalProps) {
  const [form, setForm] = useState<AdminFormValues>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(initial ?? emptyForm);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const set = <K extends keyof AdminFormValues>(key: K, value: AdminFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className="admin_modal"
        role="dialog"
        aria-labelledby="admin-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="admin-form-title">
            {mode === 'create' ? 'Create admin' : 'Update admin'}
          </h2>
          <button type="button" className="admin_modal_close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="admin_modal_form">
          <div className="admin_form_row">
            <label htmlFor="admin-first">First name</label>
            <input
              id="admin-first"
              required
              value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)}
            />
          </div>
          <div className="admin_form_row">
            <label htmlFor="admin-last">Last name</label>
            <input
              id="admin-last"
              required
              value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)}
            />
          </div>
          <div className="admin_form_row">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <div className="admin_form_row">
            <label htmlFor="admin-phone">Phone</label>
            <input
              id="admin-phone"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+234 ..."
            />
          </div>
          <div className="admin_form_row">
            <label htmlFor="admin-role">Role</label>
            <select
              id="admin-role"
              value={form.role}
              onChange={(e) => set('role', e.target.value as AdminRole)}
            >
              {ADMIN_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ADMIN_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
          <div className="admin_form_row">
            <label htmlFor="admin-status">Status</label>
            <select
              id="admin-status"
              value={form.status}
              onChange={(e) => set('status', e.target.value as AdminStatus)}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          {mode === 'create' && (
            <p className="admin_form_hint">
              A temporary password will be emailed after the account is created (mock).
            </p>
          )}
          <div className="admin_modal_actions">
            <button type="button" className="btn_secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn_primary">
              {mode === 'create' ? 'Create admin' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
