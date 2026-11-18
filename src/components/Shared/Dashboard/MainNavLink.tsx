'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LuChevronDown, LuChevronsLeft, LuChevronsRight } from 'react-icons/lu';
import { NavLink } from '@/types/navlink.types';

interface MainNavLinkProps {
  navLink: NavLink[];
  additionalRoutes: NavLink[] | null;
  isShort: boolean;
  setIsShort: React.Dispatch<React.SetStateAction<boolean>>;
  dark?: boolean;
  role?: string;
  onLinkClick?: () => void;
}

export default function MainNavLink({
  navLink,
  additionalRoutes,
  isShort,
  setIsShort,
  dark = true,
  role,
  onLinkClick,
}: MainNavLinkProps) {
  const pathname = usePathname();
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const allLinks = useMemo(
    () => [...(navLink || []), ...(additionalRoutes || [])],
    [navLink, additionalRoutes]
  );

  const toggleSubMenu = (name: string) => {
    setOpenSubMenu((prev) => (prev === name ? null : name));
  };

  useEffect(() => {
    const parent = allLinks.find((l) => l.subItems?.some((s) => s.href === pathname));
    if (parent?.name && openSubMenu !== parent.name) {
      setOpenSubMenu(parent.name);
    }
  }, [pathname, allLinks]);

  const baseItemClasses = (active: boolean) =>
    cn(
      'w-full flex items-center gap-3 rounded-xl transition-all duration-200 select-none font-medium text-sm',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
      active
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
        : dark
          ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
          : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
    );

  const iconColor = (active: boolean) =>
    cn(
      'h-5 w-5 shrink-0 transition-colors',
      active ? 'text-white' : dark ? 'text-slate-400 group-hover:text-emerald-400' : 'text-slate-500 group-hover:text-emerald-600'
    );

  // 👇 Clean, native handling for closing the sidebar
  const handleLinkClick = () => {
    if (onLinkClick) onLinkClick();
  };

  return (
    <nav className="flex flex-col h-full">
      <div className={cn('flex items-center justify-between mb-8 px-2', isShort && 'justify-center')}>
        {!isShort && (
          <div className="flex flex-col">
            <h2 className={cn('text-xl font-extrabold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>
              Khushbuwaala
            </h2>
            {role && (
              <span className="text-xs text-emerald-500 font-semibold tracking-wider mt-1">
                {role.replace(/_/g, ' ').toUpperCase()}
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => setIsShort((p) => !p)}
          className={cn(
            'hidden lg:flex items-center justify-center rounded-lg p-2 transition-all duration-300 ease-in-out',
            dark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-emerald-50 text-slate-600 hover:text-emerald-600'
          )}
          aria-label="Toggle sidebar"
          type="button"
        >
          {isShort ? <LuChevronsRight className="h-5 w-5" /> : <LuChevronsLeft className="h-5 w-5" />}
        </button>
      </div>

      <ul className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
        {allLinks.map((link) => {
          const subItemActive = link.subItems?.some((sub) => pathname === sub.href) ?? false;
          const isActive = !subItemActive && pathname === link.href;
          const isSubMenuOpen = openSubMenu === link.name;
          const hasSub = !!link.subItems?.length;

          if (isShort) {
            return (
              <li key={link.name} className="group relative">
                {hasSub ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleSubMenu(link.name)}
                      className={cn(baseItemClasses(subItemActive), 'justify-center p-3 group')}
                      title={link.name}
                    >
                      {link.icon && <link.icon className={iconColor(subItemActive)} />}
                    </button>

                    <div className={cn(
                      'absolute left-full top-0 ml-2 w-48 rounded-xl p-1 shadow-xl transition-all duration-200 z-50',
                      dark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200',
                      isSubMenuOpen ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-2'
                    )}>
                      <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{link.name}</div>
                      {link.subItems!.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={handleLinkClick}
                            className={cn(
                              'flex items-center gap-3 rounded-lg p-2.5 text-sm transition-all',
                              isSubActive
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            )}
                          >
                            {sub.icon && <sub.icon className={cn('h-4 w-4 shrink-0', isSubActive ? 'text-white' : '')} />}
                            <span>{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    className={cn(baseItemClasses(isActive), 'justify-center p-3 group')}
                    title={link.name}
                  >
                    {link.icon && <link.icon className={iconColor(isActive)} />}
                  </Link>
                )}
              </li>
            );
          }

          return (
            <li key={link.name} className="group">
              {hasSub ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleSubMenu(link.name)}
                    className={cn(baseItemClasses(subItemActive), 'p-3 justify-between group')}
                  >
                    <span className="flex items-center gap-3">
                      {link.icon && <link.icon className={iconColor(subItemActive)} />}
                      <span className="truncate">{link.name}</span>
                    </span>
                    <LuChevronDown
                      className={cn("h-4 w-4 opacity-70 transition-transform duration-300 ease-in-out", isSubMenuOpen ? "rotate-180" : "rotate-0")}
                    />
                  </button>

                  <div className={cn("grid transition-all duration-300 ease-in-out", isSubMenuOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 mt-0")}>
                    <ul className="overflow-hidden ml-4 space-y-1 border-l-2 border-slate-800/40 pl-2">
                      {link.subItems!.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <li key={sub.name} className="pt-1">
                            <Link
                              href={sub.href}
                              onClick={handleLinkClick}
                              className={cn(
                                'w-full flex items-center gap-3 rounded-lg p-2.5 text-sm transition-all duration-200',
                                isSubActive
                                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                                  : dark ? 'text-slate-400 hover:bg-slate-800 hover:text-emerald-300' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              )}
                            >
                              {sub.icon && <sub.icon className={cn('h-4 w-4 shrink-0', isSubActive ? 'text-emerald-400' : '')} />}
                              <span className="truncate">{sub.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              ) : (
                <Link
                  href={link.href}
                  onClick={handleLinkClick}
                  className={cn(baseItemClasses(isActive), 'p-3 group')}
                >
                  {link.icon && <link.icon className={iconColor(isActive)} />}
                  <span className="truncate">{link.name}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}