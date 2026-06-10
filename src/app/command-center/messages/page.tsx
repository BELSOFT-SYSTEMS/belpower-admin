'use client';

import { FaComments } from 'react-icons/fa';
import '@/styles/adminMessages.css';
import '@/styles/adminShared.css';

// Full mock UI preserved in page.mock.tsx for future implementation.

export default function MessagesPage() {
  return (
    <div className="messages_page">
      <h1>Messages</h1>

      <div className="messages_coming_soon">
        <FaComments className="messages_coming_soon_icon" aria-hidden />
        <h2>Coming soon</h2>
        <p>
          In-app messaging with users will be available here in a future release.
          Support conversations, search, and reply flows are not live yet.
        </p>
      </div>
    </div>
  );
}
