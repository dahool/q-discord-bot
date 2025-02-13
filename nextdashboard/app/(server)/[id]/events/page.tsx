import { fetchServerById } from "@/app/services/services";
import StoreProvider from "@/app/StoreProvider";
import EventList, { EventListLoader } from "@/app/ui/events/event-list";
import { Suspense } from "react";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const server = await fetchServerById((await params).id)
  return (
    <StoreProvider>
      <EventList server={server} />
    </StoreProvider>
  );

}