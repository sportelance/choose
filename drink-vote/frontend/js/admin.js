import { DRINKS, CATEGORIES } from './config.js';
import { getResults } from './api.js';
import { renderAdminCard } from './ui.js';

const container = document.querySelector('.page-content');
const refreshIndicator = document.getElementById('refresh-indicator');
const lastUpdated = document.getElementById('last-updated');

let refreshInterval;

async function loadResults() {
  try {
    refreshIndicator.classList.add('refresh-indicator--active');
    
    const data = await getResults();
    const resultsMap = {};
    data.results.forEach((r) => {
      resultsMap[r.drinkId] = r;
    });
    
    container.innerHTML = '<div class="container"></div>';
    const innerContainer = container.querySelector('.container');
    
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
        const result = resultsMap[drink.id] || { average: 0, voteCount: 0, comments: [], breakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } };
        const card = renderAdminCard(drink, result);
        grid.appendChild(card);
      });
      
      section.appendChild(grid);
      innerContainer.appendChild(section);
    });
    
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error('Error loading results:', error);
    container.innerHTML = '<div class="container"><p style="text-align: center; color: #f44336;">Failed to load results. Please refresh the page.</p></div>';
  } finally {
    refreshIndicator.classList.remove('refresh-indicator--active');
  }
}

// Initial load
loadResults();

// Auto-refresh every 30 seconds
refreshInterval = setInterval(loadResults, 30000);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (refreshInterval) clearInterval(refreshInterval);
});
