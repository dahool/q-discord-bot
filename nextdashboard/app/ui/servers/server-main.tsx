import { Server } from "@/app/models";
import Image from "next/image";

export default async function ServerMain({server}: {server: Server}) {
    return (
        <div className="flex justify-center items-center mt-100">
            <Image src={server.icon} className="rounded-full" width={256} height={256} alt="Server"/>
        </div>
    );
}

export function ServerMainSkeleton() {
    return (
        <>
            <div className="flex justify-center items-center mt-100">
                <div className="animate-pulse rounded-full bg-gray-300 w-64 h-64"></div>
            </div>
        </>
    )
}