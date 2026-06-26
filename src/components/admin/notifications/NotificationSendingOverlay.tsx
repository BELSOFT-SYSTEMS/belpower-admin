'use client';

type NotificationSendingOverlayProps = {
  open: boolean;
  isEmail?: boolean;
};

export function NotificationSendingOverlay({
  open,
  isEmail = false,
}: NotificationSendingOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="notif_sending_overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Sending notification"
    >
      <div className="notif_sending_card">
        <h2>
          Sending
          <span className="notif_sending_dots" aria-hidden="true" />
        </h2>
        <p>
          {isEmail
            ? 'Delivering your email campaign to recipients. Please wait.'
            : 'Delivering your notification to recipients. Please wait.'}
        </p>
      </div>
    </div>
  );
}
