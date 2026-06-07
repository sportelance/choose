// Helper functions for localStorage
function getSeenUsernames() {
  const seen = localStorage.getItem('seenUsernames');
  return seen ? JSON.parse(seen) : [];
}

function addSeenUsername(name) {
  const seen = getSeenUsernames();
  if (!seen.includes(name)) {
    seen.push(name);
    localStorage.setItem('seenUsernames', JSON.stringify(seen));
  }
}

// Modal handling
const modal = document.getElementById('confirmation-modal');
const duplicateNameSpan = document.getElementById('duplicate-name');
const confirmYesBtn = document.getElementById('confirm-yes');
const confirmNoBtn = document.getElementById('confirm-no');
let pendingName = null;

function showModal(name) {
  duplicateNameSpan.textContent = name;
  modal.style.display = 'flex';
}

function hideModal() {
  modal.style.display = 'none';
}

confirmYesBtn.addEventListener('click', () => {
  if (pendingName) {
    sessionStorage.setItem('voterName', pendingName);
    window.location.href = 'vote.html';
  }
});

confirmNoBtn.addEventListener('click', () => {
  hideModal();
  const nameInput = document.getElementById('name');
  nameInput.value = '';
  nameInput.focus();
  pendingName = null;
});

// Form submission
document.getElementById('entry-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const nameInput = document.getElementById('name');
  const name = nameInput.value.trim();
  
  if (!name) {
    alert('Please enter your name');
    return;
  }
  
  const seenUsernames = getSeenUsernames();
  
  if (seenUsernames.includes(name)) {
    // Name has been seen before, show confirmation
    pendingName = name;
    showModal(name);
  } else {
    // New name, proceed normally
    addSeenUsername(name);
    sessionStorage.setItem('voterName', name);
    window.location.href = 'vote.html';
  }
});
