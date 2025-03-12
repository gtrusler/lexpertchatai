import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# API endpoint
API_URL = "http://localhost:8000"

# Test user credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

def test_login():
    """Test login functionality with Supabase"""
    print("\n=== Testing Login ===")
    
    # Direct Supabase login (using REST API)
    login_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(
            login_url, 
            headers=headers, 
            json=login_data
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            print(f"✅ Login successful")
            print(f"Access Token: {access_token[:20]}...")
            return access_token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None

def test_protected_endpoint(token):
    """Test a protected endpoint with the auth token"""
    print("\n=== Testing Protected Endpoint ===")
    
    if not token:
        print("❌ No token available, skipping test")
        return
    
    # Test the /api/rag endpoint
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "bot_id": "test_bot",
        "prompt": "Test prompt"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/rag", 
            headers=headers, 
            json=data
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Protected endpoint access successful")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"❌ Protected endpoint access failed")
            print(response.text)
    except Exception as e:
        print(f"❌ Error accessing protected endpoint: {str(e)}")

def test_public_endpoint():
    """Test a public endpoint"""
    print("\n=== Testing Public Endpoint ===")
    
    try:
        response = requests.get(f"{API_URL}/health")
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Public endpoint access successful")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"❌ Public endpoint access failed")
            print(response.text)
    except Exception as e:
        print(f"❌ Error accessing public endpoint: {str(e)}")

def test_unauthorized_access():
    """Test accessing a protected endpoint without a token"""
    print("\n=== Testing Unauthorized Access ===")
    
    # Test the /api/rag endpoint without a token
    headers = {
        "Content-Type": "application/json"
    }
    
    data = {
        "bot_id": "test_bot",
        "prompt": "Test prompt"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/rag", 
            headers=headers, 
            json=data
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Unauthorized access correctly rejected")
            print(f"Response: {response.text}")
        else:
            print(f"❌ Unauthorized access test failed")
            print(response.text)
    except Exception as e:
        print(f"❌ Error during unauthorized access test: {str(e)}")

if __name__ == "__main__":
    print("=== Lexpert Case AI Auth Testing ===")
    
    # Test public endpoint
    test_public_endpoint()
    
    # Test login
    token = test_login()
    
    # Test protected endpoint with token
    test_protected_endpoint(token)
    
    # Test unauthorized access
    test_unauthorized_access()
    
    print("\n=== Testing Complete ===") 