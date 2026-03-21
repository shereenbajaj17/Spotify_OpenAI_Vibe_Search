'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent, useEffect } from 'react';

export default function TopBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="h-16 w-full flex items-center justify-between px-6 sticky top-0 z-50 bg-[#121212]">
       <form onSubmit={handleSearch} className="relative w-full max-w-[450px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find music for your mood" 
            className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white rounded-full py-3.5 pl-12 pr-6 focus:outline-none transition-colors border border-transparent focus:border-neutral-600 font-medium text-sm shadow-sm"
          />
       </form>
    </div>
  );
}
