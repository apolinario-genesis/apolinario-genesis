#!/usr/bin/env python3
"""
Backend Test Suite for Sacred Bond - Couples App
Tests authentication and couple connection functionality
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://sacredbond.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.user1_token = None
        self.user2_token = None
        self.user1_data = None
        self.user2_data = None
        self.test_results = []
        
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
        
        # Test User 1 (João)
        user1_data = {
            "name": "João Silva",
            "email": "joao.silva@gmail.com",
            "password": "MinhaSenh@123"
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
                        f"João registered successfully with couple code: {self.user1_data['couple_code']}"
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
        
        # Test User 2 (Maria)
        user2_data = {
            "name": "Maria Santos",
            "email": "maria.santos@gmail.com", 
            "password": "MinhaSenh@456"
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
                    f"Maria registered successfully with couple code: {self.user2_data['couple_code']}"
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
        
        # Test João login
        login_data = {
            "email": "joao.silva@gmail.com",
            "password": "MinhaSenh@123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                user = data.get("user")
                
                if token and user and user["name"] == "João Silva":
                    self.log_test("João Login", True, "Login successful")
                    # Update token in case it changed
                    self.user1_token = token
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
        
        # Test Maria login
        login_data = {
            "email": "maria.santos@sacredbond.test",
            "password": "MinhaSenh@456"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                user = data.get("user")
                
                if token and user and user["name"] == "Maria Santos":
                    self.log_test("Maria Login", True, "Login successful")
                    # Update token in case it changed
                    self.user2_token = token
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
    
    def test_get_user_info(self):
        """Test get current user endpoint"""
        print("\n=== Testing Get User Info ===")
        
        # Test João's info
        if self.user1_token:
            headers = {"Authorization": f"Bearer {self.user1_token}"}
            try:
                response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data["name"] == "João Silva" and data["email"] == "joao.silva@sacredbond.test":
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
        
        # Test Maria's info
        if self.user2_token:
            headers = {"Authorization": f"Bearer {self.user2_token}"}
            try:
                response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data["name"] == "Maria Santos" and data["email"] == "maria.santos@sacredbond.test":
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
    
    def test_couple_connection(self):
        """Test couple connection functionality"""
        print("\n=== Testing Couple Connection ===")
        
        if not self.user1_token or not self.user2_token or not self.user1_data or not self.user2_data:
            self.log_test("Couple Connection", False, "Prerequisites not met", "Missing user tokens or data")
            return
        
        # Maria connects to João using his couple code
        couple_data = {
            "couple_code": self.user1_data["couple_code"]
        }
        
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/join-couple", json=couple_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "Successfully connected" in data.get("message", "") and data.get("partner_name") == "João Silva":
                    self.log_test("Couple Connection", True, "Maria successfully connected to João")
                    
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
        
        # Check João's updated info
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("partner_name") == "Maria Santos" and data.get("partner_id"):
                    self.log_test("João Partner Verification", True, "João shows Maria as partner")
                else:
                    self.log_test("João Partner Verification", False, "João doesn't show correct partner", data)
            else:
                self.log_test("João Partner Verification", False, f"Request failed with status {response.status_code}")
        except Exception as e:
            self.log_test("João Partner Verification", False, "Request failed", str(e))
        
        # Check Maria's updated info
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("partner_name") == "João Silva" and data.get("partner_id"):
                    self.log_test("Maria Partner Verification", True, "Maria shows João as partner")
                else:
                    self.log_test("Maria Partner Verification", False, "Maria doesn't show correct partner", data)
            else:
                self.log_test("Maria Partner Verification", False, f"Request failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Maria Partner Verification", False, "Request failed", str(e))
    
    def test_duplicate_registration(self):
        """Test that duplicate email registration is prevented"""
        print("\n=== Testing Duplicate Registration Prevention ===")
        
        duplicate_user = {
            "name": "João Duplicate",
            "email": "joao.silva@sacredbond.test",  # Same email as user 1
            "password": "OutraSenh@789"
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
            "email": "joao.silva@sacredbond.test",
            "password": "SenhaErrada123"
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
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Sacred Bond Backend Tests")
        print(f"Testing against: {BACKEND_URL}")
        print("=" * 50)
        
        # Run tests in sequence
        self.test_user_registration()
        self.test_user_login()
        self.test_get_user_info()
        self.test_couple_connection()
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