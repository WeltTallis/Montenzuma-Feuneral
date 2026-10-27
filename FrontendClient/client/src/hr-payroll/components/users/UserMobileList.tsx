import React from "react";
import { UserAvatar } from "@hr/components/ui/user-avatar";
import { EmptyState } from "@hr/components/shared/EmptyState";
import type { User } from "@hr/types/user";

interface UserMobileListProps {
  users: User[];
  onRowClick?: (user: User) => void;
  emptyState?: React.ReactNode;
}

const ROLE_CONFIG = {
  admin: {
    label: "Administrator",
    dot: "bg-red-500",
    card: "border-red-200 bg-red-50/60",
    name: "text-red-900",
    sub: "text-red-700",
  },
  partner: {
    label: "Management",
    dot: "bg-blue-500",
    card: "border-blue-200 bg-blue-50/60",
    name: "text-blue-900",
    sub: "text-blue-700",
  },
  adv_partner: {
    label: "Advance payment manager",
    dot: "bg-violet-500",
    card: "border-violet-200 bg-violet-50/60",
    name: "text-violet-900",
    sub: "text-violet-700",
  },
  accountant: {
    label: "Accountant",
    dot: "bg-amber-500",
    card: "border-amber-200 bg-amber-50/60",
    name: "text-amber-900",
    sub: "text-amber-800",
  },
  employee: {
    label: "Employees",
    dot: "bg-gray-400",
    card: "border-border/60 bg-card",
    name: "text-foreground",
    sub: "text-muted-foreground",
  },
} as const;

type Role = keyof typeof ROLE_CONFIG;

const UserGridCard = React.memo(function UserGridCard({
  user,
  onRowClick,
}: {
  user: User;
  onRowClick?: (user: User) => void;
}) {
  const cfg = ROLE_CONFIG[(user.role as Role)] ?? ROLE_CONFIG.employee;

  return (
    <button
      type="button"
      onClick={() => onRowClick?.(user)}
      className={`flex w-full flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all active:scale-[0.98] active:brightness-95 touch-manipulation ${cfg.card}`}
      aria-label={`View details for ${user.fullname}`}
    >
      <div className="relative">
        <UserAvatar
          name={user.fullname}
          username={user.username}
          size="md"
          className="ring-2 ring-background"
        />
        {/* Role dot */}
        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background ${cfg.dot}`} />
      </div>
      <div className="w-full min-w-0">
        <p className={`line-clamp-2 min-h-8 break-words text-xs font-semibold leading-4 ${cfg.name}`}>{user.fullname}</p>
        <p className={`mt-0.5 truncate text-xs ${cfg.sub}`}>@{user.username}</p>
        <p className={`mt-0.5 text-xs font-medium leading-4 ${cfg.sub}`}>{cfg.label}</p>
      </div>
    </button>
  );
});

export function UserMobileList({ users, onRowClick, emptyState }: UserMobileListProps) {
  if (users.length === 0) {
    return (
      emptyState || <EmptyState title="No users found" description="There is no data to display." size="sm" />
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {users.map((user) => (
          <UserGridCard key={user.id} user={user} onRowClick={onRowClick} />
        ))}
      </div>
    </div>
  );
}
