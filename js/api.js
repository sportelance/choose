import { DynamoDBClient } from 'https://esm.sh/@aws-sdk/client-dynamodb@3';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from 'https://esm.sh/@aws-sdk/lib-dynamodb@3';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, DYNAMO_TABLE } from './config.js';

const client = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// --- Write ---

async function submitVote(drinkId, voterName, rating, comment = '') {
  if (rating < 1 || rating > 5) throw new Error('rating must be 1–5');
  const command = new PutCommand({
    TableName: DYNAMO_TABLE,
    Item: {
      pk: `DRINK#${drinkId}`,
      sk: `VOTE#${voterName}`,          // no timestamp — PutItem overwrites on re-vote
      voterName,
      drinkId,
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    },
  });
  await docClient.send(command);
  return { ok: true };
}

async function submitBatch(voterName, votes) {
  await Promise.all(
    votes.map(({ drinkId, rating, comment }) =>
      submitVote(drinkId, voterName, rating, comment)
    )
  );
  return { ok: true, saved: votes.length };
}

// --- Read ---

async function getVotes(drinkId) {
  const command = new QueryCommand({
    TableName: DYNAMO_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': `DRINK#${drinkId}` },
  });
  const result = await docClient.send(command);
  const votes = (result.Items || []).map(({ voterName, rating, comment, createdAt }) => ({
    voterName, rating, comment, createdAt,
  }));
  return { drinkId, votes };
}

async function getResults() {
  const command = new ScanCommand({ TableName: DYNAMO_TABLE });
  const result = await docClient.send(command);
  const allVotes = result.Items || [];

  // Group by drinkId (same logic that was in backend/src/routes/results.js)
  const votesByDrink = {};
  allVotes.forEach((item) => {
    if (!votesByDrink[item.drinkId]) votesByDrink[item.drinkId] = [];
    votesByDrink[item.drinkId].push(item);
  });

  const results = Object.keys(votesByDrink).map((drinkId) => {
    const votes = votesByDrink[drinkId];
    const average = votes.length
      ? parseFloat((votes.reduce((s, v) => s + v.rating, 0) / votes.length).toFixed(1))
      : 0;
    const breakdown = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    votes.forEach((v) => { breakdown[String(v.rating)]++; });
    const comments = votes.filter((v) => v.comment?.trim()).map((v) => v.comment);
    return { drinkId, average, voteCount: votes.length, comments, breakdown };
  });

  return { results };
}

export { submitVote, submitBatch, getVotes, getResults };
