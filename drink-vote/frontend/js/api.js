import { API_BASE } from './config.js';

async function submitVote(drinkId, voterName, rating, comment) {
  const response = await fetch(`${API_BASE}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drinkId, voterName, rating, comment }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit vote');
  }
  
  return response.json();
}

async function submitBatch(voterName, votes) {
  const response = await fetch(`${API_BASE}/votes/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterName, votes }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit batch votes');
  }
  
  return response.json();
}

async function getVotes(drinkId) {
  const response = await fetch(`${API_BASE}/votes/${drinkId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch votes');
  }
  
  return response.json();
}

async function getResults() {
  const response = await fetch(`${API_BASE}/results`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch results');
  }
  
  return response.json();
}

export { submitVote, submitBatch, getVotes, getResults };
