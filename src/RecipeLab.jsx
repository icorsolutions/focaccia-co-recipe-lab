import { useState } from 'react';
import { ChefHat, Sandwich, Droplet, MessageCircle, LogOut } from 'lucide-react';
import RecipesPanel from './RecipesPanel.jsx';
import ConsultationsPanel from './ConsultationsPanel.jsx';

export default function RecipeLab({ onLogout }) {
  const [activeTab, setActiveTab] = useState('sandwich');

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-sm">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Focaccia Co</h1>
              <p className="text-xs text-stone-500 -mt-0.5">Recipe Lab · Chef Matteo consulting</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-1">
              <div className="w-2 h-6 bg-green-700 rounded-sm"></div>
              <div className="w-2 h-6 bg-white border border-stone-200 rounded-sm"></div>
              <div className="w-2 h-6 bg-red-700 rounded-sm"></div>
            </div>
            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          <TabButton active={activeTab === 'sandwich'} onClick={() => setActiveTab('sandwich')} icon={Sandwich}>Sandwiches</TabButton>
          <TabButton active={activeTab === 'sauce'} onClick={() => setActiveTab('sauce')} icon={Droplet}>Sauces</TabButton>
          <TabButton active={activeTab === 'consult'} onClick={() => setActiveTab('consult')} icon={MessageCircle}>Ask Matteo</TabButton>
        </div>
      </header>

      {activeTab === 'consult'
        ? <ConsultationsPanel />
        : <RecipesPanel recipeType={activeTab} />
      }
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-red-700 text-red-800'
          : 'border-transparent text-stone-500 hover:text-stone-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}
