function renderStars(rating, interactive = false, onRatingChange = null) {
  const container = document.createElement('div');
  container.className = 'stars';
  
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = `stars__star ${i <= rating ? 'stars__star--filled' : ''}`;
    star.textContent = '★';
    
    if (interactive) {
      star.addEventListener('click', () => {
        if (onRatingChange) onRatingChange(i);
      });
      
      star.addEventListener('mouseenter', () => {
        container.querySelectorAll('.stars__star').forEach((s, idx) => {
          s.classList.toggle('stars__star--filled', idx < i);
        });
      });
      
      star.addEventListener('mouseleave', () => {
        container.querySelectorAll('.stars__star').forEach((s, idx) => {
          s.classList.toggle('stars__star--filled', idx < rating);
        });
      });
    }
    
    container.appendChild(star);
  }
  
  return container;
}

function renderCard(drink, currentVote = {}, interactive = true, onVoteSubmit = null) {
  const card = document.createElement('div');
  card.className = `drink-card ${interactive ? '' : 'drink-card--admin'}`;
  
  const photo = document.createElement('img');
  photo.className = 'drink-card__photo';
  photo.src = drink.photo;
  photo.alt = drink.name;
  photo.onerror = () => { photo.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%2316213e" width="300" height="200"/%3E%3Ctext fill="%23eaeaea" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Photo%3C/text%3E%3C/svg%3E'; };
  
  const content = document.createElement('div');
  content.className = 'drink-card__content';
  
  const name = document.createElement('h3');
  name.className = 'drink-card__name';
  name.textContent = drink.name;
  
  const description = document.createElement('p');
  description.className = 'drink-card__description';
  description.textContent = drink.description;
  
  const ingredients = document.createElement('p');
  ingredients.className = 'drink-card__ingredients';
  ingredients.textContent = drink.ingredients.join(' · ');
  
  content.appendChild(name);
  content.appendChild(description);
  content.appendChild(ingredients);
  
  if (interactive) {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'drink-card__rating';
    
    const stars = renderStars(currentVote.rating || 0, true, (newRating) => {
      ratingContainer.innerHTML = '';
      ratingContainer.appendChild(renderStars(newRating, true, onRatingChange));
      if (onVoteSubmit) onVoteSubmit(drink.id, newRating, commentInput.value);
    });
    
    let onRatingChange = (newRating) => {
      ratingContainer.innerHTML = '';
      ratingContainer.appendChild(renderStars(newRating, true, onRatingChange));
    };
    
    ratingContainer.appendChild(stars);
    content.appendChild(ratingContainer);
    
    const commentContainer = document.createElement('div');
    commentContainer.className = 'drink-card__comment';
    
    const commentInput = document.createElement('textarea');
    commentInput.className = 'textarea';
    commentInput.placeholder = 'Add a comment (optional)...';
    commentInput.value = currentVote.comment || '';
    commentContainer.appendChild(commentInput);
    content.appendChild(commentContainer);
    
    const actions = document.createElement('div');
    actions.className = 'drink-card__actions';
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn--primary drink-card__btn';
    submitBtn.textContent = 'Submit this drink';
    submitBtn.addEventListener('click', () => {
      const rating = ratingContainer.querySelector('.stars__star--filled')?.length || 0;
      if (onVoteSubmit) onVoteSubmit(drink.id, rating, commentInput.value);
    });
    actions.appendChild(submitBtn);
    content.appendChild(actions);
  }
  
  card.appendChild(photo);
  card.appendChild(content);
  
  return card;
}

function renderAdminCard(drink, result) {
  const card = renderCard(drink, {}, false);
  
  const adminStats = document.createElement('div');
  adminStats.className = 'drink-card__admin-stats';
  
  const average = document.createElement('div');
  average.className = 'drink-card__admin-stats__average';
  
  const avgStars = renderStars(Math.round(result.average), false);
  average.appendChild(avgStars);
  
  const avgText = document.createElement('span');
  avgText.textContent = `${result.average} / 5 · ${result.voteCount} votes`;
  average.appendChild(avgText);
  
  adminStats.appendChild(average);
  
  if (result.voteCount > 0) {
    const breakdown = document.createElement('div');
    breakdown.className = 'drink-card__admin-stats__breakdown';
    
    for (let i = 1; i <= 5; i++) {
      const count = result.breakdown[i.toString()] || 0;
      const percentage = (count / result.voteCount) * 100;
      
      const bar = document.createElement('div');
      bar.className = 'drink-card__admin-stats__breakdown__bar';
      
      const fill = document.createElement('div');
      fill.className = 'drink-card__admin-stats__breakdown__bar__fill';
      fill.style.width = `${percentage}%`;
      fill.title = `${i} star: ${count} votes`;
      
      bar.appendChild(fill);
      breakdown.appendChild(bar);
    }
    
    adminStats.appendChild(breakdown);
    
    if (result.comments.length > 0) {
      const comments = document.createElement('div');
      comments.className = 'drink-card__admin-stats__comments';
      
      result.comments.forEach((comment) => {
        const item = document.createElement('div');
        item.className = 'drink-card__admin-stats__comments__item';
        item.textContent = comment;
        comments.appendChild(item);
      });
      
      adminStats.appendChild(comments);
    }
  }
  
  card.appendChild(adminStats);
  
  return card;
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

export { renderStars, renderCard, renderAdminCard, showToast };
