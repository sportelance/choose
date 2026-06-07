import { DRINKS, CATEGORIES } from './config.js';
import { submitVote, submitBatch } from './api.js';
import state from './state.js';
import { renderCard, showToast } from './ui.js';

let voterName = sessionStorage.getItem('voterName');
if (!voterName) {
  window.location.href = 'index.html';
}

const container = document.querySelector('.page-content');
const submitAllBtn = document.getElementById('submit-all');

// Render all categories and drinks
CATEGORIES.forEach((category) => {
  const categoryDrinks = DRINKS.filter((d) => d.category === category.id);
  if (categoryDrinks.length === 0) return;
  
  const section = document.createElement('section');
  section.className = 'section';
  
  const title = document.createElement('h2');
  title.className = 'section__title';
  title.textContent = category.label;
  section.appendChild(title);
  
  const grid = document.createElement('div');
  grid.className = 'grid grid--3';
  
  categoryDrinks.forEach((drink) => {
    const currentVote = state.getVote(drink.id);
    const card = renderCard(drink, currentVote, true, handleIndividualVote);
    grid.appendChild(card);
  });
  
  section.appendChild(grid);
  container.appendChild(section);
});

// Handle individual drink vote submission
async function handleIndividualVote(drinkId, rating, comment) {
  if (rating < 1 || rating > 5) {
    showToast('Please select a rating (1-5 stars)', 'error');
    return;
  }
  
  try {
    await submitVote(drinkId, voterName, rating, comment);
    state.setVote(drinkId, rating, comment);
    showToast('Vote submitted!');
    updateSubmitButton();
  } catch (error) {
    console.error(error);
    showToast('Failed to submit vote', 'error');
  }
}

// Handle batch vote submission
submitAllBtn.addEventListener('click', async () => {
  const votes = state.getAllVotes();
  const voteArray = Object.entries(votes).map(([drinkId, data]) => ({
    drinkId,
    rating: data.rating,
    comment: data.comment,
  }));
  
  if (voteArray.length === 0) {
    showToast('Please rate at least one drink', 'error');
    return;
  }
  
  const invalidVotes = voteArray.filter((v) => v.rating < 1 || v.rating > 5);
  if (invalidVotes.length > 0) {
    showToast('All ratings must be between 1 and 5', 'error');
    return;
  }
  
  try {
    submitAllBtn.disabled = true;
    submitAllBtn.textContent = 'Submitting...';
    
    const result = await submitBatch(voterName, voteArray);
    showToast(`Saved ${result.saved} votes!`);
    submitAllBtn.textContent = 'Update Votes';
  } catch (error) {
    console.error(error);
    showToast('Failed to submit votes', 'error');
  } finally {
    submitAllBtn.disabled = false;
  }
});

function updateSubmitButton() {
  const votes = state.getAllVotes();
  const hasVotes = Object.values(votes).some((v) => v.rating > 0);
  submitAllBtn.textContent = hasVotes ? 'Update Votes' : 'Submit All Votes';
}
