import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { queries } from "../../api/queries";
import { usersApi } from "../../api/users";
import type { AuthUser, Role } from "../../api/auth";
import { ASSIGNABLE_ROLES, ROLES } from "../../auth/roles";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import "./UsersPage.css";

interface PendingChange {
  user: AuthUser;
  role: Role;
}

const columns: SortableColumn<AuthUser>[] = [
  { key: "username", label: "Username", type: "text", value: (u) => u.username },
  { key: "email", label: "Email", type: "text", value: (u) => u.email },
  { key: "role", label: "Role", type: "enum", value: (u) => u.role, options: ROLES },
];

export function UsersPage() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery(queries.users);
  // Mutation failures are shown inline and cleared on the next attempt; a failed
  // fetch is reported by the query itself.
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const { sorted: sortedUsers, sort, setSort } = useSortedRows(usersQuery.data ?? [], columns);

  async function applyRole(user: AuthUser, role: Role) {
    setMutationError(null);
    try {
      await usersApi.updateUserRole(user.id, role);
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.list });
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Failed to update role");
      throw err;
    }
  }

  function handleRoleChange(user: AuthUser, role: Role) {
    if (role === user.role) return;
    if (role === "CONTRIBUTOR") {
      setPending({ user, role });
      return;
    }
    applyRole(user, role).catch(() => {});
  }

  if (usersQuery.isPending) return <p>Loading...</p>;

  return (
    <div>
      <div className="users-header">
        <h1>Users</h1>
      </div>

      {(mutationError || usersQuery.error) && (
        <p className="users-error">{mutationError ?? usersQuery.error?.message}</p>
      )}

      <table>
        <thead>
          <SortHeaders columns={columns} sort={sort} onSortChange={setSort} />
        </thead>
        <tbody>
          {sortedUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                {user.role === "ADMIN" ? (
                  <span className="role-badge">ADMIN</span>
                ) : (
                  <select
                    className="role-select"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() => applyRole(pending!.user, pending!.role)}
        title="Grant contributor access?"
        message={`${pending?.user.username} will be able to add and edit shared content.`}
        confirmLabel="Grant"
        danger={false}
      />
    </div>
  );
}
