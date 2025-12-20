import { useParams } from "react-router";
import { useGetServerQuery } from "../../lib/server/query";
import ServerMain, { ServerMainSkeleton } from "../../ui/servers/server-main";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { data: server, isLoading, error } = useGetServerQuery(id!);

  if (isLoading) {
    return (
      <ServerMainSkeleton/>
    );
  }

  if (error || !server) {
    return (
      <div className="p-4 text-red-500">Error loading server</div>
    );
  }

  return (
    <ServerMain server={server} />
  );

}
