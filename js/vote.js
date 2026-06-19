import { DRINKS, CATEGORIES } from './config.js';
import { submitVote, submitBatch, getVotes } from './api.js';
import state from './state.js';
import { renderCard, renderStars, showToast } from './ui.js';

let voterName = sessionStorage.getItem('voterName');
if (!voterName) {
  window.location.href = 'index.html';
}

const container = document.querySelector('.page-content');
const submitAllBtn = document.getElementById('submit-all');
const modal = document.getElementById('drink-modal');
const modalCloseBtn = document.getElementById('modal-close');
const modalBody = document.getElementById('modal-body');

let currentDrink = null;
let currentRating = 0;
let currentComment = '';

// Modal functions
function openModal(drink) {
  currentDrink = drink;
  const currentVote = state.getVote(drink.id);
  currentRating = currentVote.rating || 0;
  currentComment = currentVote.comment || '';
  
  modalBody.innerHTML = `
    <img src="${drink.photo}" alt="${drink.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem; onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%2316213e%22 width=%22300%22 height=%22200%22/%3E%3Ctext fill=%22%23eaeaea%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Photo%3C/text%3E%3C/svg%3E';">
    <h2 style="font-family: 'Playfair Display', serif; margin: 0 0 0.5rem 0; color: #eaeaea;">${drink.name}</h2>
    <p style="color: #a0a0a0; margin: 0 0 1rem 0;">${drink.description}</p>
    <p style="color: #a0a0a0; margin: 0 0 1.5rem 0; font-size: 0.9rem;"><strong>Ingredients:</strong> ${drink.ingredients.join(' · ')}</p>
    <div id="modal-rating" style="margin-bottom: 1rem;"></div>
    <textarea id="modal-comment" class="textarea" placeholder="Add a comment (optional)..." style="margin-bottom: 1rem; min-height: 80px;">${currentComment}</textarea>
    <button id="modal-submit" class="btn btn--primary" style="width: 100%;">Submit Vote</button>
  `;
  
  // Render stars in modal
  const ratingContainer = document.getElementById('modal-rating');

  function onRatingSelect(newRating) {
    currentRating = newRating;
    ratingContainer.innerHTML = '';
    ratingContainer.appendChild(renderStars(newRating, true, onRatingSelect));
  }

  ratingContainer.appendChild(renderStars(currentRating, true, onRatingSelect));
  
  // Set up submit button
  const submitBtn = document.getElementById('modal-submit');
  submitBtn.addEventListener('click', handleModalSubmit);
  
  // Set up comment input
  const commentInput = document.getElementById('modal-comment');
  commentInput.addEventListener('input', (e) => {
    currentComment = e.target.value;
  });
  
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
  currentDrink = null;
  currentRating = 0;
  currentComment = '';
}

async function handleModalSubmit() {
  if (!currentDrink) return;
  
  if (currentRating < 1 || currentRating > 5) {
    showToast('Please select a rating (1-5 stars)', 'error');
    return;
  }
  
  try {
    await submitVote(currentDrink.id, voterName, currentRating, currentComment);
    state.setVote(currentDrink.id, currentRating, currentComment);
    showToast('Vote submitted!');
    closeModal();
    updateSubmitButton();
    renderAllCards();
  } catch (error) {
    console.error(error);
    showToast('Failed to submit vote', 'error');
  }
}

// Modal event listeners
modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Render all categories and drinks
function renderAllCards() {
  const existingSections = container.querySelectorAll('section');
  existingSections.forEach(section => section.remove());
  
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
      const card = renderCard(drink, currentVote, true, handleStarClick, handleCardClick);
      grid.appendChild(card);
    });
    
    section.appendChild(grid);
    container.appendChild(section);
  });
}

function handleStarClick(drinkId, rating, comment) {
  state.setVote(drinkId, rating, comment);
  updateSubmitButton();
}

function handleCardClick(drinkId) {
  const drink = DRINKS.find((d) => d.id === drinkId);
  if (drink) openModal(drink);
}

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

// Fetch this voter's existing votes from DynamoDB and hydrate state,
// then render cards so stars reflect saved ratings on reload
async function loadExistingVotes() {
  await Promise.all(
    DRINKS.map(async (drink) => {
      try {
        const { votes } = await getVotes(drink.id);
        const mine = votes.find(v => v.voterName === voterName);
        if (mine) state.setVote(drink.id, mine.rating, mine.comment);
      } catch (e) {
        console.warn('Could not load vote for', drink.id, e);
      }
    })
  );
}

// Init — load saved votes first, then render so cards show correct stars
async function init() {
  await loadExistingVotes();
  renderAllCards();
  updateSubmitButton();
}

init();