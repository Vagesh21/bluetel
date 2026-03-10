#!/usr/bin/env python3
"""
Backend API Testing for The Blues Hotel Collective
Tests all backend endpoints with proper authentication.
"""

import requests
import sys
import json
from datetime import datetime

class BluesHotelAPITester:
    def __init__(self, base_url="https://blues-hotel-rebuild.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}... ({method} {endpoint})")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}...")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except requests.exceptions.RequestException as e:
            self.log(f"❌ FAILED - {name} - Network Error: {str(e)}")
            self.failed_tests.append(f"{name}: Network error - {str(e)}")
            return False, {}
        except Exception as e:
            self.log(f"❌ FAILED - {name} - Error: {str(e)}")
            self.failed_tests.append(f"{name}: Error - {str(e)}")
            return False, {}

    def test_auth_login(self):
        """Test admin login and get token"""
        self.log("\n=== AUTHENTICATION TESTS ===")
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@theblueshotel.com.au", "password": "password"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log(f"✅ Token acquired: {self.token[:20]}...")
            return True
        else:
            self.log(f"❌ Failed to get auth token")
            return False

    def test_auth_me(self):
        """Test getting current user info"""
        if not self.token:
            self.log("❌ Skipping auth/me test - no token")
            return False
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        return success and 'email' in response

    def test_shows(self):
        """Test shows endpoints"""
        self.log("\n=== SHOWS TESTS ===")
        
        # Get all shows
        success, shows_data = self.run_test("Get All Shows", "GET", "shows", 200)
        if success and isinstance(shows_data, list):
            self.log(f"   Found {len(shows_data)} shows")
            if len(shows_data) >= 3:
                self.log("   ✅ Expected 3 shows found")
            else:
                self.log(f"   ⚠️ Expected 3 shows, found {len(shows_data)}")
        
        # Test individual show
        if shows_data and len(shows_data) > 0:
            slug = shows_data[0].get('slug', '')
            if slug:
                self.run_test(f"Get Show by Slug", "GET", f"shows/{slug}", 200)
        
        return success

    def test_episodes(self):
        """Test episodes endpoints"""
        self.log("\n=== EPISODES TESTS ===")
        
        # Get all episodes
        success, episodes_response = self.run_test("Get All Episodes", "GET", "episodes", 200)
        episodes = []
        if success and isinstance(episodes_response, dict) and 'episodes' in episodes_response:
            episodes = episodes_response['episodes']
            self.log(f"   Found {len(episodes)} episodes")
            if len(episodes) >= 3:
                self.log("   ✅ Expected 3 episodes found")
            else:
                self.log(f"   ⚠️ Expected 3 episodes, found {len(episodes)}")
        
        # Test individual episode
        if episodes and len(episodes) > 0:
            episode_id = episodes[0].get('id', '')
            if episode_id:
                self.run_test("Get Episode by ID", "GET", f"episodes/{episode_id}", 200)
        
        # Test episode with show filter
        self.run_test("Get Episodes by Show", "GET", "episodes?show_slug=the-blues-hotel", 200)
        
        return success

    def test_events(self):
        """Test events endpoints"""
        self.log("\n=== EVENTS TESTS ===")
        
        # Get all events
        success, events_data = self.run_test("Get All Events", "GET", "events", 200)
        if success and isinstance(events_data, list):
            self.log(f"   Found {len(events_data)} events")
            if len(events_data) >= 2:
                self.log("   ✅ Expected 2 events found")
            else:
                self.log(f"   ⚠️ Expected 2 events, found {len(events_data)}")
        
        # Test upcoming events
        self.run_test("Get Upcoming Events", "GET", "events?upcoming=true", 200)
        
        # Test individual event
        if events_data and len(events_data) > 0:
            event_id = events_data[0].get('id', '')
            if event_id:
                self.run_test("Get Event by ID", "GET", f"events/{event_id}", 200)
        
        return success

    def test_newsletter(self):
        """Test newsletter subscription"""
        self.log("\n=== NEWSLETTER TESTS ===")
        
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        success, _ = self.run_test(
            "Newsletter Subscribe",
            "POST",
            "newsletter/subscribe",
            200,
            data={
                "first_name": "Test", 
                "last_name": "User", 
                "email": test_email
            }
        )
        
        return success

    def test_contact(self):
        """Test contact form submission"""
        self.log("\n=== CONTACT TESTS ===")
        
        success, _ = self.run_test(
            "Contact Form Submit",
            "POST",
            "contact",
            200,
            data={
                "name": "Test User",
                "email": "test@test.com",
                "subject": "Test Message",
                "message": "This is a test message from the API tester."
            }
        )
        
        return success

    def test_community(self):
        """Test community submission endpoints"""
        self.log("\n=== COMMUNITY TESTS ===")
        
        # Test music submission
        success1, _ = self.run_test(
            "Submit Music",
            "POST",
            "community/submit-music",
            200,
            data={
                "name": "Test Artist",
                "artist_name": "Test Band",
                "email": "artist@test.com",
                "message": "Check out my blues track!"
            }
        )
        
        # Test story submission
        success2, _ = self.run_test(
            "Share Story",
            "POST",
            "community/share-story",
            200,
            data={
                "name": "Story Teller",
                "email": "storyteller@test.com",
                "message": "Here's my blues story..."
            }
        )
        
        return success1 and success2

    def test_admin_endpoints(self):
        """Test admin-only endpoints that require authentication"""
        if not self.token:
            self.log("\n❌ Skipping admin tests - no authentication token")
            return False
            
        self.log("\n=== ADMIN TESTS ===")
        
        # Test dashboard
        success1, dashboard = self.run_test("Admin Dashboard", "GET", "admin/dashboard", 200)
        if success1:
            self.log(f"   Dashboard stats: Episodes={dashboard.get('episodes_count', 0)}, Events={dashboard.get('events_count', 0)}")
        
        # Test settings
        success2, _ = self.run_test("Get Settings", "GET", "settings", 200)
        
        # Test public settings
        success3, _ = self.run_test("Get Public Settings", "GET", "settings/public", 200)
        
        # Test submissions (admin view)
        success4, _ = self.run_test("Get Submissions", "GET", "submissions", 200)
        
        return success1 and success2 and success3 and success4

    def test_public_endpoints(self):
        """Test endpoints that don't require authentication"""
        self.log("\n=== PUBLIC ENDPOINT TESTS ===")
        
        # Test pages
        success1, _ = self.run_test("Get Privacy Policy Page", "GET", "pages/privacy-policy", 200)
        success2, _ = self.run_test("Get Terms Page", "GET", "pages/terms-of-use", 200)
        
        return success1 and success2

    def run_all_tests(self):
        """Run the complete test suite"""
        self.log(f"🚀 Starting Blues Hotel Collective API Tests")
        self.log(f"   Base URL: {self.base_url}")
        self.log(f"   Time: {datetime.now().isoformat()}")
        
        # Run tests in order
        auth_success = self.test_auth_login()
        if auth_success:
            self.test_auth_me()
        
        self.test_shows()
        self.test_episodes()
        self.test_events()
        self.test_newsletter()
        self.test_contact()
        self.test_community()
        self.test_public_endpoints()
        
        if auth_success:
            self.test_admin_endpoints()
        
        # Print summary
        self.log(f"\n🎯 TEST SUMMARY")
        self.log(f"   Total tests run: {self.tests_run}")
        self.log(f"   Passed: {self.tests_passed}")
        self.log(f"   Failed: {len(self.failed_tests)}")
        self.log(f"   Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            self.log(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                self.log(f"   - {test}")
        
        return len(self.failed_tests) == 0

def main():
    """Main test runner"""
    tester = BluesHotelAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())