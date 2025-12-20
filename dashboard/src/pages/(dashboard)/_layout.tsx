import { Outlet } from 'react-router'
import UserProfile from '../../ui/profile'

export default function Layout() {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12"><Outlet /></div>
      <div className="fixed bottom-0 left-0 w-full bg-gray-800 p-4 text-black">
        <div className="flex justify-between w-full">
            <UserProfile/>
        </div>
      </div>
    </div>
  )
}