import { fetchServerById } from "@/app/services/services";
import ServerMain, {ServerMainSkeleton} from "@/app/ui/servers/server-main";
import { Suspense } from "react";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const server = await fetchServerById((await params).id)
  return (
    <Suspense fallback={<ServerMainSkeleton/>}>
      <ServerMain server={server} />
    </Suspense>
  );

}

