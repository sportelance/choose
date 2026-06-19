import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, DYNAMO_TABLE } from './config.js';

// ---------------------------------------------------------------------------
// WebCrypto SigV4 helpers — flat functions, no classes
// ---------------------------------------------------------------------------

async function sha256(message) {
  const enc = new TextEncoder();
  const data = typeof message === 'string' ? enc.encode(message) : message;
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

async function hmac(secret, message) {
  const enc = new TextEncoder();
  const keyData = typeof secret === 'string' ? enc.encode(secret) : secret;
  const msgData = typeof message === 'string' ? enc.encode(message) : message;
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, msgData));
}

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sign a DynamoDB request with SigV4.
 * Returns a headers object ready to spread into fetch().
 */
async function signDynamo(action, body) {
  const region  = AWS_REGION;
  const service = 'dynamodb';
  const host    = `${service}.${region}.amazonaws.com`;

  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = toHex(await sha256(body));

  // All header keys must be lowercase and sorted alphabetically
  const headers = {
    'content-type':         'application/x-amz-json-1.0',
    'host':                 host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date':           amzDate,
    'x-amz-target':         `DynamoDB_20120810.${action}`,
  };

  const sortedKeys    = Object.keys(headers).sort();
  const canonicalHdrs = sortedKeys.map(k => `${k}:${headers[k]}`).join('\n') + '\n';
  const signedHdrs    = sortedKeys.join(';');

  const canonicalRequest = [
    'POST',
    '/',
    '',           // no query string
    canonicalHdrs,
    signedHdrs,
    payloadHash,
  ].join('\n');

  const scope        = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    toHex(await sha256(canonicalRequest)),
  ].join('\n');

  // Derive signing key — AWS4 prefix on the secret is mandatory
  const kDate    = await hmac('AWS4' + AWS_SECRET_ACCESS_KEY, dateStamp);
  const kRegion  = await hmac(kDate,    region);
  const kService = await hmac(kRegion,  service);
  const kSign    = await hmac(kService, 'aws4_request');
  const sig      = toHex(await hmac(kSign, stringToSign));

  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${AWS_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHdrs}, Signature=${sig}`,
  };
}

// ---------------------------------------------------------------------------
// DynamoDB request wrapper
// ---------------------------------------------------------------------------

async function dynamoRequest(action, params) {
  const body    = JSON.stringify(params);
  const headers = await signDynamo(action, body);

  const response = await fetch(`https://dynamodb.${AWS_REGION}.amazonaws.com/`, {
    method:  'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`DynamoDB ${action} error:`, response.status, errorText);
    throw new Error(`DynamoDB error: ${response.status} - ${errorText}`);
  }

  // PutItem returns an empty body on success
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// ---------------------------------------------------------------------------
// Public API — same signatures as before, no other file needs to change
// ---------------------------------------------------------------------------

async function submitVote(drinkId, voterName, rating, comment = '') {
  if (rating < 1 || rating > 5) throw new Error('rating must be 1–5');

  await dynamoRequest('PutItem', {
    TableName: DYNAMO_TABLE,
    Item: {
      pk:        { S: `DRINK#${drinkId}` },
      sk:        { S: `VOTE#${voterName}` },  // no timestamp — overwrites on re-vote
      voterName: { S: voterName },
      drinkId:   { S: drinkId },
      rating:    { N: String(rating) },
      comment:   { S: comment.trim() },
      createdAt: { S: new Date().toISOString() },
    },
  });

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

async function getVotes(drinkId) {
  const result = await dynamoRequest('Query', {
    TableName:                 DYNAMO_TABLE,
    KeyConditionExpression:    'pk = :pk',
    ExpressionAttributeValues: { ':pk': { S: `DRINK#${drinkId}` } },
  });

  const votes = (result.Items || []).map(item => ({
    voterName: item.voterName.S,
    rating:    parseInt(item.rating.N, 10),
    comment:   item.comment.S,
    createdAt: item.createdAt.S,
  }));

  return { drinkId, votes };
}

async function getResults() {
  const result   = await dynamoRequest('Scan', { TableName: DYNAMO_TABLE });
  const allVotes = result.Items || [];

  const votesByDrink = {};
  allVotes.forEach(item => {
    const id = item.drinkId.S;
    if (!votesByDrink[id]) votesByDrink[id] = [];
    votesByDrink[id].push({
      rating:  parseInt(item.rating.N, 10),
      comment: item.comment.S,
    });
  });

  const results = Object.keys(votesByDrink).map(drinkId => {
    const votes   = votesByDrink[drinkId];
    const average = votes.length
      ? parseFloat((votes.reduce((s, v) => s + v.rating, 0) / votes.length).toFixed(1))
      : 0;
    const breakdown = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    votes.forEach(v => { breakdown[String(v.rating)]++; });
    const comments = votes.filter(v => v.comment?.trim()).map(v => v.comment);
    return { drinkId, average, voteCount: votes.length, comments, breakdown };
  });

  return { results };
}

export { submitVote, submitBatch, getVotes, getResults };