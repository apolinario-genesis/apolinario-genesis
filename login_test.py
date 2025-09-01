#!/usr/bin/env python3
"""
Focused Login Test for Nosso Diário
Tests the specific login issue reported by the user
"""

import requests
import json
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://nosso-diario.preview.emergentagent.com/api"

def test_specific_login_issue():
    """Test the specific login issue reported by the user"""
    print("🔍 Testing Specific Login Issue")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 50)
    
    # Test credentials as mentioned in the review request
    login_data = {
        "email": "maria.silva@teste.com",
        "password": "senha123"
    }
    
    print(f"Testing login with: {login_data['email']}")
    
    try:
        # Test login endpoint
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
        
        print(f"Login Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful!")
            print(f"Token received: {data.get('access_token')[:50]}..." if data.get('access_token') else "No token")
            print(f"User data: {data.get('user', {}).get('name')} ({data.get('user', {}).get('email')})")
            
            # Test /auth/me endpoint with the token
            token = data.get('access_token')
            if token:
                print("\n🔍 Testing /auth/me endpoint...")
                headers = {"Authorization": f"Bearer {token}"}
                
                me_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
                print(f"/auth/me Response Status: {me_response.status_code}")
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print("✅ /auth/me successful!")
                    print(f"User: {me_data.get('name')} ({me_data.get('email')})")
                    print(f"Partner: {me_data.get('partner_name', 'No partner')}")
                    print(f"Couple Code: {me_data.get('couple_code', 'No code')}")
                    
                    # Check if user has partner (needed for dashboard access)
                    if me_data.get('partner_id'):
                        print("✅ User has a partner - should be able to access dashboard")
                    else:
                        print("⚠️  User has no partner - may need couple setup first")
                        
                else:
                    print(f"❌ /auth/me failed: {me_response.text}")
            else:
                print("❌ No token received from login")
                
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
    
    print("\n" + "=" * 50)
    
    # Also test João's login
    print("🔍 Testing João's login for comparison...")
    joao_login = {
        "email": "joao.santos@teste.com", 
        "password": "senha123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=joao_login)
        print(f"João Login Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ João login successful!")
            print(f"User: {data.get('user', {}).get('name')} ({data.get('user', {}).get('email')})")
            
            # Check partner status
            if data.get('user', {}).get('partner_id'):
                print("✅ João has a partner")
            else:
                print("⚠️  João has no partner")
        else:
            print(f"❌ João login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ João login request failed: {str(e)}")

if __name__ == "__main__":
    test_specific_login_issue()