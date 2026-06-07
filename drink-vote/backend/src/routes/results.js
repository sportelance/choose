const express = require('express');
const router = express.Router();
const { scanAllVotes } = require('../db/dynamo');

// GET /results - Aggregated results for all drinks
router.get('/', async (req, res) => {
  try {
    const allVotes = await scanAllVotes();

    // Group votes by drinkId
    const votesByDrink = {};
    allVotes.forEach((item) => {
      if (!votesByDrink[item.drinkId]) {
        votesByDrink[item.drinkId] = [];
      }
      votesByDrink[item.drinkId].push(item);
    });

    // Calculate aggregated results
    const results = Object.keys(votesByDrink).map((drinkId) => {
      const votes = votesByDrink[drinkId];
      const totalRating = votes.reduce((sum, v) => sum + v.rating, 0);
      const average = votes.length > 0 ? (totalRating / votes.length).toFixed(1) : '0.0';
      
      // Rating breakdown
      const breakdown = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      votes.forEach((v) => {
        breakdown[v.rating.toString()] = (breakdown[v.rating.toString()] || 0) + 1;
      });

      // Non-empty comments
      const comments = votes
        .filter((v) => v.comment && v.comment.trim())
        .map((v) => v.comment);

      return {
        drinkId,
        average: parseFloat(average),
        voteCount: votes.length,
        comments,
        breakdown,
      };
    });

    res.json({ results });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;
