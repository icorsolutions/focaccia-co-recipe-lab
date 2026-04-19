import { checkPassword, getSupabase, json } from './_helpers.js';

const CHEF_SYSTEM_PROMPT = `You are Chef Matteo, born in Bologna, raised in Genoa where you learned focaccia from your nonna at age 8. You apprenticed in paninoteche in Milan, tramezzini bars in Venice, and focaccerie across Liguria. Twenty-five years working Italian sandwiches. You now consult for Focaccia Co, a sandwich shop.

Your voice:
- Warm but direct. Drop an Italian phrase when it lands naturally (allora, ecco, senti, basta, mamma mia, perfetto) — never forced, never more than one per response.
- Specific. Give quantities, temperatures, techniques, and the WHY behind every tweak or recommendation.
- Opinionated. If something is wrong, say so plainly. You are a chef, not a cheerleader.
- Conversational paragraphs. Avoid bullet-point lists unless you are genuinely comparing options.

What you care about, in order:
1. Bread-to-filling ratio — the focaccia should sing, not drown under ingredients
2. Moisture management — soggy bread is an insult to the baker. Barriers, drainage, dry ingredients where needed.
3. Flavor layering — acid, fat, salt, umami, freshness, heat. Every bite should have at least three.
4. Temperature and texture contrast
5. Authenticity when a regional style is claimed, creativity otherwise
6. Cost and kitchen efficiency — this is a business. Prep complexity matters.

You already know the shop's standard bread, portions, equipment, price point, and constraints — they are listed in the KITCHEN CONTEXT section below. Do not ask the owner to repeat them. Reason concretely from those specs. If you're about to say "depending on your bread size" or "what's your target price", STOP — check the KITCHEN CONTEXT first. Only ask if a relevant field is genuinely blank.

Keep most responses to 3-6 sentences. Go longer only when the topic genuinely demands it.`;

const FIELD_LABELS = {
  bread_size: 'Bread size',
  bread_type: 'Bread type',
  bread_source: 'Bread source',
  protein_portion: 'Standard protein portion',
  cheese_portion: 'Standard cheese portion',
  finishing_equipment: 'Finishing equipment',
  max_prep_time: 'Max prep time per sandwich',
  target_price_range: 'Target price range',
  target_food_cost: 'Target food cost %',
  primary_customer: 'Primary customer',
  dietary_requirements: 'Dietary requirements',
  allergen_rules: 'Allergen rules',
  location_market: 'Location / market',
  notes: 'Other notes',
};

function formatKitchenContext(ctx) {
  if (!ctx) return '';
  const filled = Object.entries(FIELD_LABELS)
    .map(([key, label]) => [label, (ctx[key] || '').trim()])
    .filter(([, value]) => value.length > 0);
  if (filled.length === 0) return '';
  const lines = filled.map(([label, value]) => `- ${label}: ${value}`);
  return `\n\n=== KITCHEN CONTEXT (applies to all recipes & questions) ===\n${lines.join('\n')}\n=== END KITCHEN CONTEXT ===`;
}

async function loadKitchenContext(supabase) {
  try {
    const { data } = await supabase
      .from('kitchen_context').select('*').eq('id', 1).single();
    return data;
  } catch {
    // Table might not exist yet (pre-migration) — fine, just return null
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!checkPassword(req)) return json(res, 401, { error: 'Unauthorized' });

  const { recipeId, consultationId, message, isInitialReview } = req.body || {};

  if (!recipeId && !consultationId) {
    return json(res, 400, { error: 'recipeId or consultationId required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(res, 500, { error: 'Missing ANTHROPIC_API_KEY' });

  const supabase = getSupabase();
  const kitchenContext = await loadKitchenContext(supabase);
  const systemPrompt = CHEF_SYSTEM_PROMPT + formatKitchenContext(kitchenContext);

  try {
    if (recipeId) {
      return await handleRecipeFeedback(supabase, apiKey, systemPrompt, recipeId, message, isInitialReview, res);
    }
    return await handleConsultation(supabase, apiKey, systemPrompt, consultationId, message, res);
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: e.message || 'Server error' });
  }
}

async function handleRecipeFeedback(supabase, apiKey, systemPrompt, recipeId, message, isInitialReview, res) {
  const { data: recipe, error: fetchErr } = await supabase
    .from('recipes').select('*').eq('id', recipeId).single();
  if (fetchErr || !recipe) return json(res, 404, { error: 'Recipe not found' });

  const recipeContext = `RECIPE TYPE: ${recipe.type === 'sandwich' ? 'Sandwich' : 'Sauce'}
NAME: ${recipe.name}

INGREDIENTS:
${recipe.ingredients || '(none listed)'}

METHOD:
${recipe.method || '(none listed)'}

${recipe.notes ? `NOTES: ${recipe.notes}` : ''}`;

  const history = recipe.feedback_history || [];
  const messages = [];

  if (history.length === 0) {
    messages.push({
      role: 'user',
      content: `${recipeContext}\n\n${isInitialReview ? 'Give me your honest first impression of this recipe. What works? What needs to change?' : message}`,
    });
  } else {
    messages.push({ role: 'user', content: `${recipeContext}\n\nMy first question: ${history[0].userFeedback}` });
    messages.push({ role: 'assistant', content: history[0].chefResponse });
    for (let i = 1; i < history.length; i++) {
      messages.push({ role: 'user', content: history[i].userFeedback });
      messages.push({ role: 'assistant', content: history[i].chefResponse });
    }
    messages.push({ role: 'user', content: isInitialReview ? 'Give me a fresh overall review of the recipe as it stands now.' : message });
  }

  const chefText = await callClaude(apiKey, systemPrompt, messages);

  const userLabel = isInitialReview
    ? (history.length === 0 ? '(Asked Matteo for his first impression)' : '(Asked for a fresh overall review)')
    : message;

  const newHistory = [
    ...history,
    { userFeedback: userLabel, chefResponse: chefText, timestamp: new Date().toISOString() },
  ];

  const { data: updated, error: updErr } = await supabase
    .from('recipes').update({ feedback_history: newHistory }).eq('id', recipeId).select().single();
  if (updErr) throw updErr;

  return json(res, 200, updated);
}

async function handleConsultation(supabase, apiKey, systemPrompt, consultationId, message, res) {
  if (!message || !message.trim()) return json(res, 400, { error: 'message required' });

  const { data: thread, error: fetchErr } = await supabase
    .from('consultations').select('*').eq('id', consultationId).single();
  if (fetchErr || !thread) return json(res, 404, { error: 'Consultation not found' });

  const existingMessages = thread.messages || [];

  const apiMessages = existingMessages.map(m => ({ role: m.role, content: m.content }));
  apiMessages.push({ role: 'user', content: message });

  const chefText = await callClaude(apiKey, systemPrompt, apiMessages);

  const now = new Date().toISOString();
  const newMessages = [
    ...existingMessages,
    { role: 'user', content: message, ts: now },
    { role: 'assistant', content: chefText, ts: new Date().toISOString() },
  ];

  const patch = { messages: newMessages };
  if (thread.title === 'New conversation' && existingMessages.length === 0) {
    patch.title = message.length > 50 ? message.slice(0, 50).trim() + '…' : message.trim();
  }

  const { data: updated, error: updErr } = await supabase
    .from('consultations').update(patch).eq('id', consultationId).select().single();
  if (updErr) throw updErr;

  return json(res, 200, updated);
}

async function callClaude(apiKey, systemPrompt, messages) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Anthropic API error ${resp.status}: ${text}`);
  }

  const result = await resp.json();
  const text = (result.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('Empty response from chef');
  return text;
}
