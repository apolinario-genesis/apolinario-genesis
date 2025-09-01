#!/usr/bin/env python3
"""
Focused Registration Test for Nosso Diário
Testing specific issue: Registration endpoint not creating accounts
"""

import requests
import json
from datetime import datetime

# Backend URL as specified in the request
BACKEND_URL = "https://nosso-diario.preview.emergentagent.com/api"

def test_registration_endpoint():
    """Test the specific registration issue reported by user"""
    print("🔍 TESTING REGISTRATION ENDPOINT ISSUE")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    # Test data as specified in the request
    test_user = {
        "name": "Usuario Teste",
        "email": "usuario.teste@teste.com",
        "password": "123456"
    }
    
    print(f"📝 Testing registration with:")
    print(f"   Name: {test_user['name']}")
    print(f"   Email: {test_user['email']}")
    print(f"   Password: {test_user['password']}")
    print()
    
    # Test 1: Registration Request
    print("1️⃣ TESTING REGISTRATION REQUEST")
    print("-" * 40)
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/register", 
            json=test_user,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print("✅ SUCCESS: Registration returned 200 OK")
                print(f"Response Data: {json.dumps(data, indent=2, default=str)}")
                
                # Validate response structure
                required_fields = ["access_token", "token_type", "user"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    print(f"⚠️  WARNING: Missing fields in response: {missing_fields}")
                else:
                    print("✅ Response structure is correct")
                    
                # Extract token for further testing
                token = data.get("access_token")
                user_data = data.get("user")
                
                if token and user_data:
                    print(f"✅ Token received: {token[:20]}...")
                    print(f"✅ User data: {user_data}")
                    
                    # Test 2: Verify user can login with same credentials
                    test_login_after_registration(test_user, token)
                    
                    # Test 3: Verify user info endpoint
                    test_user_info_endpoint(token)
                    
                else:
                    print("❌ CRITICAL: Missing token or user data in response")
                    
            except json.JSONDecodeError as e:
                print(f"❌ CRITICAL: Invalid JSON response: {e}")
                print(f"Raw response: {response.text}")
                
        elif response.status_code == 400:
            try:
                error_data = response.json()
                print(f"❌ BAD REQUEST (400): {error_data}")
                
                # Check if it's a duplicate email error
                if "already registered" in error_data.get("detail", "").lower():
                    print("ℹ️  This might be a duplicate email. Testing with unique email...")
                    test_with_unique_email()
                    
            except json.JSONDecodeError:
                print(f"❌ BAD REQUEST (400) - Raw response: {response.text}")
                
        else:
            print(f"❌ UNEXPECTED STATUS: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Raw response: {response.text}")
                
    except requests.exceptions.Timeout:
        print("❌ CRITICAL: Request timed out after 10 seconds")
    except requests.exceptions.ConnectionError:
        print("❌ CRITICAL: Connection error - backend might be down")
    except Exception as e:
        print(f"❌ CRITICAL: Unexpected error: {e}")

def test_with_unique_email():
    """Test registration with a unique email"""
    print("\n2️⃣ TESTING WITH UNIQUE EMAIL")
    print("-" * 40)
    
    # Generate unique email with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_user = {
        "name": "Usuario Teste Unico",
        "email": f"usuario.teste.{timestamp}@teste.com",
        "password": "123456"
    }
    
    print(f"📝 Testing with unique email: {unique_user['email']}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/register", 
            json=unique_user,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: Registration with unique email worked")
            print(f"User created: {data.get('user', {}).get('name')}")
            print(f"Email: {data.get('user', {}).get('email')}")
            print(f"Couple Code: {data.get('user', {}).get('couple_code')}")
            
            # Test login with new user
            test_login_after_registration(unique_user, data.get("access_token"))
            
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_login_after_registration(user_data, expected_token):
    """Test login immediately after registration"""
    print(f"\n3️⃣ TESTING LOGIN AFTER REGISTRATION")
    print("-" * 40)
    
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/login", 
            json=login_data,
            timeout=10
        )
        
        print(f"Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: Login after registration works")
            
            login_token = data.get("access_token")
            if login_token:
                print(f"✅ Login token received: {login_token[:20]}...")
                
                # Compare tokens (they might be different due to new generation)
                if login_token == expected_token:
                    print("✅ Tokens match (same session)")
                else:
                    print("ℹ️  Tokens differ (new session generated)")
                    
            user_info = data.get("user")
            if user_info:
                print(f"✅ User info: {user_info.get('name')} ({user_info.get('email')})")
                
        else:
            print(f"❌ LOGIN FAILED: Status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Login error: {error_data}")
            except:
                print(f"Raw login response: {response.text}")
                
    except Exception as e:
        print(f"❌ LOGIN ERROR: {e}")

def test_user_info_endpoint(token):
    """Test the /auth/me endpoint to verify user was created"""
    print(f"\n4️⃣ TESTING USER INFO ENDPOINT")
    print("-" * 40)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/auth/me", 
            headers=headers,
            timeout=10
        )
        
        print(f"User Info Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: User info endpoint works")
            print(f"User details: {json.dumps(data, indent=2, default=str)}")
            
        else:
            print(f"❌ USER INFO FAILED: Status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ USER INFO ERROR: {e}")

def compare_with_login_endpoint():
    """Compare registration behavior with login endpoint"""
    print(f"\n5️⃣ COMPARING WITH LOGIN ENDPOINT")
    print("-" * 40)
    
    # Test login with existing user (from previous tests)
    existing_user = {
        "email": "maria.silva@teste.com",
        "password": "senha123"
    }
    
    print(f"Testing login with existing user: {existing_user['email']}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/login", 
            json=existing_user,
            timeout=10
        )
        
        print(f"Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: Login endpoint works correctly")
            print(f"Login response structure: {list(data.keys())}")
            
        elif response.status_code == 401:
            print("ℹ️  Login failed with 401 (user might not exist)")
            
        else:
            print(f"❌ LOGIN ISSUE: Status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Login error: {error_data}")
            except:
                print(f"Raw login response: {response.text}")
                
    except Exception as e:
        print(f"❌ LOGIN COMPARISON ERROR: {e}")

if __name__ == "__main__":
    print("🚀 NOSSO DIÁRIO - REGISTRATION ENDPOINT TEST")
    print("Testing specific user report: Registration not creating accounts")
    print("=" * 60)
    
    # Run focused registration test
    test_registration_endpoint()
    
    # Compare with login behavior
    compare_with_login_endpoint()
    
    print("\n" + "=" * 60)
    print("🏁 REGISTRATION TEST COMPLETE")
    print("=" * 60)