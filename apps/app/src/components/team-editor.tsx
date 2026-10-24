import { addPerson, addRole, renameRole, updatePersonRole } from "@/server/actions";
import { Button } from "@/components/ui/button";

type Role = { id: string; name: string };
type Person = { id: string; firstName: string; lastName: string; email: string; roleId: string; roleName: string };

export function TeamEditor({
  orgId,
  roles,
  people,
  error,
  mode,
}: {
  orgId: string;
  roles: Role[];
  people: Person[];
  error?: string;
  mode: "setup" | "people";
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">{mode === "setup" ? "Add your team" : "People"}</h1>
        <p className="mt-2 text-sm text-body">
          First name, last name, email, and a role. Pastor, Deacon, and Worship leader are already here. Add your own roles if you need them.
        </p>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        {people.length === 0 ? (
          <p className="mt-6 rounded-[22px] border border-line bg-white p-6 text-sm text-body">No one yet. Add the first person.</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {people.map((item) => (
              <li key={item.id} className="rounded-[22px] border border-line bg-white p-5">
                <p className="font-semibold">
                  {item.firstName} {item.lastName}
                </p>
                <p className="text-sm text-body">{item.email}</p>
                <form action={updatePersonRole.bind(null, orgId, item.id)} className="mt-3 flex gap-2">
                  <select name="roleId" defaultValue={item.roleId} className="h-10 flex-1 rounded-xl border border-line bg-white px-3 text-sm">
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" className="h-10 rounded-full bg-white px-3">
                    Save role
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {mode === "setup" ? (
          <div className="mt-6">
            {people.length === 0 ? (
              <p className="text-sm text-body">Add at least one person to open the app.</p>
            ) : (
              <a href={`/churches/${orgId}`} className="inline-flex h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground">
                Continue
              </a>
            )}
          </div>
        ) : null}
      </section>
      <div className="grid h-fit gap-4">
        <form action={addPerson.bind(null, orgId)} className="grid gap-3 rounded-[22px] border border-line bg-white p-6">
          <h2 className="text-lg font-semibold">Add a person</h2>
          <input type="hidden" name="next" value={mode} />
          <label className="grid gap-1 text-sm font-medium">
            First name
            <input name="firstName" required className="h-11 rounded-xl border border-line px-3" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Last name
            <input name="lastName" required className="h-11 rounded-xl border border-line px-3" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Email
            <input name="email" type="email" required className="h-11 rounded-xl border border-line px-3" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Role
            <select name="roleId" className="h-11 rounded-xl border border-line bg-white px-3">
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <Button className="h-11 w-fit rounded-full px-5 font-semibold">Add person</Button>
        </form>
        <div className="rounded-[22px] border border-line bg-white p-6">
          <h2 className="text-lg font-semibold">Roles</h2>
          <ul className="mt-3 grid gap-2">
            {roles.map((role) => (
              <li key={role.id}>
                <form action={renameRole.bind(null, orgId, role.id)} className="flex gap-2">
                  <input name="name" defaultValue={role.name} className="h-10 flex-1 rounded-xl border border-line px-3 text-sm" />
                  <Button variant="outline" className="h-10 rounded-full bg-white px-3">
                    Rename
                  </Button>
                </form>
              </li>
            ))}
          </ul>
          <form action={addRole.bind(null, orgId)} className="mt-4 flex gap-2">
            <input name="name" placeholder="New role" className="h-10 flex-1 rounded-xl border border-line px-3 text-sm" />
            <Button variant="outline" className="h-10 rounded-full bg-white px-3">
              Add role
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
