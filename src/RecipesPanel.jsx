import { useState, useEffect, useRef } from 'react';
import {
  ChefHat, Plus, Trash2, Send, Edit2, Save, X, Check,
  Sparkles, Loader2, Eraser, BookOpen
} from 'lucide-react';
import { api } from './lib/api.js';

export default function RecipesPanel({ recipeType }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', ingredients: '', method: '', notes: '' });
  const [feedback, setFeedback] = useState('');
  const [waitingForChef, setWaitingForChef] = useState(false);
  const historyEndRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.listRecipes();
        setRecipes(list);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  // Reset selection when switching between sandwich/sauce
  useEffect(() => {
    setSelectedId(null);
    setIsAdding(false);
    setIsEditing(false);
  }, [recipeType]);

  const filtered = recipes.filter(r => r.type === recipeType);
  const selected = recipes.find(r => r.id === selectedId);

  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selected?.feedback_history?.length, waitingForChef]);

  const startAdd = () => {
    setIsAdding(true);
    setIsEditing(false);
    setFormData({ name: '', ingredients: '', method: '', notes: '' });
    setSelectedId(null);
  };

  const startEdit = () => {
    if (!selected) return;
    setFormData({
      name: selected.name,
      ingredients: selected.ingredients || '',
      method: selected.method || '',
      notes: selected.notes || ''
    });
    setIsEditing(true);
    setIsAdding(false);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setIsEditing(false);
  };

  const saveRecipe = async () => {
    if (!formData.name.trim()) return;
    try {
      if (isAdding) {
        const newRecipe = await api.createRecipe({
          type: recipeType,
          name: formData.name.trim(),
          ingredients: formData.ingredients,
          method: formData.method,
          notes: formData.notes,
        });
        setRecipes([...recipes, newRecipe]);
        setSelectedId(newRecipe.id);
      } else if (isEditing && selected) {
        const updated = await api.updateRecipe(selected.id, {
          name: formData.name.trim(),
          ingredients: formData.ingredients,
          method: formData.method,
          notes: formData.notes,
        });
        setRecipes(recipes.map(r => r.id === updated.id ? updated : r));
      }
      setIsAdding(false);
      setIsEditing(false);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  const deleteRecipe = async () => {
    if (!selected) return;
    if (!confirm(`Delete "${selected.name}"? This also removes all chef feedback for it.`)) return;
    try {
      await api.deleteRecipe(selected.id);
      setRecipes(recipes.filter(r => r.id !== selected.id));
      setSelectedId(null);
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const renameRecipe = async (id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const recipe = recipes.find(r => r.id === id);
    if (!recipe || recipe.name === trimmed) return;
    try {
      const updated = await api.updateRecipe(id, { name: trimmed });
      setRecipes(recipes.map(r => r.id === updated.id ? updated : r));
    } catch (e) {
      alert('Rename failed: ' + e.message);
    }
  };

  const askChef = async (userMessage, isInitialReview = false) => {
    if (!selected) return;
    if (!isInitialReview && !userMessage.trim()) return;
    setWaitingForChef(true);
    try {
      const updated = await api.askChef(selected.id, userMessage, isInitialReview);
      setRecipes(recipes.map(r => r.id === updated.id ? updated : r));
      setFeedback('');
    } catch (e) {
      alert('Chef stepped out for an espresso. ' + e.message);
    }
    setWaitingForChef(false);
  };

  const clearHistory = async () => {
    if (!selected) return;
    if (!confirm('Clear all chef feedback for this recipe? The recipe itself stays.')) return;
    try {
      const updated = await api.updateRecipe(selected.id, { feedback_history: [] });
      setRecipes(recipes.map(r => r.id === updated.id ? updated : r));
    } catch (e) {
      alert('Clear failed: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
      </div>
    );
  }

  const showingForm = isAdding || isEditing;
  const typeLabel = recipeType === 'sandwich' ? 'Sandwich' : 'Sauce';

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <aside className="bg-white rounded-lg border border-stone-200 p-3 h-fit lg:sticky lg:top-28">
        <button
          onClick={startAdd}
          className="w-full flex items-center justify-center gap-2 bg-red-800 hover:bg-red-900 text-white text-sm font-medium py-2 rounded-md transition-colors mb-3"
        >
          <Plus className="w-4 h-4" />
          New {typeLabel}
        </button>
        {filtered.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-6 px-2">
            No {recipeType}s yet. Add your first one to get Matteo's feedback.
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map(r => (
              <SidebarItem
                key={r.id}
                recipe={r}
                isSelected={selectedId === r.id}
                onSelect={() => { setSelectedId(r.id); setIsAdding(false); setIsEditing(false); }}
                onRename={(newName) => renameRecipe(r.id, newName)}
              />
            ))}
          </ul>
        )}
      </aside>

      <main className="min-w-0">
        {showingForm ? (
          <RecipeForm
            typeLabel={typeLabel}
            isAdding={isAdding}
            selected={selected}
            formData={formData}
            setFormData={setFormData}
            onSave={saveRecipe}
            onCancel={cancelForm}
          />
        ) : selected ? (
          <RecipeDetail
            selected={selected}
            typeLabel={typeLabel}
            feedback={feedback}
            setFeedback={setFeedback}
            waitingForChef={waitingForChef}
            onEdit={startEdit}
            onDelete={deleteRecipe}
            onAskChef={askChef}
            onClearHistory={clearHistory}
            historyEndRef={historyEndRef}
          />
        ) : (
          <EmptyState hasRecipes={filtered.length > 0} typeLabel={typeLabel.toLowerCase()} />
        )}
      </main>
    </div>
  );
}

function SidebarItem({ recipe, isSelected, onSelect, onRename }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draft, setDraft] = useState(recipe.name);
  const inputRef = useRef(null);
  const historyLen = (recipe.feedback_history || []).length;

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const startRename = (e) => {
    e.stopPropagation();
    setDraft(recipe.name);
    setIsRenaming(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== recipe.name) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  const cancel = () => {
    setDraft(recipe.name);
    setIsRenaming(false);
  };

  if (isRenaming) {
    return (
      <li>
        <div className={`flex items-center gap-1 px-2 py-1.5 rounded-md ${isSelected ? 'bg-red-50' : 'bg-stone-50'}`}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              else if (e.key === 'Escape') cancel();
            }}
            onBlur={commit}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-sm bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-red-700"
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); commit(); }}
            title="Save"
            className="p-1 text-green-700 hover:bg-green-50 rounded"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); cancel(); }}
            title="Cancel"
            className="p-1 text-stone-500 hover:bg-stone-100 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group relative">
      <button
        onClick={onSelect}
        className={`w-full text-left px-3 py-2 pr-8 rounded-md text-sm transition-colors ${
          isSelected
            ? 'bg-red-50 text-red-900 font-medium'
            : 'hover:bg-stone-50 text-stone-700'
        }`}
      >
        <div className="truncate">{recipe.name}</div>
        {historyLen > 0 && (
          <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {historyLen} chef note{historyLen > 1 ? 's' : ''}
          </div>
        )}
      </button>
      <button
        onClick={startRename}
        title="Rename"
        className="absolute right-1 top-1.5 p-1 text-stone-400 opacity-0 group-hover:opacity-100 hover:text-stone-900 transition-opacity"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function RecipeForm({ typeLabel, isAdding, selected, formData, setFormData, onSave, onCancel }) {
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{isAdding ? `New ${typeLabel}` : `Edit: ${selected?.name}`}</h2>
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-700">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-4">
        <Field label="Name">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={typeLabel === 'Sandwich' ? 'e.g. The Tuscan Thunder' : 'e.g. Calabrian Chili Aioli'}
            className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
          />
        </Field>
        <Field label="Ingredients">
          <textarea
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            rows={8}
            placeholder={`List ingredients with quantities, one per line.\n\nExample:\n- 2 slices rosemary focaccia (4oz each)\n- 3oz prosciutto di Parma\n- 1oz fresh mozzarella\n- 4 leaves basil\n- 1 tbsp olive oil`}
            className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent font-mono"
          />
        </Field>
        <Field label="Method">
          <textarea
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            rows={6}
            placeholder="Step-by-step build or prep instructions..."
            className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
          />
        </Field>
        <Field label="Notes (optional)">
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            placeholder="Cost, customer feedback, intended audience, pairings..."
            className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
          />
        </Field>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onSave}
            disabled={!formData.name.trim()}
            className="flex items-center gap-2 bg-green-800 hover:bg-green-900 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button onClick={onCancel} className="text-sm text-stone-600 hover:text-stone-900 px-4 py-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

