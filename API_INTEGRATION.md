# API Integration Documentation

## Overview
The Fitness App Dashboard has been integrated with the login API at `http://0.0.0.0:9000/api/admin`.

## API Configuration

### Base URL
- **Base URL**: `http://0.0.0.0:9000/api/admin`
- **Login Endpoint**: `/login`
- **Full Login URL**: `http://0.0.0.0:9000/api/admin/login`

## Implementation Details

### 1. API Service (`src/services/api.js`)
- Created axios instance with base URL configuration
- Added request/response interceptors for token management
- Implemented automatic token storage in localStorage
- Added error handling for 401 unauthorized responses

### 2. Authentication Functions
- `authAPI.login(email, password)` - Handles login requests
- `authAPI.logout()` - Clears authentication data
- `authAPI.getToken()` - Retrieves stored token
- `authAPI.getUser()` - Retrieves stored user data
- `authAPI.isAuthenticated()` - Checks authentication status

### 3. Updated Components
- **App.jsx**: Integrated real API authentication, added error handling
- **Login.jsx**: Updated to handle API calls and display error messages

## Usage

### Login Flow
1. User enters credentials in login form
2. Form submits to `authAPI.login()`
3. API call made to `http://0.0.0.0:9000/api/admin/login`
4. On success, token and user data stored in localStorage
5. User redirected to dashboard

### Token Management
- Tokens automatically stored in localStorage on successful login
- Tokens automatically included in API request headers
- Tokens cleared on logout or 401 responses

## Error Handling
- Network errors displayed to user
- Invalid credentials show appropriate error messages
- 401 responses automatically clear tokens and redirect to login

## Testing
A test utility is available at `src/utils/apiTest.js` with functions:
- `testLoginAPI()` - Test login functionality
- `testAuthStatus()` - Check current authentication status

## Dependencies
- `axios` - HTTP client library (added to package.json)

## Notes
- The frontend remains unchanged in terms of UI/UX
- All existing functionality preserved
- API integration is seamless and transparent to users
