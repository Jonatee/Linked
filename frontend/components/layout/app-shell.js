import LeftSidebar from "@/components/layout/left-sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import RightSidebar from "@/components/layout/right-sidebar";
import SessionHydrator from "@/components/auth/session-hydrator";
import ComposerModal from "@/components/feed/composer-modal";

export default function AppShell({ children, rightSidebar = true }) {
  return (
    <div className="screen-shell grid min-h-screen w-full grid-cols-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      <SessionHydrator />
      <ComposerModal />
      <MobileSidebar />
      <LeftSidebar />
      <main className="min-h-screen space-y-6 border-x border-white/10 px-4 pb-8 pt-24 md:px-6 lg:py-6 lg:pt-6">
        {children}
      </main>
      <div className={rightSidebar ? "hidden border-l border-white/10 p-6 lg:block" : "hidden lg:block"}>{rightSidebar ? <RightSidebar /> : null}</div>
    </div>
  );
}
