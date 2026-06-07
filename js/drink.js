import { DRINKS } from './config.js';
import { submitVote, getVotes } from './api.js';
import { renderStars, showToast } from './ui.js';

let voterName = sessionStorage.getItem('voterName');
if (!voterName) {
  window.location.href = 'index.html';
}

const urlParams = new URLSearchParams(window.location.search);
const drinkId = urlParams.get('id');

const drink = DRINKS.find((d) => d.id === drinkId);
if (!drink) {
  window.location.href = 'vote.html';
}

// Populate drink details
document.getElementById('drink-photo').src = drink.photo;
document.getElementById('drink-photo').alt = drink.name;
document.getElementById('drink-name').textContent = drink.name;
document.getElementById('drink-description').textContent = drink.description;
document.getElementById('drink-ingredients').textContent = drink.ingredients.join(' · ');

// Rating and comment
const ratingContainer = document.getElementById('rating-container');
const commentInput = document.getElementById('comment');
const submitBtn = document.getElementById('submit-vote');
const backLink = document.getElementById('back-link');

let currentRating = 0;

// Render stars
function updateStars(rating) {
  ratingContainer.innerHTML = '';
  const stars = renderStars(rating, true, (newRating) => {
    currentRating = newRating;
    updateStars(newRating);
  });
  ratingContainer.appendChild(stars);
}

updateStars(0);

// Load existing vote if any
async function loadExistingVote() {
  try {
    const data = await getVotes(drinkId);
    const existingVote = data.votes.find((v) => v.voterName === voterName);
    
    if (existingVote) {
      currentRating = existingVote.rating;
      commentInput.value = existingVote.comment || '';
      updateStars(currentRating);
    }
  } catch (error) {
    console.error('Error loading existing vote:', error);
  }
}

loadExistingVote();

// Submit vote
submitBtn.addEventListener('click', async () => {
  if (currentRating < 1 || currentRating > 5) {
    showToast('Please select a rating (1-5 stars)', 'error');
    return;
  }
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    await submitVote(drinkId, voterName, currentRating, commentInput.value);
    showToast('Vote submitted!');
    submitBtn.textContent = 'Update Vote';
  } catch (error) {
    console.error(error);
    showToast('Failed to submit vote', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

// Back link
backLink.href = 'vote.html';
