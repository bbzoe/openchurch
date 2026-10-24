import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { getSessionUser } from "@/lib/session";
import { listMyChurches } from "@/server/queries";

export default async function ChurchLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const churches = await listMyChurches(user.id);
  const current = churches.find((church) => church.organizationId === orgId);
  if (!current) redirect("/churches");

  return (
    <AppSidebar orgId={orgId} churchName={current.name} city={current.city} churches={churches}>
      {children}
    </AppSidebar>
  );
}
