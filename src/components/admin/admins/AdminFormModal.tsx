'use client';

import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import type { AdminFormValues, AdminRole } from '@/types/adminManagement';
import { ADMIN_ROLE_LABELS } from '@/types/adminManagement';

type AdminFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: AdminFormValues;
  roleOptions: AdminRole[];
  onClose: () => void;
  onSubmit: (values: AdminFormValues) => void;
};

function buildEmptyForm(defaultRole: AdminRole): AdminFormValues {
  return {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: defaultRole,
    status: 'active',
  };
}

export function AdminFormModal({
  open,
  mode,
  initial,
  roleOptions,
  onClose,
  onSubmit,
}: AdminFormModalProps) {
  const defaultRole = roleOptions[0] ?? 'support';
  const [form, setForm] = useState<AdminFormValues>(() => buildEmptyForm(defaultRole));

  useEffect(() => {
    if (open) {
      setForm(initial ?? buildEmptyForm(defaultRole));
    }
  }, [open, initial, defaultRole]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
        className="admin_modal admin_modal_form_dialog"
        role="dialog"
        aria-modal="true"
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
          <div className="admin_modal_body">
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
          {roleOptions.length > 0 && (
            <div className="admin_form_row">
              <label htmlFor="admin-role">Role</label>
              <AdminDropdown
                id="admin-role"
                value={form.role}
                onChange={(value) => set('role', value as AdminRole)}
                options={roleOptions.map((role) => ({
                  value: role,
                  label: ADMIN_ROLE_LABELS[role],
                }))}
              />
            </div>
          )}
          {mode === 'create' && (
            <p className="admin_form_hint">
              A setup email will be sent after the account is created. The admin completes
              activation via the invite link.
            </p>
          )}
          </div>
          <div className="admin_modal_footer">
          <div className="admin_modal_actions">
            <button type="button" className="btn_secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn_primary">
              {mode === 'create' ? 'Create admin' : 'Save changes'}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}
