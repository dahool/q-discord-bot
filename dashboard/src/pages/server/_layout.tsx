import { Outlet, useParams } from "react-router";
import { ToastContainer } from "react-toastify";
import MainContent from '../../ui/main-content';

export default function Layout() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <ToastContainer autoClose={5000} position="bottom-right" />
      <MainContent serverId={id!}><Outlet/></MainContent>
    </>
  );
}
