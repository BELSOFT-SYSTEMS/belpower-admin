'use client';

import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import Button from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';

export function LogoutButton() {
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="flex items-center gap-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </Button>
  );
}
