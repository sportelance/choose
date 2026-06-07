document.getElementById('entry-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const nameInput = document.getElementById('name');
  const name = nameInput.value.trim();
  
  if (!name) {
    alert('Please enter your name');
    return;
  }
  
  // Save to sessionStorage
  sessionStorage.setItem('voterName', name);
  
  // Redirect to vote page
  window.location.href = 'vote.html';
});
