#!/usr/bin/env python3
"""
Backend Test Suite for Sacred Bond - Couples App
Tests complete flow as requested: registration, login, couple connection, and main functionalities
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import random
import string

# Backend URL from frontend/.env
BACKEND_URL = "https://nosso-diario.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.user1_token = None
        self.user2_token = None
        self.user1_data = None
        self.user2_data = None
        self.test_results = []
        # Use specific test emails as requested
        self.user1_email = "maria.silva@teste.com"
        self.user2_email = "joao.santos@teste.com"
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Test User 1 (Maria)
        user1_data = {
            "name": "Maria Silva",
            "email": "maria.silva@teste.com",
            "password": "senha123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=user1_data)
            
            if response.status_code == 200:
                data = response.json()
                self.user1_token = data.get("access_token")
                self.user1_data = data.get("user")
                
                # Validate response structure
                required_fields = ["access_token", "token_type", "user"]
                user_fields = ["id", "name", "email", "couple_code", "created_at"]
                
                missing_fields = [field for field in required_fields if field not in data]
                missing_user_fields = [field for field in user_fields if field not in data["user"]]
                
                if not missing_fields and not missing_user_fields:
                    self.log_test(
                        "User 1 Registration", 
                        True, 
                        f"Maria registered successfully with couple code: {self.user1_data['couple_code']}"
                    )
                else:
                    self.log_test(
                        "User 1 Registration", 
                        False, 
                        "Response missing required fields",
                        f"Missing: {missing_fields + missing_user_fields}"
                    )
            else:
                self.log_test(
                    "User 1 Registration", 
                    False, 
                    f"Registration failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("User 1 Registration", False, "Request failed", str(e))
        
        # Test User 2 (João)
        user2_data = {
            "name": "João Santos",
            "email": "joao.santos@teste.com", 
            "password": "senha123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=user2_data)
            
            if response.status_code == 200:
                data = response.json()
                self.user2_token = data.get("access_token")
                self.user2_data = data.get("user")
                
                self.log_test(
                    "User 2 Registration", 
                    True, 
                    f"João registered successfully with couple code: {self.user2_data['couple_code']}"
                )
            else:
                self.log_test(
                    "User 2 Registration", 
                    False, 
                    f"Registration failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("User 2 Registration", False, "Request failed", str(e))
    
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        # Test Maria login
        login_data = {
            "email": "maria.silva@teste.com",
            "password": "senha123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                user = data.get("user")
                
                if token and user and user["name"] == "Maria Silva":
                    self.log_test("Maria Login", True, "Login successful")
                    # Update token in case it changed
                    self.user1_token = token
                else:
                    self.log_test("Maria Login", False, "Invalid response data", data)
            else:
                self.log_test(
                    "Maria Login", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Maria Login", False, "Request failed", str(e))
        
        # Test João login
        login_data = {
            "email": "joao.santos@teste.com",
            "password": "senha123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                user = data.get("user")
                
                if token and user and user["name"] == "João Santos":
                    self.log_test("João Login", True, "Login successful")
                    # Update token in case it changed
                    self.user2_token = token
                else:
                    self.log_test("João Login", False, "Invalid response data", data)
            else:
                self.log_test(
                    "João Login", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("João Login", False, "Request failed", str(e))
    
    def test_get_user_info(self):
        """Test get current user endpoint"""
        print("\n=== Testing Get User Info ===")
        
        # Test Maria's info
        if self.user1_token:
            headers = {"Authorization": f"Bearer {self.user1_token}"}
            try:
                response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data["name"] == "Maria Silva" and data["email"] == "maria.silva@teste.com":
                        self.log_test("Maria Get Info", True, "User info retrieved successfully")
                    else:
                        self.log_test("Maria Get Info", False, "Incorrect user data", data)
                else:
                    self.log_test(
                        "Maria Get Info", 
                        False, 
                        f"Request failed with status {response.status_code}",
                        response.text
                    )
            except Exception as e:
                self.log_test("Maria Get Info", False, "Request failed", str(e))
        else:
            self.log_test("Maria Get Info", False, "No token available", "User registration/login failed")
        
        # Test João's info
        if self.user2_token:
            headers = {"Authorization": f"Bearer {self.user2_token}"}
            try:
                response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data["name"] == "João Santos" and data["email"] == "joao.santos@teste.com":
                        self.log_test("João Get Info", True, "User info retrieved successfully")
                    else:
                        self.log_test("João Get Info", False, "Incorrect user data", data)
                else:
                    self.log_test(
                        "João Get Info", 
                        False, 
                        f"Request failed with status {response.status_code}",
                        response.text
                    )
            except Exception as e:
                self.log_test("João Get Info", False, "Request failed", str(e))
        else:
            self.log_test("João Get Info", False, "No token available", "User registration/login failed")
    
    def test_couple_connection(self):
        """Test couple connection functionality"""
        print("\n=== Testing Couple Connection ===")
        
        if not self.user1_token or not self.user2_token or not self.user1_data or not self.user2_data:
            self.log_test("Couple Connection", False, "Prerequisites not met", "Missing user tokens or data")
            return
        
        # João connects to Maria using her couple code
        couple_data = {
            "couple_code": self.user1_data["couple_code"]
        }
        
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/join-couple", json=couple_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "Successfully connected" in data.get("message", "") and data.get("partner_name") == "Maria Silva":
                    self.log_test("Couple Connection", True, "João successfully connected to Maria")
                    
                    # Verify connection by checking both users' info
                    self.verify_couple_connection()
                else:
                    self.log_test("Couple Connection", False, "Unexpected response", data)
            else:
                self.log_test(
                    "Couple Connection", 
                    False, 
                    f"Connection failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Couple Connection", False, "Request failed", str(e))
    
    def verify_couple_connection(self):
        """Verify that both users are properly connected"""
        print("\n=== Verifying Couple Connection ===")
        
        # Check Maria's updated info
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("partner_name") == "João Santos" and data.get("partner_id"):
                    self.log_test("Maria Partner Verification", True, "Maria shows João as partner")
                else:
                    self.log_test("Maria Partner Verification", False, "Maria doesn't show correct partner", data)
            else:
                self.log_test("Maria Partner Verification", False, f"Request failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Maria Partner Verification", False, "Request failed", str(e))
        
        # Check João's updated info
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("partner_name") == "Maria Silva" and data.get("partner_id"):
                    self.log_test("João Partner Verification", True, "João shows Maria as partner")
                else:
                    self.log_test("João Partner Verification", False, "João doesn't show correct partner", data)
            else:
                self.log_test("João Partner Verification", False, f"Request failed with status {response.status_code}")
        except Exception as e:
            self.log_test("João Partner Verification", False, "Request failed", str(e))
    
    def test_love_messages(self):
        """Test love messages functionality"""
        print("\n=== Testing Love Messages ===")
        
        if not self.user1_token or not self.user2_token:
            self.log_test("Love Messages", False, "Prerequisites not met", "Missing user tokens")
            return
        
        # Maria sends a love message to João
        message_data = {
            "message": "Oi meu amor! Te amo muito! ❤️",
            "message_type": "message"
        }
        
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        
        try:
            response = self.session.post(f"{BACKEND_URL}/love-messages", json=message_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == message_data["message"] and data.get("sender_name") == "Maria Silva":
                    self.log_test("Create Love Message", True, "Love message created successfully")
                    
                    # Test retrieving messages
                    self.test_get_love_messages()
                else:
                    self.log_test("Create Love Message", False, "Unexpected response", data)
            else:
                self.log_test(
                    "Create Love Message", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Create Love Message", False, "Request failed", str(e))
    
    def test_get_love_messages(self):
        """Test retrieving love messages"""
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/love-messages", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Get Love Messages", True, f"Retrieved {len(data)} love messages")
                else:
                    self.log_test("Get Love Messages", False, "No messages found", data)
            else:
                self.log_test(
                    "Get Love Messages", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Get Love Messages", False, "Request failed", str(e))
    
    def test_events(self):
        """Test events functionality"""
        print("\n=== Testing Events ===")
        
        if not self.user1_token:
            self.log_test("Events", False, "Prerequisites not met", "Missing user token")
            return
        
        # Create an event
        event_data = {
            "title": "Jantar Romântico",
            "description": "Jantar especial no nosso restaurante favorito",
            "event_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "event_type": "date",
            "is_reminder": True
        }
        
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        
        try:
            response = self.session.post(f"{BACKEND_URL}/events", json=event_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("title") == event_data["title"] and data.get("created_by_name") == "Maria Silva":
                    self.log_test("Create Event", True, "Event created successfully")
                    
                    # Test retrieving events
                    self.test_get_events()
                else:
                    self.log_test("Create Event", False, "Unexpected response", data)
            else:
                self.log_test(
                    "Create Event", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Create Event", False, "Request failed", str(e))
    
    def test_get_events(self):
        """Test retrieving events"""
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/events", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Get Events", True, f"Retrieved {len(data)} events")
                else:
                    self.log_test("Get Events", False, "No events found", data)
            else:
                self.log_test(
                    "Get Events", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Get Events", False, "Request failed", str(e))
    
    def test_diary_entries(self):
        """Test diary entries functionality"""
        print("\n=== Testing Diary Entries ===")
        
        if not self.user2_token:
            self.log_test("Diary Entries", False, "Prerequisites not met", "Missing user token")
            return
        
        # Create a diary entry
        entry_data = {
            "title": "Nosso Primeiro Encontro",
            "content": "Hoje foi um dia muito especial! Tivemos nosso primeiro encontro e foi perfeito. Conversamos por horas e senti uma conexão incrível. Mal posso esperar para ver você novamente!",
            "mood": "romantic",
            "location": "Café Central"
        }
        
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        
        try:
            response = self.session.post(f"{BACKEND_URL}/diary-entries", json=entry_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("title") == entry_data["title"] and data.get("created_by_name") == "João Santos":
                    self.log_test("Create Diary Entry", True, "Diary entry created successfully")
                    
                    # Test retrieving entries
                    self.test_get_diary_entries()
                else:
                    self.log_test("Create Diary Entry", False, "Unexpected response", data)
            else:
                self.log_test(
                    "Create Diary Entry", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Create Diary Entry", False, "Request failed", str(e))
    
    def test_get_diary_entries(self):
        """Test retrieving diary entries"""
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/diary-entries", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Get Diary Entries", True, f"Retrieved {len(data)} diary entries")
                else:
                    self.log_test("Get Diary Entries", False, "No diary entries found", data)
            else:
                self.log_test(
                    "Get Diary Entries", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Get Diary Entries", False, "Request failed", str(e))
    
    def test_spiritual_content(self):
        """Test spiritual content functionality"""
        print("\n=== Testing Spiritual Content ===")
        
        if not self.user1_token:
            self.log_test("Spiritual Content", False, "Prerequisites not met", "Missing user token")
            return
        
        # Create spiritual content
        content_data = {
            "content_type": "prayer",
            "title": "Oração pela Nossa Relação",
            "content": "Senhor, abençoe nossa relação e nos ajude a crescer juntos em amor e fé. Que possamos sempre nos apoiar e caminhar unidos em Teus caminhos.",
            "bible_verse": "O amor é paciente, o amor é bondoso...",
            "bible_reference": "1 Coríntios 13:4"
        }
        
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        
        try:
            response = self.session.post(f"{BACKEND_URL}/spiritual-content", json=content_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("title") == content_data["title"] and data.get("created_by_name") == "Maria Silva":
                    self.log_test("Create Spiritual Content", True, "Spiritual content created successfully")
                    
                    # Test retrieving content
                    self.test_get_spiritual_content()
                else:
                    self.log_test("Create Spiritual Content", False, "Unexpected response", data)
            else:
                self.log_test(
                    "Create Spiritual Content", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Create Spiritual Content", False, "Request failed", str(e))
    
    def test_get_spiritual_content(self):
        """Test retrieving spiritual content"""
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/spiritual-content", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Get Spiritual Content", True, f"Retrieved {len(data)} spiritual content items")
                else:
                    self.log_test("Get Spiritual Content", False, "No spiritual content found", data)
            else:
                self.log_test(
                    "Get Spiritual Content", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Get Spiritual Content", False, "Request failed", str(e))
    
    def test_duplicate_registration(self):
        """Test that duplicate email registration is prevented"""
        print("\n=== Testing Duplicate Registration Prevention ===")
        
        duplicate_user = {
            "name": "Maria Duplicate",
            "email": "maria.silva@teste.com",  # Same email as user 1
            "password": "outrasenha123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=duplicate_user)
            
            if response.status_code == 400:
                data = response.json()
                if "already registered" in data.get("detail", "").lower():
                    self.log_test("Duplicate Registration Prevention", True, "Duplicate email correctly rejected")
                else:
                    self.log_test("Duplicate Registration Prevention", False, "Wrong error message", data)
            else:
                self.log_test(
                    "Duplicate Registration Prevention", 
                    False, 
                    f"Expected 400 status, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Duplicate Registration Prevention", False, "Request failed", str(e))
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        print("\n=== Testing Invalid Login ===")
        
        invalid_login = {
            "email": "maria.silva@teste.com",
            "password": "senhaerrada123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=invalid_login)
            
            if response.status_code == 401:
                self.log_test("Invalid Login Prevention", True, "Invalid credentials correctly rejected")
            else:
                self.log_test(
                    "Invalid Login Prevention", 
                    False, 
                    f"Expected 401 status, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Invalid Login Prevention", False, "Request failed", str(e))
    
    def test_specific_registration_fix(self):
        """Test specific registration endpoint as requested for frontend fix confirmation"""
        print("\n=== Testing Specific Registration Fix ===")
        
        # Test with exact data as requested
        fix_user_data = {
            "name": "Teste Fix",
            "email": "teste.fix@exemplo.com",
            "password": "123456"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=fix_user_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ["access_token", "token_type", "user"]
                user_fields = ["id", "name", "email", "couple_code", "created_at"]
                
                missing_fields = [field for field in required_fields if field not in data]
                missing_user_fields = [field for field in user_fields if field not in data["user"]]
                
                if not missing_fields and not missing_user_fields:
                    token = data.get("access_token")
                    user = data.get("user")
                    
                    if token and user["name"] == "Teste Fix" and user["email"] == "teste.fix@exemplo.com":
                        self.log_test(
                            "Specific Registration Fix Test", 
                            True, 
                            f"✅ CONFIRMADO: Endpoint /api/auth/register funcionando PERFEITAMENTE. Status 200, token JWT gerado, usuário criado com sucesso. Código do casal: {user['couple_code']}"
                        )
                        
                        # Test immediate login to confirm token works
                        self.test_immediate_login_after_registration(fix_user_data["email"], fix_user_data["password"])
                    else:
                        self.log_test(
                            "Specific Registration Fix Test", 
                            False, 
                            "Response data incorrect",
                            f"Expected name: Teste Fix, got: {user.get('name')}. Expected email: teste.fix@exemplo.com, got: {user.get('email')}"
                        )
                else:
                    self.log_test(
                        "Specific Registration Fix Test", 
                        False, 
                        "Response missing required fields",
                        f"Missing: {missing_fields + missing_user_fields}"
                    )
            else:
                self.log_test(
                    "Specific Registration Fix Test", 
                    False, 
                    f"❌ FALHA: Registration failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Specific Registration Fix Test", False, "❌ FALHA: Request failed", str(e))
    
    def test_immediate_login_after_registration(self, email, password):
        """Test login immediately after registration to confirm everything works"""
        login_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                user = data.get("user")
                
                if token and user and user["email"] == email:
                    self.log_test(
                        "Immediate Login After Registration", 
                        True, 
                        "✅ CONFIRMADO: Login imediato após registro funcionando perfeitamente"
                    )
                else:
                    self.log_test("Immediate Login After Registration", False, "Invalid response data", data)
            else:
                self.log_test(
                    "Immediate Login After Registration", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Immediate Login After Registration", False, "Request failed", str(e))
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Nosso Diário Backend Tests")
        print(f"Testing against: {BACKEND_URL}")
        print("=" * 50)
        
        # Run tests in sequence
        self.test_user_registration()
        self.test_user_login()
        self.test_get_user_info()
        self.test_couple_connection()
        
        # Test main functionalities
        self.test_love_messages()
        self.test_events()
        self.test_diary_entries()
        self.test_spiritual_content()
        
        # Test edge cases
        self.test_duplicate_registration()
        self.test_invalid_login()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("🏁 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 50)
        
        # Return success status
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)