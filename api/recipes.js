import { checkPassword, getSupabase, json } from './_helpers.js';

export default async function handler(req, res) {
  if (!checkPassword(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return json(res, 200, data);
    }

    if (req.method === 'POST') {
      const { type, name, ingredients = '', method = '', notes = '' } = req.body || {};
      if (!type || !name) return json(res, 400, { error: 'type and name required' });
      if (!['sandwich', 'sauce'].includes(type)) return json(res, 400, { error: 'invalid type' });

      const { data, error } = await supabase
        .from('recipes')
        .insert({ type, name, ingredients, method, notes, feedback_history: [] })
        .select()
        .single();
      if (error) throw error;
      return json(res, 200, data);
    }

    if (req.method === 'PATCH') {
      const { id, ...patch } = req.body || {};
      if (!id) return json(res, 400, { error: 'id required' });

      // Whitelist updatable columns
      const allowed = {};
      for (const k of ['name', 'ingredients', 'method', 'notes', 'feedback_history']) {
        if (k in patch) allowed[k] = patch[k];
      }

      const { data, error } = await supabase
        .from('recipes')
        .update(allowed)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return json(res, 200, data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return json(res, 400, { error: 'id required' });
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: e.message || 'Server error' });
  }
}
