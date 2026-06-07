import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, DYNAMO_TABLE } from './config.js';

// AWS SigV4 signing implementation using WebCrypto API
class AwsSigV4Signer {
  constructor(accessKeyId, secretAccessKey, region, service) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
    this.service = service;
  }

  async getSignatureKey(key, dateStamp, regionName, serviceName) {
    const kDate = await this.crypto.HMAC_SHA256(dateStamp, key);
    const kRegion = await this.crypto.HMAC_SHA256(regionName, kDate);
    const kService = await this.crypto.HMAC_SHA256(serviceName, kRegion);
    const kSigning = await this.crypto.HMAC_SHA256('aws4_request', kService);
    return kSigning;
  }

  get crypto() {
    return {
      HMAC_SHA256: async (message, secret) => {
        const encoder = new TextEncoder();
        const keyData = typeof secret === 'string' ? encoder.encode(secret) : secret;
        const messageData = typeof message === 'string' ? encoder.encode(message) : message;
        
        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        return new Uint8Array(signature);
      }
    };
  }

  async sha256(message) {
    const encoder = new TextEncoder();
    const data = typeof message === 'string' ? encoder.encode(message) : message;
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  async hex(hash) {
    return Array.from(hash)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async hmacSha256(key, message) {
    const result = await this.crypto.HMAC_SHA256(message, key);
    return result;
  }

  async sign(request) {
    const method = request.method;
    const canonicalUri = request.pathname || '/';
    const canonicalQueryString = this.getCanonicalQueryString(request.query);
    const canonicalHeaders = this.getCanonicalHeaders(request.headers);
    const signedHeaders = this.getSignedHeaders(request.headers);
    const payloadHash = await this.hex(await this.sha256(request.body));
    
    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');
    
    const algorithm = 'AWS4-HMAC-SHA256';
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    
    const credentialScope = `${dateStamp}/${this.region}/${this.service}/aws4_request`;
    const canonicalRequestHash = await this.hex(await this.sha256(canonicalRequest));
    
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalRequestHash
    ].join('\n');
    
    const signingKey = await this.getSignatureKey(
      this.secretAccessKey,
      dateStamp,
      this.region,
      this.service
    );
    
    const signature = await this.hex(await this.hmacSha256(signingKey, stringToSign));
    
    const authorizationHeader = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    return {
      authorization: authorizationHeader,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash
    };
  }

  getCanonicalQueryString(query) {
    if (!query) return '';
    const sortedKeys = Object.keys(query).sort();
    const encoded = sortedKeys.map(key => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(query[key]);
      return `${encodedKey}=${encodedValue}`;
    });
    return encoded.join('&');
  }

  getCanonicalHeaders(headers) {
    const sortedKeys = Object.keys(headers).sort();
    const canonical = sortedKeys.map(key => {
      const lowerKey = key.toLowerCase();
      const value = headers[key].trim();
      return `${lowerKey}:${value}`;
    });
    return canonical.join('\n') + '\n';
  }

  getSignedHeaders(headers) {
    const sortedKeys = Object.keys(headers).sort();
    return sortedKeys.map(key => key.toLowerCase()).join(';');
  }
}

// DynamoDB HTTP API client
class DynamoDBClient {
  constructor(config) {
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.region = config.region;
    this.endpoint = `https://dynamodb.${config.region}.amazonaws.com`;
    this.signer = new AwsSigV4Signer(
      config.accessKeyId,
      config.secretAccessKey,
      config.region,
      'dynamodb'
    );
  }

  async makeRequest(action, params) {
    const headers = {
      'content-type': 'application/x-amz-json-1.0',
      'x-amz-target': `DynamoDB_20120810.${action}`,
      'host': `dynamodb.${this.region}.amazonaws.com`
    };

    const request = {
      method: 'POST',
      pathname: '/',
      headers: headers,
      body: JSON.stringify(params),
      query: {}
    };

    const signedHeaders = await this.signer.sign(request);
    
    const finalHeaders = {
      ...headers,
      ...signedHeaders
    };

    const response = await fetch(this.endpoint, {
      method: request.method,
      headers: finalHeaders,
      body: request.body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DynamoDB error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async putItem(params) {
    return await this.makeRequest('PutItem', params);
  }

  async query(params) {
    return await this.makeRequest('Query', params);
  }

  async scan(params) {
    return await this.makeRequest('Scan', params);
  }
}

// Initialize client
const client = new DynamoDBClient({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION
});

// --- Write ---

async function submitVote(drinkId, voterName, rating, comment = '') {
  if (rating < 1 || rating > 5) throw new Error('rating must be 1–5');
  
  const params = {
    TableName: DYNAMO_TABLE,
    Item: {
      pk: { S: `DRINK#${drinkId}` },
      sk: { S: `VOTE#${voterName}` },
      voterName: { S: voterName },
      drinkId: { S: drinkId },
      rating: { N: String(rating) },
      comment: { S: comment.trim() },
      createdAt: { S: new Date().toISOString() }
    }
  };
  
  await client.putItem(params);
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
  const params = {
    TableName: DYNAMO_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': { S: `DRINK#${drinkId}` }
    }
  };
  
  const result = await client.query(params);
  const votes = (result.Items || []).map((item) => ({
    voterName: item.voterName.S,
    rating: parseInt(item.rating.N),
    comment: item.comment.S,
    createdAt: item.createdAt.S
  }));
  
  return { drinkId, votes };
}

async function getResults() {
  const params = { TableName: DYNAMO_TABLE };
  const result = await client.scan(params);
  const allVotes = result.Items || [];

  // Group by drinkId
  const votesByDrink = {};
  allVotes.forEach((item) => {
    const drinkId = item.drinkId.S;
    if (!votesByDrink[drinkId]) votesByDrink[drinkId] = [];
    votesByDrink[drinkId].push({
      rating: parseInt(item.rating.N),
      comment: item.comment.S
    });
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
