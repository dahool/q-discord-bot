import { useGetUserQuery } from '../lib/server/query';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import SignOut from './signout';

export default function UserProfile() {
  const { data: user, isLoading, isError } = useGetUserQuery()

  if (isLoading) {
    return <UserProfileLoader/>
  }

  if (isError || !user) {
    return <div className="p-4 text-red-500">Error loading user</div>
  }
  return (
    <>
    <div className="flex justify-center items-center text-white">
      <LazyLoadImage src={user.icon} width={32} height={32} className='rounded-full' alt='Profile'/>&nbsp;{user.username}
    </div>
    <SignOut />
    </>
  );
}

const UserProfileLoader = () => {
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