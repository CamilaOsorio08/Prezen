document.querySelectorAll('#btnLogout, [data-logout]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    window.PrezenAPI?.logout();
  });
});