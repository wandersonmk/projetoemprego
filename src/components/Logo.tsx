import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center rotate-3 transition-transform group-hover:rotate-6">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div className="absolute inset-0 w-10 h-10 bg-primary/20 rounded-xl -rotate-3 -z-10 transition-transform group-hover:-rotate-6" />
      </div>
      <div>
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          TaskMatch
        </span>
      </div>
    </Link>
  );
}