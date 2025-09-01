#!/usr/bin/env python3
"""
Couple Status Test for Nosso Diário
Verifies the couple connection status in detail
"""

import requests
import json

# Backend URL from frontend/.env
BACKEND_URL = "https://nosso-diario.preview.emergentagent.com/api"

def test_couple_status():
    """Test couple connection status in detail"""
    print("🔍 Testing Couple Connection Status")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 50)
    
    # Login as Maria
    maria_login = {
        "email": "maria.silva@teste.com",
        "password": "senha123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=maria_login)
        if response.status_code == 200:
            maria_data = response.json()
            maria_token = maria_data.get('access_token')
            
            print("✅ Maria logged in successfully")
            print(f"Maria's User Data:")
            user = maria_data.get('user', {})
            print(f"  - ID: {user.get('id')}")
            print(f"  - Name: {user.get('name')}")
            print(f"  - Email: {user.get('email')}")
            print(f"  - Partner ID: {user.get('partner_id')}")
            print(f"  - Partner Name: {user.get('partner_name')}")
            print(f"  - Couple Code: {user.get('couple_code')}")
            
            # Get detailed info via /auth/me
            headers = {"Authorization": f"Bearer {maria_token}"}
            me_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
            
            if me_response.status_code == 200:
                me_data = me_response.json()
                print(f"\nMaria's Detailed Info (/auth/me):")
                print(f"  - ID: {me_data.get('id')}")
                print(f"  - Name: {me_data.get('name')}")
                print(f"  - Email: {me_data.get('email')}")
                print(f"  - Partner ID: {me_data.get('partner_id')}")
                print(f"  - Partner Name: {me_data.get('partner_name')}")
                print(f"  - Couple Code: {me_data.get('couple_code')}")
                
                # Test accessing couple features
                print(f"\n🔍 Testing Couple Features Access...")
                
                # Test love messages
                love_response = requests.get(f"{BACKEND_URL}/love-messages", headers=headers)
                print(f"Love Messages Access: {love_response.status_code} ({'✅ OK' if love_response.status_code == 200 else '❌ FAIL'})")
                
                # Test events
                events_response = requests.get(f"{BACKEND_URL}/events", headers=headers)
                print(f"Events Access: {events_response.status_code} ({'✅ OK' if events_response.status_code == 200 else '❌ FAIL'})")
                
                # Test diary entries
                diary_response = requests.get(f"{BACKEND_URL}/diary-entries", headers=headers)
                print(f"Diary Entries Access: {diary_response.status_code} ({'✅ OK' if diary_response.status_code == 200 else '❌ FAIL'})")
                
                # Test spiritual content
                spiritual_response = requests.get(f"{BACKEND_URL}/spiritual-content", headers=headers)
                print(f"Spiritual Content Access: {spiritual_response.status_code} ({'✅ OK' if spiritual_response.status_code == 200 else '❌ FAIL'})")
                
            else:
                print(f"❌ Failed to get Maria's detailed info: {me_response.text}")
                
        else:
            print(f"❌ Maria login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Maria test failed: {str(e)}")
    
    print("\n" + "=" * 50)
    
    # Login as João for comparison
    joao_login = {
        "email": "joao.santos@teste.com",
        "password": "senha123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=joao_login)
        if response.status_code == 200:
            joao_data = response.json()
            joao_token = joao_data.get('access_token')
            
            print("✅ João logged in successfully")
            print(f"João's User Data:")
            user = joao_data.get('user', {})
            print(f"  - ID: {user.get('id')}")
            print(f"  - Name: {user.get('name')}")
            print(f"  - Email: {user.get('email')}")
            print(f"  - Partner ID: {user.get('partner_id')}")
            print(f"  - Partner Name: {user.get('partner_name')}")
            print(f"  - Couple Code: {user.get('couple_code')}")
            
            # Verify bidirectional connection
            if (maria_data.get('user', {}).get('partner_id') == user.get('id') and 
                user.get('partner_id') == maria_data.get('user', {}).get('id')):
                print("\n✅ Bidirectional couple connection verified!")
            else:
                print("\n❌ Couple connection issue detected!")
                
        else:
            print(f"❌ João login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ João test failed: {str(e)}")

if __name__ == "__main__":
    test_couple_status()