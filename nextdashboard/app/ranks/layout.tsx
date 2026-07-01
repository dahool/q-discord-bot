import StoreProvider from "../StoreProvider"

export default async function StoreProviderLayout({ params, children }: Readonly<{params: Promise<{ id: string }>, children: React.ReactNode;}>) {
    const serverId = (await params).id
    return (
        <StoreProvider>
            {children}
        </StoreProvider>
    );
}