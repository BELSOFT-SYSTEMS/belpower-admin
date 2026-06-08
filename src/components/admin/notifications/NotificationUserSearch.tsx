'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import type { UserListItem } from '@/data/adminMockData';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';

type NotificationUserSearchProps = {
  users: UserListItem[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
  onClear: () => void;
};

export function NotificationUserSearch({
  users,
  selectedUserId,
  onSelect,
  onClear,
}: NotificationUserSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      return (
        fullName.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    });
  }, [users, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user: UserListItem) => {
    onSelect(user.id);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setQuery('');
    setOpen(false);
  };

  if (selectedUser) {
    return (
      <div className="notif_user_selected">
        <div
          className="admin_user_avatar_initials notif_user_selected_avatar"
          style={{ backgroundColor: getAvatarBackground(selectedUser.id) }}
          aria-hidden
        >
          {getUserInitials(selectedUser.first_name, selectedUser.last_name)}
        </div>
        <div className="notif_user_selected_copy">
          <strong>
            {selectedUser.first_name} {selectedUser.last_name}
          </strong>
          <span>{selectedUser.email}</span>
          <span className="notif_user_selected_id">ID: {selectedUser.id}</span>
        </div>
        <button
          type="button"
          className="notif_user_clear"
          onClick={handleClear}
          aria-label="Clear selected user"
        >
          <FaTimes />
        </button>
      </div>
    );
  }

  return (
    <div className="notif_user_search" ref={wrapRef}>
      <div className="notif_user_search_input_wrap">
        <FaSearch className="notif_user_search_icon" aria-hidden />
        <input
          id="notif-user-search"
          type="text"
          value={query}
          placeholder="Search by name, email, or user ID"
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && query.trim().length > 0 && (
        <ul className="notif_user_suggestions" role="listbox">
          {suggestions.length > 0 ? (
            suggestions.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  role="option"
                  className="notif_user_suggestion_item"
                  onClick={() => handleSelect(user)}
                >
                  <div
                    className="admin_user_avatar_initials notif_user_suggestion_avatar"
                    style={{ backgroundColor: getAvatarBackground(user.id) }}
                    aria-hidden
                  >
                    {getUserInitials(user.first_name, user.last_name)}
                  </div>
                  <div className="notif_user_suggestion_copy">
                    <strong>
                      {user.first_name} {user.last_name}
                    </strong>
                    <span>{user.email}</span>
                    <span className="notif_user_suggestion_id">{user.id}</span>
                  </div>
                  <span className={`pill pill_${user.status}`}>{user.status}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="notif_user_suggestions_empty">No users match your search.</li>
          )}
        </ul>
      )}
    </div>
  );
}
