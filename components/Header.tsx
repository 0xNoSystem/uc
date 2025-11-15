'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Instagram, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '#products', label: 'Catalogue' },
  { href: '#contact', label: 'Contact' },
];

type HeaderProps = {
  cartCount?: number;
};

const Header = ({ cartCount = 0 }: HeaderProps) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-black/95 backdrop-blur py-4">
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <nav className="hidden gap-6 text-sm font-semibold tracking-wide text-white lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-gray-300"
                scroll={link.href.startsWith('#')}
                prefetch={false}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href="/"
          className="flex-1 text-center font-bold text-2xl tracking-[0.30em] mr-12 text-white md:flex-none md:text-3xl md:tracking-[0.5em]"
        >
          UNDERCONTROL
        </Link>

        <div className="mr-6 flex items-center justify-end gap-4 text-white">
          <Link
            href="#checkout"
            scroll
            prefetch={false}
            className="relative rounded-full p-1 hover:bg-white/10"
          >
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-white px-1.5 text-xs font-semibold text-black">
                {cartCount}
              </span>
            )}
          </Link>
          <a  href="https://www.instagram.com/undercontrol.vr" target="_blank">
          <Instagram className="ml-2 h-6 w-6" />
          </a>
        </div>
      </div>

      <nav
        className={`overflow-hidden border-t border-white/10 bg-black/95 px-4 pb-4 pt-2 text-white transition-all duration-300 md:hidden ${
          open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block py-2 text-sm font-semibold tracking-wide"
            onClick={() => setOpen(false)}
            scroll={link.href.startsWith('#')}
            prefetch={false}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
