'use client';

import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import Button from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';

export function AdminLogout() {
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <LogOut className="h-4 w-4" />
      <span>Sign Out</span>
    </Button>
  );
}
