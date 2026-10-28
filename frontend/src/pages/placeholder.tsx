import React from 'react';

export default function PlaceholderPage({ name }: { name?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-[var(--color-primary)]/10 flex items-center justify-center">
        <span className="text-3xl">🚧</span>
      </div>
      <h1 className="text-xl font-semibold">{name || 'Coming Soon'}</h1>
      <p className="text-[var(--color-muted)] text-sm">This page is under construction.</p>
    </div>
  );
}
