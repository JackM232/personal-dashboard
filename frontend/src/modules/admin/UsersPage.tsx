import { useEffect, useState } from "react";
import { usersApi } from "../../api/users";
import type { AuthUser, Role } from "../../api/auth";
import { ASSIGNABLE_ROLES, ROLES } from "../../auth/roles";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SortHeaders, useSortedRows } from "../../components/SortableTable";
import type { SortableColumn } from "../../components/SortableTable";
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
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const { sorted: sortedUsers, sort, setSort } = useSortedRows(users, columns);

  function loadUsers() {
    return usersApi.listUsers().then(setUsers);
  }

  useEffect(() => {
    loadUsers()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function applyRole(user: AuthUser, role: Role) {
    setError(null);
    try {
      await usersApi.updateUserRole(user.id, role);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
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

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="users-header">
        <h1>Users</h1>
      </div>

      {error && <p className="users-error">{error}</p>}

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
