import { ListGroup } from "flowbite-react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useGetServersQuery } from "../../lib/server/query";
import { Link } from "react-router";

export default function ServerList() {
  const { data: servers, isLoading, isError } = useGetServersQuery();

  if (isLoading) return <ServerListSkeleton />;
  if (isError || !servers) return <div>Error loading servers</div>;

  return (
    <div className="flex w-full">
      <ListGroup className="w-full">
        {servers.map((server) => (
          <Link to={`/server/${server.id}`} className="flex w-full">
            <ListGroup.Item
              key={server.id}
              className="flex w-full justify-between items-center"
            >
              <div className="flex w-full justify-between items-center">
                <h5 className="mb-1">{server.name}</h5>
                <LazyLoadImage
                  src={server.icon}
                  className="rounded-full"
                  width={128}
                  height={128}
                  alt="Server"
                />
              </div>
            </ListGroup.Item>
          </Link>
        ))}
      </ListGroup>
      
    </div>
  );
}

function ServerListSkeleton() {
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
