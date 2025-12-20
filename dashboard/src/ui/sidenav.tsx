import NavLinks from './navlinks';
import ServerTitle, { ServerTitleLoader } from './servers/server-title';
import { Suspense } from 'react';
import UserProfile from './profile';

export default function SideNav({serverId}: {serverId: string}) {
  return (
    <div className="flex text-black h-full flex-col px-3 py-4 md:px-2 bg-gray-800 transition-transform duration-300 ease-in-out">
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <Suspense fallback={<ServerTitleLoader/>}>
          <ServerTitle serverId={serverId} />
        </Suspense>
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-800 md:block"></div>
        <UserProfile/>
      </div>
    </div>
  );
}
