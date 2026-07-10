import { TopNav } from "@/components/layout/top-nav";
import { AiProvider } from "@/components/ai/ai-provider";
import { ChatDrawer } from "@/components/ai/chat-drawer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AiProvider>
      <TopNav />
      <main className="flex-1">{children}</main>
      <ChatDrawer />
    </AiProvider>
  );
}
