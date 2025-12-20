import { FaDiscord } from "react-icons/fa";

export default function LoginScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <button
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <FaDiscord className="w-6 h-6" />
        <span className="font-semibold">Sign in with Discord</span>
      </button>
    </div>
  );
}
