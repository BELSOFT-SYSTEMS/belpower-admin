'use client';

type Props = {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit';
};

export function AdminPurchaseButton({
  text,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
}: Props) {
  return (
    <div className={`admin_purchase_btn_wrap ${className}`}>
      <button type={type} onClick={onClick} disabled={disabled || loading}>
        {loading ? 'Processing…' : text}
      </button>
    </div>
  );
}
