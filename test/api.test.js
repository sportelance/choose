import { describe, it } from 'node:test';
import assert from 'node:assert';

// Test modules that don't require external dependencies
describe('State Module', () => {
  it('should get vote for non-existent drink', async () => {
    const state = (await import('../js/state.js')).default;
    const vote = state.getVote('non-existent');
    assert.deepStrictEqual(vote, { rating: 0, comment: '' });
  });

  it('should set and get vote', async () => {
    const state = (await import('../js/state.js')).default;
    state.clearVotes();
    state.setVote('rum-1', 4, 'Great!');
    const vote = state.getVote('rum-1');
    assert.strictEqual(vote.rating, 4);
    assert.strictEqual(vote.comment, 'Great!');
  });

  it('should check if user has voted', async () => {
    const state = (await import('../js/state.js')).default;
    state.clearVotes();
    assert.strictEqual(state.hasVoted('rum-1'), false);
    state.setVote('rum-1', 4, '');
    assert.strictEqual(state.hasVoted('rum-1'), true);
  });

  it('should get all votes', async () => {
    const state = (await import('../js/state.js')).default;
    state.clearVotes();
    state.setVote('rum-1', 4, '');
    state.setVote('gin-1', 5, '');
    const votes = state.getAllVotes();
    assert.strictEqual(Object.keys(votes).length, 2);
  });

  it('should clear all votes', async () => {
    const state = (await import('../js/state.js')).default;
    state.setVote('rum-1', 4, '');
    state.clearVotes();
    const votes = state.getAllVotes();
    assert.strictEqual(Object.keys(votes).length, 0);
  });
});

describe('Config Module', () => {
  it('should export AWS constants', async () => {
    const config = await import('../js/config.js');
    assert.strictEqual(config.AWS_REGION, 'us-east-1');
    assert.strictEqual(config.DYNAMO_TABLE, 'DrinkVotes');
  });

  it('should export drinks array', async () => {
    const config = await import('../js/config.js');
    assert(Array.isArray(config.DRINKS));
    assert.strictEqual(config.DRINKS.length, 5);
    assert.strictEqual(config.DRINKS[0].id, 'rum-1');
  });

  it('should export categories array', async () => {
    const config = await import('../js/config.js');
    assert(Array.isArray(config.CATEGORIES));
    assert.strictEqual(config.CATEGORIES.length, 4);
    assert.strictEqual(config.CATEGORIES[0].id, 'rum');
  });

  it('should have all required drink properties', async () => {
    const config = await import('../js/config.js');
    const drink = config.DRINKS[0];
    assert.ok(drink.id);
    assert.ok(drink.category);
    assert.ok(drink.name);
    assert.ok(drink.photo);
    assert.ok(drink.description);
    assert.ok(Array.isArray(drink.ingredients));
  });
});

describe('Results Calculation Logic', () => {
  it('should calculate average correctly', () => {
    const votes = [
      { rating: 4, comment: 'Great!' },
      { rating: 5, comment: '' },
      { rating: 3, comment: 'Okay' },
    ];
    const average = votes.reduce((s, v) => s + v.rating, 0) / votes.length;
    assert.strictEqual(average, 4);
  });

  it('should calculate breakdown correctly', () => {
    const votes = [
      { rating: 4, comment: 'Great!' },
      { rating: 5, comment: '' },
      { rating: 4, comment: 'Good' },
    ];
    const breakdown = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    votes.forEach((v) => { breakdown[String(v.rating)]++; });
    assert.strictEqual(breakdown['4'], 2);
    assert.strictEqual(breakdown['5'], 1);
    assert.strictEqual(breakdown['3'], 0);
  });

  it('should filter empty comments', () => {
    const votes = [
      { rating: 4, comment: 'Great!' },
      { rating: 5, comment: '' },
      { rating: 3, comment: '   ' },
    ];
    const comments = votes.filter((v) => v.comment?.trim()).map((v) => v.comment);
    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0], 'Great!');
  });
});
