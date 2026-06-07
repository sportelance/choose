# Drink Vote App

A party voting web app where guests rate drinks across four categories (rum, gin, bourbon, spritz).

## Tech Stack

- **Frontend**: GitHub Pages (HTML, SCSS, vanilla JavaScript)
- **Backend**: Railway (Node.js, Express)
- **Database**: AWS DynamoDB
- **CI/CD**: GitHub Actions

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
     "Effect": "Allow",
     "Action": [
       "dynamodb:PutItem",
       "dynamodb:Query",
       "dynamodb:Scan"
     ],
     "Resource": "arn:aws:dynamodb:us-east-1:*:table/DrinkVotes"
   }
   ```
4. Generate access keys

### 2. Railway Setup

1. Create Railway account → New Project → Deploy from GitHub repo
2. Set root directory to `backend/`
3. Add environment variables in Railway dashboard:
   - `AWS_REGION=us-east-1`
   - `AWS_ACCESS_KEY_ID=<your-key>`
   - `AWS_SECRET_ACCESS_KEY=<your-secret>`
   - `DYNAMO_TABLE=DrinkVotes`
   - `PORT=3000`
   - `CORS_ORIGIN=https://<your-username>.github.io`
4. Copy the generated Railway domain (e.g. `https://drink-vote.railway.app`)

### 3. Frontend Configuration

1. Update `frontend/js/config.js`:
   ```js
   export const API_BASE = 'https://your-app.railway.app';
   ```

### 4. Add Drink Photos

Add drink photos to `frontend/assets/drinks/`:
- Recommended: 800×600px, JPEG, <200KB each
- Name files to match config.js IDs: `rum-1.jpg`, `gin-1.jpg`, etc.
- Free sources: Unsplash, Pexels

### 5. GitHub Pages Setup

1. Go to repo Settings → Pages
2. Set Source to **GitHub Actions**
3. Push to main branch to trigger deployment

### 6. GitHub Actions Setup

1. Add `RAILWAY_TOKEN` to repo secrets (get from Railway dashboard)
2. Update `.github/workflows/deploy-backend.yml` with your Railway service ID

## Local Development

```bash
# Frontend
cd frontend
npx live-server .

# Compile SCSS
sass --watch frontend/scss/main.scss:frontend/css/main.css

# Backend
cd backend
cp .env.example .env  # fill in real AWS creds
npm install
npm run dev
```

## Usage

1. Share the frontend URL: `https://<username>.github.io/drink-vote/`
2. Share the admin URL: `https://<username>.github.io/drink-vote/admin.html`

## Cost

All services used are on free tier:
- DynamoDB: $0 (free tier covers usage)
- GitHub Pages: $0
- Railway: $0 (free credit/month)
- GitHub Actions: $0 (within free minutes)
