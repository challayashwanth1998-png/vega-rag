# Day 2 Execution Guide: Identity & Database Serverless Architecture (AWS UI Version)

Today, we are moving into the AWS Cloud to provision your multi-tenant DynamoDB database and your Cognito User Pool for authentication. 

Since your goal is to truly learn AWS, we will build this infra directly inside the **AWS Management Console** using the UI!

---

## Step 1: Create the DynamoDB Table (Database)
We are using a **Single-Table Design**. This means every single piece of data (Users, Chat History, Bot Settings) lives in one highly optimized table named `PlatformDB`, separated by generic Partition Keys (`PK`) and Sort Keys (`SK`).

1. Log into the AWS Console.
2. In the top search bar, type **DynamoDB** and click on it.
3. Click the orange **Create table** button.
4. **Table details config:**
   * **Table name**: Type `PlatformDB`
   * **Partition key**: Type `PK` (Must be exact caps) - leave Data type as `String`.
   * **Sort key**: Check the box for "Provide a sort key". Type `SK` (Must be exact caps) - leave Data type as `String`.
5. **Table settings config:**
   * Select **Customize settings**.
   * Scroll down to **Read/write capacity settings**.
   * Select **On-demand** (This is crucial! It changes billing to PAY_PER_REQUEST, meaning $0 cost if there is no traffic. "Provisioned" will charge you hourly).
6. Scroll all the way to the bottom and click **Create table**.

*(It will say "Creating" for a few seconds. Once it says "Active", your massive NoSQL database is live and operational globally!)*

---

## Step 2: Create the Cognito User Pool (Auth)
Next, we generate the backend that handles Email/Password signups, JWT token generation, and secure multi-tenant identity.

*AWS recently updated its landing page, which differs slightly from the old wizard. Here is exactly what to click based on the screen you are currently looking at:*

1. On the main Cognito page, you can either click the orange **Get started for free** button, OR you can click the **Hamburger Menu (three horizontal lines in the top left)** and select **User pools**, then click **Create user pool**.
2. If you clicked "Get Started" and are on the **"Set up resources for your application"** page (from your screenshot):
   * **Application type**: Select **Single-page application (SPA)** *(This is critical so it doesn't try to force a secret key on your Next.js app)*.
   * **Name your application**: Type `VegaRAGFrontendClient`.
   * Scroll down and hit Next/Create. 

**If you instead use the detailed wizard (Hamburger Menu -> User Pools -> Create user pool):**

**Step 2A: Configure Sign-in Experience**
1. Provider types: Select **Cognito user pool**
2. Cognito user pool sign-in options: Check the box for **Email**.
3. Click **Next**.

**Step 2B: Configure Security Requirements**
1. Multi-factor authentication (MFA): Select **No MFA** (we can add this later).
2. User account recovery: Check "Enable self-service account recovery", and select "Email only".
3. Click **Next**.

**Step 2C: Configure Sign-up Experience**
1. Self-service sign-up: Check "Enable self-registration".
2. Scroll to "Required attributes". Add `email` if it isn't already there.
3. Click **Next**.

**Step 2D: Configure Message Delivery**
1. Email provider: Select **Send email with Cognito**.
2. Click **Next**.

**Step 2E: Integrate your App**
1. User pool name: Type `VegaRAGUserPool`
2. Initial app client: Check "Public client".
3. App client name: Type `VegaRAGFrontendClient`
4. Client secret: Select **Don't generate a client secret** (Very important! Next.js and SPA frontend Apps cannot securely store client secrets).
5. Open the "Advanced app client settings" dropdown. Under "Authentication flows", check both `ALLOW_USER_PASSWORD_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH`.
6. Click **Next** and Create!

---

## Step 3: Extract the IDs for your Code
Now that AWS holds the architecture, we need to extract the exact IDs so our local Python and Next.js code can talk to it!

1. Click on the `VegaRAGUserPool` you just explicitly created.
2. At the top of the summary, copy the **User pool ID** (it looks like `us-east-1_xxxxx`).
3. Click on the **App integration** tab. Scroll to the bottom to the "App clients" section.
4. Copy the **Client ID** (it's a long string of random letters and numbers).

## Step 4: Save your Environment Variables

**1. Backend `.env`**
In VSCode, create a new file at `/backend/.env` and paste:
```env
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your_pool_id_here
COGNITO_APP_CLIENT_ID=your_client_id_here
DYNAMODB_TABLE_NAME=PlatformDB
```

**2. Frontend `.env.local`**
In VSCode, create a new file at `/frontend/.env.local` and paste:
```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_pool_id_here
NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## Day 2 Complete! 🎉
You now know exactly how to provision production-grade NoSQL databases and Authorization systems inside the AWS Console for $0/month.

Once your `.env` files are saved, jump back into the chat!
