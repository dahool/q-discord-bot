'use client';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import clsx from 'clsx';
import { FaCalendarDay } from 'react-icons/fa6';
import { Params } from 'next/dist/server/request/params';

const links = [
  { name: 'Events', href: '/[id]/events', icon: FaCalendarDay },
];

export default function NavLinks() {
  const pathname = usePathname();
  const params = useParams();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        let href = parseNavLink(link.href, params);
        return (
          <Link
            key={link.name}
            href={href}
            title={link.name}
            className={clsx('flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === href
              })
            }
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}

export function parseNavLink(phref: string, params: Params) {
  let href = phref;
  Object.entries(params).forEach(([key, value]) => {
    href = href.replace(`\[${key}\]`, value as string);
  });
  return href;
}