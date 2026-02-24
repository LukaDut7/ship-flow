"use client";

import { StoreProvider } from "@/lib/store";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import MiddlePanel from "@/components/MiddlePanel";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  return (
    <StoreProvider>
      <div className="h-screen flex flex-col overflow-hidden bg-bg-primary text-text-primary">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MiddlePanel />
          <ChatPanel />
        </div>
      </div>
    </StoreProvider>
  );
}
