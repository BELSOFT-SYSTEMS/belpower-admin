'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import type { NotificationUserOption } from '@/lib/adminNotifications';
import { getAvatarBackground, getUserInitials } from '@/utils/userAvatar';

type NotificationUserSearchProps = {
  users: NotificationUserOption[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
  onClear: () => void;
  onSearch: (query: string) => void;
  isSearching?: boolean;
};

export function NotificationUserSearch({
  users,
  selectedUserId,
  onSelect,
  onClear,
  onSearch,
  isSearching = false,
}: NotificationUserSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(query), 300);
    return () => window.clearTimeout(timer);
  }, [query, onSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return users.slice(0, 8);
    return users;
  }, [users, query]);

  return (
    <div className="notif_user_search" ref={wrapRef}>
      {selectedUser ? (
        <div className="notif_user_selected">
          <div
            className="notif_user_selected_avatar"
            style={{ background: getAvatarBackground(selectedUser.email) }}
          >
            {getUserInitials(selectedUser.first_name, selectedUser.last_name)}
          </div>
          <div className="notif_user_selected_copy">
            <strong>
              {selectedUser.first_name} {selectedUser.last_name}
            </strong>
            <span>{selectedUser.email}</span>
            <span className="notif_user_selected_id">{selectedUser.id}</span>
          </div>
          <button
            type="button"
            className="notif_user_clear"
            onClick={() => {
              onClear();
              setQuery('');
            }}
            aria-label="Clear selected user"
          >
            <FaTimes />
          </button>
        </div>
      ) : (
        <>
          <div className="notif_user_search_input_wrap">
            <FaSearch className="notif_user_search_icon" />
            <input
              id="notif-user-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search by name, email, or ID"
              autoComplete="off"
            />
          </div>

          {open && (
            <ul className="notif_user_suggestions" role="listbox">
              {isSearching && (
                <li className="notif_user_suggestions_empty">Searching…</li>
              )}
              {!isSearching && suggestions.length === 0 && (
                <li className="notif_user_suggestions_empty">No users found</li>
              )}
              {!isSearching &&
                suggestions.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      className="notif_user_suggestion_item"
                      onClick={() => {
                        onSelect(user.id);
                        setQuery('');
                        setOpen(false);
                      }}
                    >
                      <div
                        className="notif_user_suggestion_avatar"
                        style={{ background: getAvatarBackground(user.email) }}
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
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
