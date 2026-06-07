# Drink Vote App

A party voting web app where guests rate drinks across four categories (rum, gin, bourbon, spritz).

## Tech Stack

- **Frontend**: GitHub Pages (HTML, SCSS, vanilla JavaScript)
- **Database**: AWS DynamoDB (accessed directly from browser via AWS SDK v3)
- **CI/CD**: GitHub Actions

**Note**: This is a serverless architecture. The frontend calls DynamoDB directly from the browser using AWS SDK v3. AWS credentials are injected via GitHub Actions secrets during deployment, which keeps them out of the repo. Do not use this pattern for apps with real user data.

## Setup Instructions

### 1. DynamoDB Setup

1. Create AWS account (free tier)
2. Create DynamoDB table `DrinkVotes`:
   - Partition key: `pk` (String)
   - Sort key: `sk` (String)
   - Capacity: On-demand
3. Create IAM user `drink-vote-api` with policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:PutItem",
           "dynamodb:Query",
           "dynamodb:Scan"
         ],
         "Resource": "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/DrinkVotes",
         "Condition": {
           "ForAllValues:StringLike": {
             "dynamodb:LeadingKeys": ["DRINK#*"]
           }
         }
       }
     ]
   }
   ```
   The `Condition` block ensures the key can only touch items whose partition key starts with `DRINK#`.
4. Generate access keys

### 2. GitHub Secrets Setup

1. Go to repo Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `AWS_REGION`: `us-east-1`
   - `AWS_ACCESS_KEY_ID`: Your AWS access key ID
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key

### 3. Add Drink Photos

Add drink photos to `assets/drinks/`:
- Recommended: 800×600px, JPEG, <200KB each
- Name files to match config.js IDs: `rum-1.jpg`, `gin-1.jpg`, etc.
- Free sources: Unsplash, Pexels

### 4. GitHub Pages Setup

1. Go to repo Settings → Pages
2. Set Source to **GitHub Actions**
3. Push to main branch to trigger deployment

## Local Development

For local development, you'll need to temporarily add your AWS credentials to `js/config.js`:

```bash
# Install dependencies
npm install

# Temporarily edit js/config.js to add your real AWS credentials
# (replace the __AWS_*__ placeholders)

# Start dev server
npm run dev

# Compile SCSS (in another terminal)
npm run watch:css
```

**Important**: After local development, revert `js/config.js` to use the placeholders before committing.

## Usage

1. Share the frontend URL: `https://<username>.github.io/<repo-name>/`
2. Share the admin URL: `https://<username>.github.io/<repo-name>/admin.html`

## Cost

All services used are on free tier:
- DynamoDB: $0 (free tier covers usage)
- GitHub Pages: $0
- GitHub Actions: $0 (within free minutes)
