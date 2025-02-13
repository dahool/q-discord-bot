'use client'
import { FaPowerOff } from "react-icons/fa6";
import { signOut } from "next-auth/react"

export default function SignOut() {
  return (
    <div className="w-60">
      <button onClick={() => signOut()} className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
        <FaPowerOff className="w-6" />
        <div className="hidden md:block">Sign Out</div>
      </button>
    </div>
  );
}
