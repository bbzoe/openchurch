import { addPeopleFromList, addPerson, addRole, renameRole, updatePersonRole } from "@/server/actions";
import { RoleSelect } from "@/components/role-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="mx-auto max-w-2xl">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">{mode === "setup" ? "Add your team" : "People"}</h1>
        <p className="mt-2 text-sm text-body">
          Paste emails first. Change a role in the list. It saves as soon as you pick it.
        </p>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </section>
      <div className="mt-8 grid gap-8">
        <form action={addPeopleFromList.bind(null, orgId)} className="grid gap-3">
          <h2 className="text-lg font-semibold">Add a list of emails</h2>
          <p className="text-sm text-body">One address per line. Everyone in the list gets the role below. You can change a role after.</p>
          <input type="hidden" name="next" value={mode} />
          <label className="grid gap-1 text-sm font-medium">
            Emails
            <Textarea name="emails" required rows={6} placeholder={"anna@church.org\npiotr@church.org"} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Role for this list
            <select name="roleId" className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm">
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <Button className="h-11 w-fit rounded-full px-5 font-semibold">Add emails</Button>
        </form>
        {people.length === 0 ? (
          <p className="text-sm text-body">No one yet.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {people.map((item) => (
              <li key={item.id} className="py-4">
                <p className="font-semibold">{[item.firstName, item.lastName].filter(Boolean).join(" ")}</p>
                <p className="text-sm text-body">{item.email}</p>
                <RoleSelect action={updatePersonRole.bind(null, orgId, item.id)} roleId={item.roleId} roles={roles} />
              </li>
            ))}
          </ul>
        )}
        {mode === "setup" && people.length > 0 ? (
          <a href={`/churches/${orgId}`} className="inline-flex h-11 w-fit items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground">
            Continue
          </a>
        ) : null}
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Add one person</summary>
          <form action={addPerson.bind(null, orgId)} className="mt-4 grid gap-3">
          <input type="hidden" name="next" value={mode} />
          <label className="grid gap-1 text-sm font-medium">
            First name
            <Input name="firstName" required className="h-11" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Last name
            <Input name="lastName" required className="h-11" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Email
            <Input name="email" type="email" required className="h-11" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Role
            <select name="roleId" className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm">
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <Button className="h-11 w-fit rounded-full px-5 font-semibold">Add person</Button>
          </form>
        </details>
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Roles</summary>
          <div className="mt-4">
          <ul className="mt-3 grid gap-2">
            {roles.map((role) => (
              <li key={role.id}>
                <form action={renameRole.bind(null, orgId, role.id)} className="flex gap-2">
                  <Input name="name" defaultValue={role.name} className="h-10 flex-1" />
                  <Button variant="outline" className="h-10 rounded-full bg-white px-3">
                    Rename
                  </Button>
                </form>
              </li>
            ))}
          </ul>
          <form action={addRole.bind(null, orgId)} className="mt-4 flex gap-2">
            <Input name="name" placeholder="New role" className="h-10 flex-1" />
            <Button variant="outline" className="h-10 rounded-full bg-white px-3">
              Add role
            </Button>
          </form>
          </div>
        </details>
      </div>
    </div>
  );
}
