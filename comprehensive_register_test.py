#!/usr/bin/env python3
"""
Comprehensive Registration Test - Fresh Users
Testing registration endpoint with completely new users
"""

import requests
import json
from datetime import datetime
import random
import string

BACKEND_URL = "https://nosso-diario.preview.emergentagent.com/api"

def generate_unique_email():
    """Generate a unique email for testing"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    random_suffix = ''.join(random.choices(string.ascii_lowercase, k=4))
    return f"test.user.{timestamp}.{random_suffix}@teste.com"

def test_fresh_registration():
    """Test registration with completely fresh users"""
    print("🆕 TESTING FRESH USER REGISTRATION")
    print("=" * 50)
    
    # Create two fresh users
    user1_email = generate_unique_email()
    user2_email = generate_unique_email()
    
    user1 = {
        "name": "Ana Carolina",
        "email": user1_email,
        "password": "123456"
    }
    
    user2 = {
        "name": "Pedro Silva", 
        "email": user2_email,
        "password": "123456"
    }
    
    print(f"👤 User 1: {user1['name']} ({user1['email']})")
    print(f"👤 User 2: {user2['name']} ({user2['email']})")
    print()
    
    # Test User 1 Registration
    print("1️⃣ REGISTERING USER 1")
    print("-" * 30)
    
    try:
        response1 = requests.post(f"{BACKEND_URL}/auth/register", json=user1, timeout=10)
        print(f"Status: {response1.status_code}")
        
        if response1.status_code == 200:
            data1 = response1.json()
            print("✅ SUCCESS: User 1 registered")
            print(f"   Name: {data1['user']['name']}")
            print(f"   Email: {data1['user']['email']}")
            print(f"   Couple Code: {data1['user']['couple_code']}")
            print(f"   Token: {data1['access_token'][:20]}...")
            
            user1_token = data1['access_token']
            user1_couple_code = data1['user']['couple_code']
            
        else:
            print(f"❌ FAILED: {response1.status_code}")
            print(f"   Error: {response1.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    print()
    
    # Test User 2 Registration
    print("2️⃣ REGISTERING USER 2")
    print("-" * 30)
    
    try:
        response2 = requests.post(f"{BACKEND_URL}/auth/register", json=user2, timeout=10)
        print(f"Status: {response2.status_code}")
        
        if response2.status_code == 200:
            data2 = response2.json()
            print("✅ SUCCESS: User 2 registered")
            print(f"   Name: {data2['user']['name']}")
            print(f"   Email: {data2['user']['email']}")
            print(f"   Couple Code: {data2['user']['couple_code']}")
            print(f"   Token: {data2['access_token'][:20]}...")
            
            user2_token = data2['access_token']
            
        else:
            print(f"❌ FAILED: {response2.status_code}")
            print(f"   Error: {response2.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    print()
    
    # Test Login for both users
    print("3️⃣ TESTING LOGIN FOR BOTH USERS")
    print("-" * 30)
    
    # User 1 Login
    login1 = {"email": user1["email"], "password": user1["password"]}
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login1)
    
    if response.status_code == 200:
        print("✅ User 1 login successful")
    else:
        print(f"❌ User 1 login failed: {response.status_code}")
    
    # User 2 Login
    login2 = {"email": user2["email"], "password": user2["password"]}
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login2)
    
    if response.status_code == 200:
        print("✅ User 2 login successful")
    else:
        print(f"❌ User 2 login failed: {response.status_code}")
    
    print()
    
    # Test Couple Connection
    print("4️⃣ TESTING COUPLE CONNECTION")
    print("-" * 30)
    
    couple_data = {"couple_code": user1_couple_code}
    headers = {"Authorization": f"Bearer {user2_token}"}
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/join-couple", json=couple_data, headers=headers)
        print(f"Connection Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: Couple connected")
            print(f"   Message: {data.get('message')}")
            print(f"   Partner: {data.get('partner_name')}")
            
            # Verify connection
            verify_couple_connection(user1_token, user2_token)
            
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    return True

def verify_couple_connection(token1, token2):
    """Verify both users show as connected"""
    print("\n5️⃣ VERIFYING COUPLE CONNECTION")
    print("-" * 30)
    
    # Check User 1
    headers1 = {"Authorization": f"Bearer {token1}"}
    response1 = requests.get(f"{BACKEND_URL}/auth/me", headers=headers1)
    
    if response1.status_code == 200:
        data1 = response1.json()
        if data1.get("partner_name"):
            print(f"✅ User 1 shows partner: {data1['partner_name']}")
        else:
            print("❌ User 1 has no partner")
    
    # Check User 2
    headers2 = {"Authorization": f"Bearer {token2}"}
    response2 = requests.get(f"{BACKEND_URL}/auth/me", headers=headers2)
    
    if response2.status_code == 200:
        data2 = response2.json()
        if data2.get("partner_name"):
            print(f"✅ User 2 shows partner: {data2['partner_name']}")
        else:
            print("❌ User 2 has no partner")

def test_specific_user_case():
    """Test the exact case reported by the user"""
    print("\n🎯 TESTING SPECIFIC USER CASE")
    print("=" * 50)
    
    # Use exact data from user report
    specific_user = {
        "name": "Usuario Teste",
        "email": f"usuario.teste.{datetime.now().strftime('%Y%m%d_%H%M%S')}@teste.com",
        "password": "123456"
    }
    
    print(f"Testing with: {specific_user['name']} ({specific_user['email']})")
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/register", json=specific_user, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {response.elapsed.total_seconds():.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: Registration works with user's exact data format")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Couple Code: {data['user']['couple_code']}")
            print(f"   Token Length: {len(data['access_token'])} chars")
            
            # Test immediate login
            login_data = {
                "email": specific_user["email"],
                "password": specific_user["password"]
            }
            
            login_response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if login_response.status_code == 200:
                print("✅ Immediate login after registration works")
            else:
                print(f"❌ Login failed: {login_response.status_code}")
                
        else:
            print(f"❌ REGISTRATION FAILED: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")

if __name__ == "__main__":
    print("🚀 COMPREHENSIVE REGISTRATION TEST")
    print("Testing registration endpoint with fresh users")
    print("=" * 50)
    
    # Test with fresh users
    success = test_fresh_registration()
    
    # Test specific user case
    test_specific_user_case()
    
    print("\n" + "=" * 50)
    print("🏁 COMPREHENSIVE TEST COMPLETE")
    
    if success:
        print("✅ CONCLUSION: Registration endpoint is working correctly")
    else:
        print("❌ CONCLUSION: Issues found with registration endpoint")
    
    print("=" * 50)