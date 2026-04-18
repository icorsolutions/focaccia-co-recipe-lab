import { checkPassword, getSupabase, json } from './_helpers.js';

export default async function handler(req, res) {
  if (!checkPassword(req)) return json(res, 401, { error: 'Unauthorized' });

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return json(res, 200, data);
    }

    if (req.method === 'POST') {
      const { title } = req.body || {};
      const { data, error } = await supabase
        .from('consultations')
        .insert({ title: title || 'New conversation', messages: [] })
        .select()
        .single();
      if (error) throw error;
      return json(res, 200, data);
    }

    if (req.method === 'PATCH') {
      const { id, title } = req.body || {};
      if (!id) return json(res, 400, { error: 'id required' });
      const patch = {};
      if (typeof title === 'string') patch.title = title;
      const { data, error } = await supabase
        .from('consultations').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return json(res, 200, data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return json(res, 400, { error: 'id required' });
      const { error } = await supabase.from('consultations').delete().eq('id', id);
      if (error) throw error;
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: e.message || 'Server error' });
  }
}
