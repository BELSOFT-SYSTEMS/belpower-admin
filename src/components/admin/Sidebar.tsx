'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaUsers, FaExchangeAlt, FaTachometerAlt, FaCog } from 'react-icons/fa';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

export function Sidebar() {
  const pathname = usePathname();

  const navigation: NavItem[] = [
    { name: 'Home', href: '/command-center', icon: <FaHome className="w-5 h-5" /> },
    { name: 'Users', href: '/command-center/users', icon: <FaUsers className="w-5 h-5" /> },
    {
      name: 'Transactions',
      href: '/command-center/transactions',
      icon: <FaExchangeAlt className="w-5 h-5" />,
    },
    {
      name: 'Check Meter',
      href: '/command-center/check-meter',
      icon: <FaTachometerAlt className="w-5 h-5" />,
    },
    { name: 'Settings', href: '/command-center/settings', icon: <FaCog className="w-5 h-5" /> },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Command Center</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1 bg-white">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
