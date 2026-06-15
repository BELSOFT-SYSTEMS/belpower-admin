'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminShell } from '@/context/AdminShellContext';
import { ADMIN_NAV_ITEMS } from '@/constants/adminNavPermissions';
import { canAccessAdminManagement } from '@/utils/adminManagementAccess';
import '@/styles/adminShell.css';

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { canAccess, admin } = useAdminAuth();

  const navigation = ADMIN_NAV_ITEMS.filter((item) => {
    if (item.href === '/command-center/admins') {
      return canAccessAdminManagement(admin);
    }
    return !item.permission || canAccess(item.permission);
  });

  const isNavActive = (href: string) => {
    if (href === '/command-center') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="admin_sidebar_nav">
      {navigation.map((item) => {
        const isActive = isNavActive(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            title={collapsed ? item.name : undefined}
            onClick={onNavigate}
            className={`admin_sidebar_link${isActive ? ' is_active' : ''}`}
          >
            <span className="admin_sidebar_icon">{item.icon}</span>
            <span className="admin_sidebar_label">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const {
    mobileNavOpen,
    setMobileNavOpen,
    sidebarCollapsed,
    toggleSidebarCollapsed,
  } = useAdminShell();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  const collapseLabel = sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <>
      {mobileNavOpen ? (
        <button
          type="button"
          className="admin_nav_overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`admin_mobile_drawer${mobileNavOpen ? ' is_open' : ''}`}
        aria-hidden={!mobileNavOpen}
      >
        <div className="admin_sidebar_inner">
          <div className="admin_sidebar_header">
            <h1 className="admin_sidebar_title">Command Center</h1>
          </div>
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} collapsed={false} />
        </div>
      </aside>

      <div
        className={`admin_sidebar_shell${sidebarCollapsed ? ' is_collapsed' : ''}`}
      >
        <aside className="admin_sidebar">
          <div className="admin_sidebar_inner">
            <div className="admin_sidebar_header">
              <h1 className="admin_sidebar_title">Command Center</h1>
            </div>
            <SidebarNav collapsed={sidebarCollapsed} />
          </div>
        </aside>
        <button
          type="button"
          className="admin_sidebar_edge_toggle"
          onClick={toggleSidebarCollapsed}
          aria-label={collapseLabel}
          title={collapseLabel}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={14} aria-hidden />
          ) : (
            <ChevronLeft size={14} aria-hidden />
          )}
        </button>
      </div>
    </>
  );
}

export default Sidebar;
