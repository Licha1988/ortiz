import CasaOrtizApp from "@/components/CasaOrtizApp";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <CasaOrtizApp username={session.username} />;
}
