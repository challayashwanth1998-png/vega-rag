import boto3
import os
from dotenv import load_dotenv

load_dotenv()
cognito = boto3.client('cognito-idp', region_name=os.getenv('AWS_REGION', 'us-east-1'))
pool_id = os.getenv('COGNITO_USER_POOL_ID')
client_id = os.getenv('COGNITO_APP_CLIENT_ID')

def fix_cognito():
    print("Reading current Cognito App Client settings...")
    response = cognito.describe_user_pool_client(UserPoolId=pool_id, ClientId=client_id)
    client = response['UserPoolClient']

    kwargs = {
        'UserPoolId': pool_id,
        'ClientId': client_id,
    }

    # The AWS API rejects updating these read-only fields, so we strip them
    skip_keys = ['CreationDate', 'LastModifiedDate', 'ClientSecret']

    # Copy all existing settings perfectly
    for key, value in client.items():
        if key not in skip_keys:
            kwargs[key] = value

    # Create arrays if they don't exist
    if 'CallbackURLs' not in kwargs: kwargs['CallbackURLs'] = []
    if 'LogoutURLs' not in kwargs: kwargs['LogoutURLs'] = []

    # Inject localhost:3000
    if 'http://localhost:3000' not in kwargs['CallbackURLs']:
        kwargs['CallbackURLs'].append('http://localhost:3000')

    if 'http://localhost:3000' not in kwargs['LogoutURLs']:
        kwargs['LogoutURLs'].append('http://localhost:3000')

    print("Pushing new Allowed URLs to AWS...")
    cognito.update_user_pool_client(**kwargs)
    print("✅ Successfully forced Next.js localhost:3000 into Cognito Allowed URLs!")

if __name__ == "__main__":
    fix_cognito()
