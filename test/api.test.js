import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

// Mock the AWS SDK modules
mock.module('https://esm.sh/@aws-sdk/client-dynamodb@3', () => ({
  DynamoDBClient: class MockClient {
    constructor(config) {
      this.config = config;
    }
  },
}));

mock.module('https://esm.sh/@aws-sdk/lib-dynamodb@3', () => ({
  DynamoDBDocumentClient: {
    from: (client) => ({
      send: async (command) => {
        // Mock responses based on command type
        if (command.constructor.name === 'PutCommand') {
          return { ok: true };
        }
        if (command.constructor.name === 'QueryCommand') {
          return {
            Items: [
              { voterName: 'Alice', rating: 4, comment: 'Great!', createdAt: '2024-01-01T00:00:00Z' },
            ],
          };
        }
        if (command.constructor.name === 'ScanCommand') {
          return {
            Items: [
              { pk: 'DRINK#rum-1', sk: 'VOTE#Alice', drinkId: 'rum-1', voterName: 'Alice', rating: 4, comment: 'Great!', createdAt: '2024-01-01T00:00:00Z' },
              { pk: 'DRINK#rum-1', sk: 'VOTE#Bob', drinkId: 'rum-1', voterName: 'Bob', rating: 5, comment: '', createdAt: '2024-01-01T00:00:00Z' },
            ],
          };
        }
        return {};
      },
    }),
  },
  PutCommand: class MockPutCommand {
    constructor(input) {
      this.input = input;
    }
  },
  QueryCommand: class MockQueryCommand {
    constructor(input) {
      this.input = input;
    }
  },
  ScanCommand: class MockScanCommand {
    constructor(input) {
      this.input = input;
    }
  },
}));

// Mock config
mock.module('./js/config.js', () => ({
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'test-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret',
  DYNAMO_TABLE: 'DrinkVotes',
}));

describe('API Module', () => {
  it('submitVote should validate rating range', async () => {
    const { submitVote } = await import('./js/api.js');
    
    await assert.rejects(
      async () => await submitVote('rum-1', 'Alice', 0, ''),
      /rating must be 1–5/
    );
    
    await assert.rejects(
      async () => await submitVote('rum-1', 'Alice', 6, ''),
      /rating must be 1–5/
    );
  });

  it('submitVote should accept valid ratings', async () => {
    const { submitVote } = await import('./js/api.js');
    
    const result = await submitVote('rum-1', 'Alice', 4, 'Great!');
    assert.strictEqual(result.ok, true);
  });

  it('submitBatch should submit multiple votes', async () => {
    const { submitBatch } = await import('./js/api.js');
    
    const votes = [
      { drinkId: 'rum-1', rating: 4, comment: 'Great!' },
      { drinkId: 'gin-1', rating: 5, comment: '' },
    ];
    
    const result = await submitBatch('Alice', votes);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.saved, 2);
  });

  it('getVotes should return votes for a drink', async () => {
    const { getVotes } = await import('./js/api.js');
    
    const result = await getVotes('rum-1');
    assert.strictEqual(result.drinkId, 'rum-1');
    assert.strictEqual(result.votes.length, 1);
    assert.strictEqual(result.votes[0].voterName, 'Alice');
    assert.strictEqual(result.votes[0].rating, 4);
  });

  it('getResults should calculate averages correctly', async () => {
    const { getResults } = await import('./js/api.js');
    
    const result = await getResults();
    assert.strictEqual(result.results.length, 1);
    assert.strictEqual(result.results[0].drinkId, 'rum-1');
    assert.strictEqual(result.results[0].average, 4.5); // (4 + 5) / 2
    assert.strictEqual(result.results[0].voteCount, 2);
  });

  it('getResults should calculate breakdown correctly', async () => {
    const { getResults } = await import('./js/api.js');
    
    const result = await getResults();
    const breakdown = result.results[0].breakdown;
    assert.strictEqual(breakdown['4'], 1);
    assert.strictEqual(breakdown['5'], 1);
    assert.strictEqual(breakdown['1'], 0);
  });

  it('getResults should filter empty comments', async () => {
    const { getResults } = await import('./js/api.js');
    
    const result = await getResults();
    const comments = result.results[0].comments;
    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0], 'Great!');
  });
});

describe('State Module', () => {
  it('should get vote for non-existent drink', async () => {
    const state = (await import('./js/state.js')).default;
    const vote = state.getVote('non-existent');
    assert.deepStrictEqual(vote, { rating: 0, comment: '' });
  });

  it('should set and get vote', async () => {
    const state = (await import('./js/state.js')).default;
    state.clearVotes();
    state.setVote('rum-1', 4, 'Great!');
    const vote = state.getVote('rum-1');
    assert.strictEqual(vote.rating, 4);
    assert.strictEqual(vote.comment, 'Great!');
  });

  it('should check if user has voted', async () => {
    const state = (await import('./js/state.js')).default;
    state.clearVotes();
    assert.strictEqual(state.hasVoted('rum-1'), false);
    state.setVote('rum-1', 4, '');
    assert.strictEqual(state.hasVoted('rum-1'), true);
  });

  it('should get all votes', async () => {
    const state = (await import('./js/state.js')).default;
    state.clearVotes();
    state.setVote('rum-1', 4, '');
    state.setVote('gin-1', 5, '');
    const votes = state.getAllVotes();
    assert.strictEqual(Object.keys(votes).length, 2);
  });

  it('should clear all votes', async () => {
    const state = (await import('./js/state.js')).default;
    state.setVote('rum-1', 4, '');
    state.clearVotes();
    const votes = state.getAllVotes();
    assert.strictEqual(Object.keys(votes).length, 0);
  });
});

describe('Config Module', () => {
  it('should export AWS constants', async () => {
    const config = await import('./js/config.js');
    assert.strictEqual(config.AWS_REGION, 'us-east-1');
    assert.strictEqual(config.DYNAMO_TABLE, 'DrinkVotes');
  });

  it('should export drinks array', async () => {
    const config = await import('./js/config.js');
    assert(Array.isArray(config.DRINKS));
    assert.strictEqual(config.DRINKS.length, 5);
    assert.strictEqual(config.DRINKS[0].id, 'rum-1');
  });

  it('should export categories array', async () => {
    const config = await import('./js/config.js');
    assert(Array.isArray(config.CATEGORIES));
    assert.strictEqual(config.CATEGORIES.length, 4);
    assert.strictEqual(config.CATEGORIES[0].id, 'rum');
  });
});
