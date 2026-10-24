"use client";

export function RoleSelect({
  action,
  roleId,
  roles,
}: {
  action: (formData: FormData) => void;
  roleId: string;
  roles: { id: string; name: string }[];
}) {
  return (
    <form action={action} className="mt-2">
      <select
        name="roleId"
        defaultValue={roleId}
        aria-label="Role"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm"
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    </form>
  );
}
