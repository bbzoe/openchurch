import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { isPlatformAdmin } from "@/server/queries";

export async function requireOperator() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (!(await isPlatformAdmin(user.id))) redirect("/sign-in");
  return user;
}
