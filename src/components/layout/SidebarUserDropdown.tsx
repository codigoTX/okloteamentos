import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AccountSettingsModal from './AccountSettingsModal';

const SidebarUserDropdown: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!profile) return null;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center focus:outline-none"
      >
        <img
          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.email)}`}
          alt={profile.name || profile.email}
          className="h-10 w-10 rounded-full object-cover border border-gray-300 dark:border-gray-700"
        />
      </button>
      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => { setShowSettings(true); setOpen(false); }}
            >
              Configurações
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={signOut}
            >
              Sair
            </button>
          </div>
        </div>
      )}
      {showSettings && (
        <AccountSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} user={profile} />
      )}
    </div>
  );
};

export default SidebarUserDropdown;
