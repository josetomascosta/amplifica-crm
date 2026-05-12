import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { AIAssistant } from "@/components/ai-assistant";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.email?.endsWith("@amplifica.io")) {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar user={session.user} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#F0F2F7",
          }}
        >
          {children}
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}
