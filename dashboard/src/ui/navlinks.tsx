import { Link, useParams, useLocation } from "react-router";
import clsx from "clsx";
import { FaCalendarDay } from "react-icons/fa6";

const links = [
  { name: "Events", href: "/server/:id", icon: FaCalendarDay },
];

export default function NavLinks() {
  const location = useLocation();
  const params = useParams();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        const href = parseNavLink(link.href, params);

        return (
          <Link
            key={link.name}
            to={href}
            title={link.name}
            className={clsx(
              "flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-sky-100 text-blue-600": location.pathname === href,
              }
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}

function parseNavLink(phref: string, params: Record<string, string | undefined>) {
  let href = phref;
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      href = href.replace(`:${key}`, value);
    }
  });
  return href;
}
