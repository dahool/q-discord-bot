import { useParams } from "react-router";
import { useGetServerQuery } from "../../../lib/server/query";
import EventList from "../../../ui/events/event-list";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { data: server, isLoading, error } = useGetServerQuery(id!);

  if (isLoading) {
    return (
      <div className="p-4">Loading...</div>
    );
  }

  if (error || !server) {
    return (
      <div className="p-4 text-red-500">Error loading server</div>
    );
  }

  return (
    <EventList server={server} />
  );

}
