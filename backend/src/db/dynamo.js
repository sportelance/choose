const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMO_TABLE || 'DrinkVotes';

async function putVote(item) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  });
  await docClient.send(command);
}

async function queryVotes(drinkId) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': `DRINK#${drinkId}`,
    },
  });
  const result = await docClient.send(command);
  return result.Items || [];
}

async function scanAllVotes() {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
  });
  const result = await docClient.send(command);
  return result.Items || [];
}

module.exports = {
  putVote,
  queryVotes,
  scanAllVotes,
};
