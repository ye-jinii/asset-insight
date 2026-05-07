'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Asset Insight Logo"
              width={40}
              height={40}
              className="w-10 h-10"
              priority
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Asset Insight
              </h1>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              시뮬레이터
            </Link>
            <Link
              href="/ledger"
              className={`text-sm font-medium transition-colors ${
                pathname === '/ledger'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              가계부
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
