import { fetchServers } from "@/app/services/services";
import { ListGroup } from "flowbite-react";
import Image from "next/image";

export default async function ServerList() {
    const servers = await fetchServers();
    return (
        <div className="flex w-full">
            <ListGroup className="w-full">
            {servers.map((server) => {
                return (
                    <ListGroup.Item key={server.id} href={`/${server.id}`} className="flex w-full justify-between items-center">
                        <div className="flex w-full justify-between items-center">
                            <h5 className="mb-1">{server.name}</h5>
                            <Image src={server.icon} className="rounded-full" width={128} height={128} alt="Server"/>
                        </div>
                    </ListGroup.Item>
                );
            })}
            </ListGroup>
        </div>
    );
}

export function ServerListSkeleton() {
    return (
      <>
        <div className="bg-white flex w-full p-5">
            <div className="w-full">
                <div className="flex w-full justify-between items-center animate-pulse mb-4">
                    <div className="flex w-full justify-between items-center">
                        <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
                        <div className="h-32 w-32 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
                <div className="flex w-full justify-between items-center animate-pulse mb-4">
                    <div className="flex w-full justify-between items-center">
                        <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
                        <div className="h-32 w-32 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
                <div className="flex w-full justify-between items-center animate-pulse mb-4">
                    <div className="flex w-full justify-between items-center">
                        <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
                        <div className="h-32 w-32 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
      </>
    );
};
