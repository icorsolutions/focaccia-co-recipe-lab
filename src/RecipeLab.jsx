import { useState } from 'react';
import { ChefHat, Sandwich, Droplet, MessageCircle, LogOut, Settings } from 'lucide-react';
import RecipesPanel from './RecipesPanel.jsx';
import ConsultationsPanel from './ConsultationsPanel.jsx';
import KitchenSetupModal from './KitchenSetupModal.jsx';

export default function RecipeLab({ onLogout }) {
  const [activeTab, setActiveTab] = useState('sandwich');
  const [kitchenOpen, setKitchenOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-sm flex-shrink-0">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">Focaccia Co</h1>
              <p className="text-xs text-stone-500 -mt-0.5 truncate hidden sm:block">Recipe Lab · Chef Matteo consulting</p>
              <p className="text-xs text-stone-500 -mt-0.5 truncate sm:hidden">Recipe Lab</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <div className="hidden sm:flex gap-1 mr-2">
              <div className="w-2 h-6 bg-green-700 rounded-sm"></div>
              <div className="w-2 h-6 bg-white border border-stone-200 rounded-sm"></div>
              <div className="w-2 h-6 bg-red-700 rounded-sm"></div>
            </div>
            <button
              onClick={() => setKitchenOpen(true)}
              title="Kitchen Setup"
              aria-label="Kitchen Setup"
              className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 active:bg-stone-200 rounded-md transition-colors"
            >
              <Settings className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 active:bg-stone-200 rounded-md transition-colors"
            >
              <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex gap-1 overflow-x-auto">
          <TabButton active={activeTab === 'sandwich'} onClick={() => setActiveTab('sandwich')} icon={Sandwich}>Sandwiches</TabButton>
          <TabButton active={activeTab === 'sauce'} onClick={() => setActiveTab('sauce')} icon={Droplet}>Sauces</TabButton>
          <TabButton active={activeTab === 'consult'} onClick={() => setActiveTab('consult')} icon={MessageCircle}>Ask Matteo</TabButton>
        </div>
      </header>

      {activeTab === 'consult'
        ? <ConsultationsPanel />
        : <RecipesPanel recipeType={activeTab} />
      }

      <KitchenSetupModal open={kitchenOpen} onClose={() => setKitchenOpen(false)} />
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-red-700 text-red-800'
          : 'border-transparent text-stone-500 hover:text-stone-800 active:text-stone-900'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}
