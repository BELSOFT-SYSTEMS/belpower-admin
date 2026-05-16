"use client";

import { GoHomeFill } from "react-icons/go";
import Link from "next/link";
import "@/components/layout/sidebar/sidebar.css";
import { FaClipboardList, FaUsers } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { usePathname } from "next/navigation";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { MdLogout } from "react-icons/md";

const getMenuItems = (t: (key: string) => string) => [
  { name: t('navigation.Home'), href: "/admin", icon: <GoHomeFill size={18} /> },
  { name: t('navigation.Users'), href: "/admin/users", icon: <FaUsers size={16} /> },
  { name: t('navigation.Transactions'), href: "/admin/transactions", icon: <FaClipboardList size={16} /> },
];

const getSupportItems = (t: (key: string) => string) => [
  {
    name: t('accountSettings.Settings'),
    href: "/admin/settings",
    icon: <IoMdSettings size={20} />,
  },
];

export default function AdminSidebar() {
  const { t } = useAppTranslation();
  const pathname = usePathname();

  return (
    <div className="container">
      <nav className="sidenav">
        <ul>
          {getMenuItems(t).map((item, index) => (
            <li key={index}>
              <Link
                href={item.href}
                className={`sidebar_link ${pathname === item.href && "active"}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="support_links">
          {getSupportItems(t).map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`sidebar_link ${pathname === item.href && "active"}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}

          <Link href={"/"} className="">
            <MdLogout size={20} />
            <span>{t('common.logout')}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
