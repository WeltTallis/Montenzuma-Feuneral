import { useState } from 'react';
import { Key01, LogOut01, UserCircle } from '@untitledui/icons';
import { Button } from '@hr/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@hr/components/ui/dropdown-menu';
import { UserAvatar } from '@hr/components/ui/user-avatar';
import { UserProfileSheet } from '@hr/components/sheets/UserProfileSheet';
import { useAuth } from '@hr/contexts';
import { useModalNavigation } from '@hr/hooks/useModalNavigation';
import { MODAL_IDS } from '@hr/constants/modalRegistry';
import { cn } from '@hr/lib/utils';
import type { AppRole } from '@hr/lib/auth';

interface UserAvatarDropdownProps {
  className?: string;
}

export const UserAvatarDropdown = ({ className }: UserAvatarDropdownProps) => {
  const { user, logout } = useAuth();
  const { openModal } = useModalNavigation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return null;

  const getRoleText = (role: AppRole): string => {
    if (role === 'admin') return 'Quản trị viên';
    if (role === 'partner' || role === 'adv_partner') return 'Management';
    if (role === 'accountant') return 'Accountant';
    return 'Employees';
  };

  const handleViewProfile = () => {
    setIsProfileOpen(true);
  };

  const handleChangePassword = () => {
    openModal(MODAL_IDS.CHANGE_PASSWORD);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "relative h-11 w-11 rounded-full hover:bg-accent hover:text-accent-foreground p-0",
              className
            )}
            aria-label="Menu người dùng"
          >
            <UserAvatar
              email={user.email}
              name={user.name}
              username={user.username}
              size="md"
              className="h-8 w-8"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 max-h-[80vh] overflow-y-auto z-[9999]"
          align="end"
          sideOffset={8}
          avoidCollisions={false}
          forceMount
        >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="typography-body-medium leading-none">{user.name}</p>
            <p className="typography-body-small leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="typography-body-small leading-none text-muted-foreground">
              {getRoleText(user.role)}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleViewProfile}>
          <UserCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Thông tin cá nhân</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleChangePassword}>
          <Key01 className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Đổi mật khẩu</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut01 className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Sign out</span>
        </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>

    <UserProfileSheet
      isOpen={isProfileOpen}
      onClose={() => setIsProfileOpen(false)}
    />
    </>
  );
};
