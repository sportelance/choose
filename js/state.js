const state = {
  votes: {},
  
  getVote(drinkId) {
    return this.votes[drinkId] || { rating: 0, comment: '' };
  },
  
  setVote(drinkId, rating, comment = '') {
    this.votes[drinkId] = { rating, comment };
  },
  
  getAllVotes() {
    return this.votes;
  },
  
  clearVotes() {
    this.votes = {};
  },
  
  hasVoted(drinkId) {
    return this.votes[drinkId] && this.votes[drinkId].rating > 0;
  },
};

export default state;
