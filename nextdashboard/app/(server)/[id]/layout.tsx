import MainContent from "../../ui/main-content";
import { ToastContainer } from 'react-toastify';

//export const dynamic = 'force-dynamic'

export default async function ServerLayout({ params, children }: Readonly<{params: Promise<{ id: string }>, children: React.ReactNode;}>) {
    const serverId = (await params).id
    return (
        <>
        <ToastContainer autoClose={5000} position="bottom-right"/>
        <MainContent serverId={serverId}>{children}</MainContent>
        </>
    );
}