function RecipeDetail({ selected, typeLabel, feedback, setFeedback, waitingForChef, onEdit, onDelete, onAskChef, onClearHistory, historyEndRef }) {
  const history = selected.feedback_history || [];
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-stone-200 p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">{typeLabel}</div>
            <h2 className="text-2xl font-bold">{selected.name}</h2>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} title="Edit" className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} title="Delete" className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-stone-700 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Ingredients
            </h3>
            <pre className="whitespace-pre-wrap font-sans text-stone-800 leading-relaxed">
              {selected.ingredients || <span className="text-stone-400 italic">Not specified</span>}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold text-stone-700 mb-2">Method</h3>
            <pre className="whitespace-pre-wrap font-sans text-stone-800 leading-relaxed">
              {selected.method || <span className="text-stone-400 italic">Not specified</span>}
            </pre>
          </div>
        </div>
        {selected.notes && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <h3 className="font-semibold text-stone-700 mb-1 text-sm">Notes</h3>
            <p className="text-sm text-stone-700">{selected.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Chef Matteo</div>
              <div className="text-xs text-stone-300">Bologna · 25 years of panini</div>
            </div>
          </div>
          {history.length > 0 && (
            <button onClick={onClearHistory} title="Clear conversation" className="text-stone-300 hover:text-white text-xs flex items-center gap-1">
              <Eraser className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="p-5">
          {history.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-stone-600 mb-4">
                No feedback yet. Ask Matteo for his first impression, or describe what you want tweaked.
              </p>
              <button
                onClick={() => onAskChef('', true)}
                disabled={waitingForChef}
                className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 disabled:bg-stone-300 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                {waitingForChef ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Ask for first impression
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {history.map((ex, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-stone-100 rounded-lg px-3 py-2 text-sm max-w-[85%] text-stone-800">{ex.userFeedback}</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-700 flex-shrink-0 flex items-center justify-center">
                      <ChefHat className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-stone-800 whitespace-pre-wrap leading-relaxed max-w-[85%]">
                      {ex.chefResponse}
                    </div>
                  </div>
                </div>
              ))}
              {waitingForChef && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-700 flex-shrink-0 flex items-center justify-center">
                    <ChefHat className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-stone-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Matteo is tasting...
                  </div>
                </div>
              )}
              <div ref={historyEndRef}></div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-stone-100">
            <div className="flex gap-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onAskChef(feedback);
                }}
                placeholder="Tell Matteo what you're thinking... (Cmd/Ctrl+Enter to send)"
                rows={2}
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent resize-none"
              />
              <button
                onClick={() => onAskChef(feedback)}
                disabled={!feedback.trim() || waitingForChef}
                className="bg-red-800 hover:bg-red-900 disabled:bg-stone-300 disabled:cursor-not-allowed text-white px-4 rounded-md transition-colors flex items-center"
                title="Send (Cmd/Ctrl+Enter)"
              >
                {waitingForChef ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasRecipes, typeLabel }) {
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
      <ChefHat className="w-12 h-12 mx-auto text-stone-300 mb-3" />
      <h3 className="text-lg font-semibold text-stone-700 mb-1">
        {!hasRecipes ? 'Welcome to the Recipe Lab' : 'Pick a recipe'}
      </h3>
      <p className="text-sm text-stone-500 max-w-md mx-auto">
        {!hasRecipes
          ? `Add your first ${typeLabel} recipe to get started. Matteo will give you honest, specific feedback — the kind only 25 years behind a paninoteca counter can.`
          : 'Select one from the left to review it with Chef Matteo, or create a new one.'}
      </p>
    </div>
  );
}
