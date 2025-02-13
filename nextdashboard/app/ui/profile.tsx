import Image from 'next/image';
import { fetchUser } from '../services/services';
import SignOut from './signout';

export default async function UserProfile() {
  const user = await fetchUser();
  return (
    <>
    <div className="flex justify-center items-center text-white">
      <Image src={user.image} width={32} height={32} className='rounded-full' alt='Profile'/>&nbsp;{user.name}
    </div>
    <SignOut />
    </>
  );
}

export const UserProfileLoader = () => {
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
};