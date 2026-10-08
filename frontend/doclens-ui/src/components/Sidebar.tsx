import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  FileText,
  Search,
  Layers,
  Brain,
  Upload,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/chat', icon: <MessageSquare size={20} />, label: 'Chat' },
  { to: '/documents', icon: <FileText size={20} />, label: 'Documents' },
  { to: '/search', icon: <Search size={20} />, label: 'Search' },
  { to: '/chunks', icon: <Layers size={20} />, label: 'Chunks' },
  { to: '/upload', icon: <Upload size={20} />, label: 'Upload' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 border-r border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">DocLens</h1>
          <p className="text-xs text-gray-500">AI Document Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">v1.0.0 · Spring AI RAG</p>
      </div>
    </aside>
  );
};

export default Sidebar;
