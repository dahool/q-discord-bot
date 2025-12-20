import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Link } from "react-router";
import { useGetServerQuery } from '../../lib/server/query';

export default function ServerTitle({serverId}: {serverId: string}) {
  const { data: server, isLoading, error } = useGetServerQuery(serverId);

  if (isLoading) {
    return <ServerTitleLoader></ServerTitleLoader>
  }

  if (error || !server) {
    return <div>Error loading server</div>;
  }

  return (
      <Link to="/" title="Change Server">
          <div className="flex justify-center items-center text-white">
              <LazyLoadImage src={server.icon} className="rounded-full" width={32} height={32} alt="Server"/>&nbsp;{server.name}
          </div>
      </Link>
  );
}

export function ServerTitleLoader() {
    return (
        <div className="flex justify-center items-center">
          <div className="animate-pulse flex items-center">
            <div className="bg-gray-300 rounded-full w-8 h-8"></div>
            <div className="ml-2">
              <div className="bg-gray-300 rounded w-24 h-4"></div>
            </div>
          </div>
        </div>
      );
}