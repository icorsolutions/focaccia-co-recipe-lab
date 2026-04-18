// Thin wrapper around the Vercel Functions. The password is read from
// sessionStorage and sent as a header on every request.

const PW_KEY = 'focaccia-co-pw';

export const auth = {
  get: () => sessionStorage.getItem(PW_KEY) || '',
  set: (pw) => sessionStorage.setItem(PW_KEY, pw),
  clear: () => sessionStorage.removeItem(PW_KEY),
};

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': auth.get(),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    auth.clear();
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (password) =>
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then(async (r) => {
      if (r.ok) {
        auth.set(password);
        return true;
      }
      return false;
    }),

  // Recipes
  listRecipes: () => request('/api/recipes'),
  createRecipe: (recipe) =>
    request('/api/recipes', { method: 'POST', body: JSON.stringify(recipe) }),
  updateRecipe: (id, patch) =>
    request('/api/recipes', { method: 'PATCH', body: JSON.stringify({ id, ...patch }) }),
  deleteRecipe: (id) =>
    request('/api/recipes', { method: 'DELETE', body: JSON.stringify({ id }) }),
  askChef: (recipeId, message, isInitialReview = false) =>
    request('/api/chef', {
      method: 'POST',
      body: JSON.stringify({ recipeId, message, isInitialReview }),
    }),

  // Consultations
  listConsultations: () => request('/api/consultations'),
  createConsultation: (title) =>
    request('/api/consultations', { method: 'POST', body: JSON.stringify({ title }) }),
  renameConsultation: (id, title) =>
    request('/api/consultations', { method: 'PATCH', body: JSON.stringify({ id, title }) }),
  deleteConsultation: (id) =>
    request('/api/consultations', { method: 'DELETE', body: JSON.stringify({ id }) }),
  chatConsultation: (consultationId, message) =>
    request('/api/chef', {
      method: 'POST',
      body: JSON.stringify({ consultationId, message }),
    }),
};
