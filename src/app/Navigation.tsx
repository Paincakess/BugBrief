'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const NAV_ITEMS = [
    { href: '/', label: 'Home' },
    { href: '/explainer', label: 'Explainer' },
    { href: '/report', label: 'Report Gen' },
    { href: '/history', label: 'History' },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-1 bg-white/[0.02] rounded-xl p-1.5 border border-white/[0.04]">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                            "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                            isActive
                                ? "text-white bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/[0.08]"
                                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                        )}
                    >
                        <span className="relative z-10">{item.label}</span>
                        {/* Active indicator dot */}
                        {isActive && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
