// src/components/Header.tsx
import { User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Solar Calculator Admin</h1>
        <div className="flex items-center space-x-4">
          <User className="h-6 w-6" />
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}