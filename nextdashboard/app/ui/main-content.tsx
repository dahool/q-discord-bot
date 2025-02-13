import SideNav from "./sidenav";

export default function MainContent({ serverId, children}: Readonly<{serverId: string, children: React.ReactNode;}>) {
    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="w-full flex-none md:w-64">
          <SideNav serverId={serverId} />
        </div>
        <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
        </div>
    )

}