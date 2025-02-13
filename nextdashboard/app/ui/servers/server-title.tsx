import { fetchServerById } from "@/app/services/services";
import Image from "next/image";
import Link from "next/link";

export default async function ServerTitle({serverId}: {serverId: string}) {
  const server = await fetchServerById(serverId);
  return (
      <Link href="/" title="Change Server">
          <div className="flex justify-center items-center text-white">
              <Image src={server.icon} className="rounded-full" width={32} height={32} alt="Server"/>&nbsp;{server.name}
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