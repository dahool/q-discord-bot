import ServerMain, {ServerMainSkeleton} from "@/app/ui/servers/server-main";
import { Suspense } from "react";
import { getServer } from "@/lib/server/api";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const server = await getServer((await params).id)
  return (
    <Suspense fallback={<ServerMainSkeleton/>}>
      <ServerMain server={server} />
    </Suspense>
  );

}

