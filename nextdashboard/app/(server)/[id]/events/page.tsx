import StoreProvider from "@/app/StoreProvider";
import EventList from "@/app/ui/events/event-list";
import { getServer } from "@/lib/server/api";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const server = await getServer((await params).id)
  return (
    <StoreProvider>
      <EventList server={server} />
    </StoreProvider>
  );

}