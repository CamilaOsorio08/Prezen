document.getElementById('btnLogout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = '/auth/index.html';
});