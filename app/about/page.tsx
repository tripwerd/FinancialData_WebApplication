"use client";

import { useState } from "react";

export default function About() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar menu */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-card-border bg-card-bg transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-card-border p-4">
          <span className="text-lg font-semibold text-green-primary">Yardstick</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="cursor-pointer text-text-muted hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <nav className="p-4">
          <a href="/" className="block cursor-pointer rounded-lg px-4 py-3 text-foreground hover:bg-background">
            Home
          </a>
          <a href="/about" className="block cursor-pointer rounded-lg px-4 py-3 text-foreground hover:bg-background">
            About
          </a>
          <a href="/support" className="block cursor-pointer rounded-lg px-4 py-3 text-foreground hover:bg-background">
            Support
          </a>
        </nav>
      </div>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Menu toggle button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed left-4 top-4 z-30 cursor-pointer rounded-lg border border-card-border bg-card-bg p-2 text-text-muted hover:border-foreground hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="6" y2="6"/>
          <line x1="4" x2="20" y1="12" y2="12"/>
          <line x1="4" x2="20" y1="18" y2="18"/>
        </svg>
      </button>

      <div className="mx-auto max-w-2xl px-4 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-green-primary">
            About
          </h1>
        </header>

        <div className="text-center text-text-muted">
          <p>Coming soon.</p>
        </div>
      </div>
    </div>
  );
}
