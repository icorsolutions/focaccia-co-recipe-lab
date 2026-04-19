import { useState, useEffect } from 'react';
import { X, Save, Loader2, Settings } from 'lucide-react';
import { api } from './lib/api.js';

const SECTIONS = [
  {
    title: 'Bread',
    fields: [
      { key: 'bread_size', label: 'Standard size', placeholder: 'e.g. 6×4 inch slab, 4oz' },
      { key: 'bread_type', label: 'Type', placeholder: 'e.g. classic rosemary focaccia, 70% hydration' },
      { key: 'bread_source', label: 'Source', placeholder: 'e.g. baked in-house daily, or local bakery' },
    ],
  },
  {
    title: 'Portions',
    fields: [
      { key: 'protein_portion', label: 'Standard protein portion', placeholder: 'e.g. 3oz deli meat, 4oz roasted' },
      { key: 'cheese_portion', label: 'Standard cheese portion', placeholder: 'e.g. 1oz sliced, 1.5oz fresh' },
    ],
  },
  {
    title: 'Equipment',
    fields: [
      { key: 'finishing_equipment', label: 'Finishing equipment', placeholder: 'e.g. panini press (medium heat), no toaster oven' },
      { key: 'max_prep_time', label: 'Max prep time per sandwich', placeholder: 'e.g. 4 minutes from order to handoff' },
    ],
  },
  {
    title: 'Business',
    fields: [
      { key: 'target_price_range', label: 'Target price range', placeholder: 'e.g. $11–14 CAD' },
      { key: 'target_food_cost', label: 'Target food cost %', placeholder: 'e.g. 28%' },
      { key: 'primary_customer', label: 'Primary customer', placeholder: 'e.g. lunch crowd, office workers downtown Hamilton' },
    ],
  },
  {
    title: 'Constraints',
    fields: [
      { key: 'dietary_requirements', label: 'Dietary requirements', placeholder: 'e.g. need at least one vegan option, GF bread available on request' },
      { key: 'allergen_rules', label: 'Allergen rules', placeholder: 'e.g. no peanut products on premises, nuts handled separately' },
      { key: 'location_market', label: 'Location / market', placeholder: 'e.g. Hamilton, Ontario; Italian-Canadian customer base' },
    ],
  },
];

const EMPTY = {
  bread_size: '', bread_type: '', bread_source: '',
  protein_portion: '', cheese_portion: '',
  finishing_equipment: '', max_prep_time: '',
  target_price_range: '', target_food_cost: '', primary_customer: '',
  dietary_requirements: '', allergen_rules: '', location_market: '',
  notes: '',
};

export default function KitchenSetupModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const data = await api.getKitchenContext();
        setForm({ ...EMPTY, ...data });
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [open]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const { id, updated_at, ...patch } = form;
      await api.updateKitchenContext(patch);
      onClose();
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-stretch sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white sm:rounded-lg max-w-2xl w-full sm:max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold truncate">Kitchen Setup</h2>
              <p className="text-xs text-stone-500 truncate">Matteo uses this for every recipe and question</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-stone-700 active:text-stone-900 p-2 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
            {SECTIONS.map(section => (
              <div key={section.title} className="mb-5">
                <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2 pb-1 border-b border-stone-100">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-stone-500 mb-1">{field.label}</label>
                      <input
                        type="text"
                        value={form[field.key] || ''}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2 pb-1 border-b border-stone-100">
                Other notes
              </h3>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setField('notes', e.target.value)}
                rows={5}
                placeholder="Anything else Matteo should always know — supplier quirks, seasonality, brand voice, regional preferences, past mistakes to avoid, anything..."
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-4 sm:px-5 py-3 border-t border-stone-200 bg-stone-50 sm:rounded-b-lg">
          <button
            onClick={onClose}
            className="text-sm text-stone-600 hover:text-stone-900 active:text-stone-950 px-4 py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-green-800 hover:bg-green-900 active:bg-green-950 disabled:bg-stone-300 text-white text-sm font-medium px-4 py-2.5 rounded-md transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
