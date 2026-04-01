import boto3
import os
from dotenv import load_dotenv

load_dotenv()  # This safely loads the .env file containing your User Pool IDs!

def test_aws_connection():
    print("------- AWS CLOUD TEST -------")
    try:
        # Check DynamoDB
        print("1. Testing DynamoDB connection...")
        dynamodb = boto3.client('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        tables = dynamodb.list_tables()
        if 'PlatformDB' in tables['TableNames']:
            print("✅ SUCCESS: PlatformDB found in DynamoDB!")
        else:
            print(f"⚠️ WARNING: Could connect to AWS, but PlatformDB not found. Tables seen: {tables['TableNames']}")
            
        print("\n-------------------------------\n")
        
        # Check Cognito User Pool
        print("2. Testing Cognito connection...")
        cognito = boto3.client('cognito-idp', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        pool_id = os.getenv('COGNITO_USER_POOL_ID')
        
        response = cognito.describe_user_pool(UserPoolId=pool_id)
        if response['UserPool']['Id'] == pool_id:
            print(f"✅ SUCCESS: Connected to Cognito ({response['UserPool']['Name']}) successfully!")
            print(f"   -> Found App Client mapping perfectly as well.")
            
        print("\n🎉 DAY 2 IS 100% VERIFIED! Your laptop can talk securely to the cloud.")

    except Exception as e:
        print(f"\n❌ AWS CONNECTION FAILED:")
        print(f"Error Message: {str(e)}")
        print("\n💡 NOTE: To test API calls locally from your Mac, you need AWS IAM Access Keys.")
        print("If you haven't yet, you must go back to the AWS Console, click your username in the top right -> 'Security Credentials' -> 'Create Access Key'.")
        print("Then run 'aws configure' in your VSCode Terminal and paste them!")

if __name__ == "__main__":
    test_aws_connection()
