'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LuChevronDown,
  LuChevronUp,
  LuChevronsLeft,
  LuChevronsRight,
} from 'react-icons/lu';
import { NavLink } from '@/types/navlink.types';

interface MainNavLinkProps {
  navLink: NavLink[];
  additionalRoutes: NavLink[] | null;
  isShort: boolean;
  setIsShort: React.Dispatch<React.SetStateAction<boolean>>;
  dark?: boolean;
  role?: string;
}

export default function MainNavLink({
  navLink,
  additionalRoutes,
  isShort,
  setIsShort,
  dark = true,
  role,
}: MainNavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);

  const allLinks = useMemo(
    () => [...(navLink || []), ...(additionalRoutes || [])],
    [navLink, additionalRoutes]
  );

  const toggleSubMenu = (name: string) => {
    setOpenSubMenus((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  useEffect(() => {
    const parent = allLinks.find((l) => l.subItems?.some((s) => s.href === pathname));
    if (parent?.name && !openSubMenus.includes(parent.name)) {
      setOpenSubMenus((prev) => [...prev, parent.name]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, allLinks]);

  // Khushbuwaala Theme: Slate & Emerald
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

  // Reusable function to handle parent category click
  const handleParentClick = (link: NavLink) => {
    toggleSubMenu(link.name); // Toggle the visual menu
    if (link.subItems?.[0]?.href) {
      router.push(link.subItems[0].href); // Navigate to the first sub-item
    }
  };

  return (
    <nav className="flex flex-col h-full">
      {/* Sidebar Header */}
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
            'hidden lg:flex items-center justify-center rounded-lg p-2 transition-all',
            dark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-emerald-50 text-slate-600 hover:text-emerald-600'
          )}
          aria-label={isShort ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isShort ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {isShort ? <LuChevronsRight className="h-5 w-5" /> : <LuChevronsLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <ul className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
        {allLinks.map((link) => {
          const subItemActive = link.subItems?.some((sub) => pathname === sub.href) ?? false;
          const isActive = !subItemActive && pathname === link.href;
          const isSubMenuOpen = openSubMenus.includes(link.name);
          const hasSub = !!link.subItems?.length;

          // ================= COLLAPSED MODE =================
          if (isShort) {
            return (
              <li key={link.name} className="group relative">
                {hasSub ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleParentClick(link)}
                      className={cn(baseItemClasses(subItemActive), 'justify-center p-3 group')}
                      title={link.name}
                    >
                      {link.icon && <link.icon className={iconColor(subItemActive)} />}
                    </button>

                    {isSubMenuOpen && (
                      <ul className={cn('mt-1 space-y-1 rounded-lg', dark ? 'bg-slate-800/50' : 'bg-slate-50', 'p-1')}>
                        {link.subItems!.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <li key={sub.name}>
                              <Link
                                href={sub.href}
                                title={sub.name}
                                className={cn(
                                  'w-full flex items-center justify-center rounded-lg p-2 text-sm transition-all',
                                  isSubActive
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : dark
                                      ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                      : 'text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                                )}
                              >
                                {sub.icon ? (
                                  <sub.icon className={cn('h-4 w-4 shrink-0', isSubActive ? 'text-white' : '')} />
                                ) : (
                                  <span className="text-xs font-bold">{sub.name.slice(0, 2).toUpperCase()}</span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(baseItemClasses(isActive), 'justify-center p-3 group')}
                    title={link.name}
                  >
                    {link.icon && <link.icon className={iconColor(isActive)} />}
                  </Link>
                )}
              </li>
            );
          }

          // ================= EXPANDED MODE =================
          return (
            <li key={link.name} className="group">
              {hasSub ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleParentClick(link)}
                    className={cn(baseItemClasses(subItemActive), 'p-3 justify-between group')}
                  >
                    <span className="flex items-center gap-3">
                      {link.icon && <link.icon className={iconColor(subItemActive)} />}
                      <span className="truncate">{link.name}</span>
                    </span>
                    {isSubMenuOpen ? <LuChevronUp className="h-4 w-4 opacity-70" /> : <LuChevronDown className="h-4 w-4 opacity-70" />}
                  </button>
                  {isSubMenuOpen && (
                    <ul className="ml-4 mt-1.5 space-y-1 border-l-2 border-slate-800/40 pl-2">
                      {link.subItems!.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <li key={sub.name}>
                            <Link
                              href={sub.href}
                              className={cn(
                                'w-full flex items-center gap-3 rounded-lg p-2.5 text-sm transition-all',
                                isSubActive
                                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                                  : dark
                                    ? 'text-slate-400 hover:bg-slate-800 hover:text-emerald-300'
                                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              )}
                            >
                              {sub.icon && <sub.icon className={cn('h-4 w-4 shrink-0', isSubActive ? 'text-emerald-400' : '')} />}
                              <span className="truncate">{sub.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                <Link href={link.href} className={cn(baseItemClasses(isActive), 'p-3 group')}>
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