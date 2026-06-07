const express = require('express');
const router = express.Router();
const { putVote, queryVotes } = require('../db/dynamo');

// POST /votes - Submit or update a single vote
router.post('/', async (req, res) => {
  try {
    const { drinkId, voterName, rating, comment } = req.body;

    // Validation
    if (!drinkId || !voterName || rating === undefined) {
      return res.status(400).json({ error: 'drinkId, voterName, and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be 1–5' });
    }

    const timestamp = Date.now().toString();
    const item = {
      pk: `DRINK#${drinkId}`,
      sk: `VOTE#${voterName}#${timestamp}`,
      voterName,
      drinkId,
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };

    await putVote(item);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// POST /votes/batch - Submit all votes at once
router.post('/batch', async (req, res) => {
  try {
    const { voterName, votes } = req.body;

    // Validation
    if (!voterName || !Array.isArray(votes)) {
      return res.status(400).json({ error: 'voterName and votes array are required' });
    }

    const timestamp = Date.now().toString();
    const putPromises = votes.map(async (vote) => {
      const { drinkId, rating, comment } = vote;
      if (rating < 1 || rating > 5) {
        throw new Error(`Invalid rating for ${drinkId}`);
      }

      const item = {
        pk: `DRINK#${drinkId}`,
        sk: `VOTE#${voterName}#${timestamp}`,
        voterName,
        drinkId,
        rating,
        comment: comment || '',
        createdAt: new Date().toISOString(),
      };

      await putVote(item);
    });

    await Promise.all(putPromises);
    res.json({ ok: true, saved: votes.length });
  } catch (error) {
    console.error('Error submitting batch votes:', error);
    res.status(500).json({ error: 'Failed to submit batch votes' });
  }
});

// GET /votes/:drinkId - Get all votes for a drink
router.get('/:drinkId', async (req, res) => {
  try {
    const { drinkId } = req.params;
    const items = await queryVotes(drinkId);

    const votes = items.map((item) => ({
      voterName: item.voterName,
      rating: item.rating,
      comment: item.comment,
      createdAt: item.createdAt,
    }));

    res.json({ drinkId, votes });
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

module.exports = router;
