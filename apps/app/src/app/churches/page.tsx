import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listMyChurches } from "@/server/queries";

export default async function ChurchesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const churches = await listMyChurches(user.id);
  if (churches.length === 0) redirect("/churches/new");
  redirect(`/churches/${churches[0].organizationId}`);
}
