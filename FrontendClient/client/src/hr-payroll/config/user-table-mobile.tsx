import { format } from "date-fns";
import { Badge } from "@hr/components/ui/badge";
import { UserAvatar } from "@hr/components/ui/user-avatar";
import { User } from "@hr/types/user";
import { MobileField } from "@hr/components/ui/responsive-table";
interface CreateUserMobileConfigProps {
  // No action handlers needed since we'll use row clicks
}
export const createUserMobileConfig = (
  _props: CreateUserMobileConfigProps = {},
) => {
  const mobileFields: MobileField<User>[] = [
    {
      key: "role",
      label: "Vai trò",
      priority: 1,
      render: (user) => {
        let roleLabel = "Users";
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";

        if (user.role === "admin") {
          roleLabel = "Quản trị viên";
          variant = "destructive";
        } else if (user.role === "partner") {
          roleLabel = "Management";
          variant = "default";
        } else if (user.role === "employee") {
          roleLabel = "Employees";
          variant = "outline";
        }

        return <Badge variant={variant}> {roleLabel} </Badge>;
      },
    },
    {
      key: "last_login",
      label: "Hoạt động cuối",
      priority: 2,
      render: (user) => (
        <div className="typography-body-medium text-muted-foreground">
          {" "}
          {user.last_login
            ? format(new Date(user.last_login), 'dd/MM/yyyy')
            : "Chưa đăng nhập"}{" "}
        </div>
      ),
    },
    {
      key: "mobile",
      label: "SDT",
      priority: 2,
      render: (user) => (
        <div className="typography-body-medium text-muted-foreground">
          {user.mobile || "—"}
        </div>
      ),
    },
    {
      key: "current_project_names",
      label: "Projects",
      priority: 2,
      render: (user) => (
        <div className="typography-body-medium text-muted-foreground">
          {(user.current_project_names ?? []).join(", ") || "—"}
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created on",
      priority: 2,
      render: (user) => (
        <div className="typography-body-medium text-muted-foreground">
          {" "}
          {format(new Date(user.created_at), 'dd/MM/yyyy')}{" "}
        </div>
      ),
    },
  ];
  const rowTitle = (user: User) => (
    <div className="flex items-center gap-3">
      <UserAvatar name={user.fullname} username={user.username} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="typography-body-large truncate">{user.fullname}</p>
        <p className="typography-body-medium text-muted-foreground truncate">{user.email}</p>
      </div>
    </div>
  );
  const rowSubtitle = (user: User) => (
    <div className="typography-body-medium text-muted-foreground">
      {" "}
      @{user.username}{" "}
    </div>
  );
  return { mobileFields, rowTitle, rowSubtitle };
};
