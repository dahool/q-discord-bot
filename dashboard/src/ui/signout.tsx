import { FaPowerOff } from "react-icons/fa6";
import { API_ROOT } from "../env";

export default function SignOut() {
  
  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_ROOT}/oauth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        console.error("Logout failed", response.status);
      }
    } catch (err) {
      console.error("Error during logout", err);
    }
  };

  return (
    <div className="w-60">
      <button onClick={handleLogout} className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
        <FaPowerOff className="w-6" />
        <div className="hidden md:block">Sign Out</div>
      </button>
    </div>
  );
}
