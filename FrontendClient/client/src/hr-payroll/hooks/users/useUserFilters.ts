import { useState, useMemo } from 'react';
import { User } from '@hr/types/user';
import { textIncludes } from '@hr/utils/kenyan';

export const useUserFilters = (users: User[]) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;

    return users.filter(user =>
      (user.username && textIncludes(user.username, searchTerm)) ||
      (user.email && textIncludes(user.email, searchTerm)) ||
      (user.fullname && textIncludes(user.fullname, searchTerm)) ||
      (user.role && textIncludes(user.role, searchTerm))
    );
  }, [users, searchTerm]);

  const userStats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === "admin").length;
    const partners = users.filter(u => u.role === "partner").length;

    return {
      total,
      admins,
      partners
    };
  }, [users]);

  return {
    searchTerm,
    setSearchTerm,
    filteredUsers,
    userStats,
  };
};