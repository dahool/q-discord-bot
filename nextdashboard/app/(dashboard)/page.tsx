import { Suspense } from "react";
import ServerList, { ServerListSkeleton } from "@/app/ui/servers/server-list";

export default async function Page() {
  return (
    <div className="grid h-auto w-full place-items-center">
      <Suspense fallback={<ServerListSkeleton/>}>
        <ServerList />
      </Suspense>
    </div>
  );
}
