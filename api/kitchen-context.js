import { checkPassword, getSupabase, json } from './_helpers.js';

const UPDATABLE_FIELDS = [
  'bread_size', 'bread_type', 'bread_source',
  'protein_portion', 'cheese_portion',
  'finishing_equipment', 'max_prep_time',
  'target_price_range', 'target_food_cost', 'primary_customer',
  'dietary_requirements', 'allergen_rules', 'location_market',
  'notes',
];

export default async function handler(req, res) {
  if (!checkPassword(req)) return json(res, 401, { error: 'Unauthorized' });

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('kitchen_context').select('*').eq('id', 1).single();
      if (error) throw error;
      return json(res, 200, data);
    }

    if (req.method === 'PUT') {
      const patch = {};
      for (const field of UPDATABLE_FIELDS) {
        if (field in (req.body || {})) {
          patch[field] = req.body[field] || '';
        }
      }

      const { data, error } = await supabase
        .from('kitchen_context').update(patch).eq('id', 1).select().single();
      if (error) throw error;
      return json(res, 200, data);
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: e.message || 'Server error' });
  }
}
