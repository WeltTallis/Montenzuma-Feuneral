import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@hr/components/ui/badge";
import { UserAvatar } from "@hr/components/ui/user-avatar";
import { User } from "@hr/types/user";
import { formatKenyanDate } from "@hr/utils/kenyan";

interface CreateUserColumnsProps {
  // No action handlers needed since we'll use row clicks
}

export const createUserColumns = (
  _props: CreateUserColumnsProps = {},
): ColumnDef<User>[] => [
  {
    id: "stt",
    header: "No.",
    size: 40,
    cell: ({ row }) => {
      return (
        <div className="text-center typography-label-medium">
          {row.index + 1}
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: "Users",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <UserAvatar size="sm" name={user.fullname} username={user.username} />
          <div>
            <div className="typography-label-medium">{user.fullname}</div>
            <div className="typography-body-medium text-muted-foreground">
              @{user.username}
            </div>
            <div className="typography-body-small text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "mobile",
    header: "Phone",
    cell: ({ row }) => {
      return (
        <div className="typography-body-medium">{row.original.mobile || "—"}</div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      let roleLabel = "Users";
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";

      if (role === "admin") {
        roleLabel = "Administrator";
        variant = "destructive";
      } else if (role === "partner") {
        roleLabel = "Management";
        variant = "default";
      } else if (role === "employee") {
        roleLabel = "Employees";
        variant = "outline";
      } else if (role === "adv_partner") {
        roleLabel = "Advance payment manager";
        variant = "outline";
      } else if (role === "accountant") {
        roleLabel = "Accountant";
        variant = "outline";
      }

      return <Badge variant={variant}>{roleLabel}</Badge>;
    },
  },
  {
    accessorKey: "current_project_names",
    header: "Projects",
    // Computed per page after the server query — the backend cannot sort by
    // it, so the header must not offer sorting (it used to 500 the list).
    enableSorting: false,
    cell: ({ row }) => {
      const names = row.original.current_project_names ?? [];
      return (
        <div className="typography-body-medium">
          {names.length > 0 ? names.join(", ") : "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "last_login",
    header: "Last active",
    cell: ({ row }) => {
      const lastLogin = row.getValue("last_login") as string | undefined;
      return (
        <div className="typography-body-medium">
          {lastLogin
            ? formatKenyanDate(lastLogin, "dd/MM/yyyy HH:mm")
            : "Never logged in"}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created on",
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as string;
      return (
        <div className="typography-body-medium">
          {formatKenyanDate(createdAt)}
        </div>
      );
    },
  },
];
