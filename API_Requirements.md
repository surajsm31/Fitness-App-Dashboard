# Fitness App Dashboard - API Requirements

## Overview
This document outlines the REST APIs required for the Fitness App Dashboard. All APIs should return JSON responses and follow RESTful conventions.

## Base URL
```
https://api.fitnessapp.com/v1
```

## Authentication
All API endpoints require authentication using Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

## User Profile APIs

### Get User Profile
```http
GET /user/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "avatar": "https://example.com/avatars/user123.jpg",
    "age": 28,
    "gender": "male",
    "height": 175, // cm
    "weight": 70, // kg
    "goal": "weight_loss", // weight_loss, muscle_gain, maintenance
    "activity_level": "moderate", // sedentary, light, moderate, active, very_active
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Update User Profile
```http
PUT /user/profile
```

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 28,
  "gender": "male",
  "height": 175,
  "weight": 70,
  "goal": "weight_loss",
  "activity_level": "moderate"
}
```

---

## Dashboard Summary APIs

### Get Today's Summary
```http
GET /dashboard/today
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "steps": {
      "count": 8432,
      "goal": 10000,
      "percentage": 84.32
    },
    "calories": {
      "burned": 420,
      "consumed": 1850,
      "goal": 2000,
      "percentage": 21.0
    },
    "workout": {
      "duration_minutes": 45,
      "calories_burned": 280,
      "type": "cardio"
    },
    "water": {
      "intake_ml": 2100,
      "goal_ml": 3000,
      "percentage": 70.0
    },
    "bmi": {
      "value": 22.9,
      "category": "normal",
      "trend": "stable" // increasing, decreasing, stable
    }
  }
}
```

---

## Activity Tracking APIs

### Get Steps Data
```http
GET /activities/steps?period=7d&start_date=2024-01-09&end_date=2024-01-15
```

**Query Parameters:**
- `period`: `1d`, `7d`, `30d`, `90d`, `1y`
- `start_date`: ISO date string (optional)
- `end_date`: ISO date string (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "daily_steps": [
      {
        "date": "2024-01-09",
        "steps": 12034,
        "goal": 10000
      },
      {
        "date": "2024-01-10",
        "steps": 8432,
        "goal": 10000
      }
      // ... more days
    ],
    "total_steps": 68234,
    "average_steps": 9748,
    "goal_achievement_days": 5
  }
}
```

### Get Calories Data
```http
GET /activities/calories?period=7d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "daily_calories": [
      {
        "date": "2024-01-09",
        "burned": 450,
        "consumed": 1920,
        "net": -1470
      }
      // ... more days
    ],
    "total_burned": 3150,
    "total_consumed": 13440,
    "average_burned": 450,
    "average_consumed": 1920
  }
}
```

### Get Weight Progress
```http
GET /activities/weight?period=30d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "weight_records": [
      {
        "date": "2024-01-09",
        "weight": 70.5,
        "body_fat_percentage": 18.2
      }
      // ... more records
    ],
    "starting_weight": 72.0,
    "current_weight": 70.5,
    "weight_change": -1.5,
    "trend": "decreasing"
  }
}
```

---

## Workout APIs

### Get Workout Sessions
```http
GET /workouts?period=7d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workouts": [
      {
        "id": "workout123",
        "date": "2024-01-15",
        "type": "cardio", // cardio, strength, flexibility, sports
        "name": "Morning Run",
        "duration_minutes": 30,
        "calories_burned": 280,
        "intensity": "moderate", // low, moderate, high
        "exercises": [
          {
            "name": "Running",
            "sets": 1,
            "reps": null,
            "duration_minutes": 30,
            "weight_kg": null
          }
        ]
      }
    ],
    "total_workouts": 4,
    "total_duration": 145,
    "total_calories": 892
  }
}
```

### Create Workout Session
```http
POST /workouts
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "type": "strength",
  "name": "Upper Body Workout",
  "duration_minutes": 45,
  "exercises": [
    {
      "name": "Bench Press",
      "sets": 3,
      "reps": 12,
      "weight_kg": 60
    }
  ]
}
```

---

## Nutrition APIs

### Get Nutrition Data
```http
GET /nutrition?date=2024-01-15
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "meals": [
      {
        "id": "meal123",
        "type": "breakfast", // breakfast, lunch, dinner, snack
        "name": "Oatmeal with Fruits",
        "calories": 320,
        "macros": {
          "protein_g": 12,
          "carbs_g": 45,
          "fat_g": 8,
          "fiber_g": 6
        },
        "time": "08:30"
      }
    ],
    "total_calories": 1850,
    "total_macros": {
      "protein_g": 85,
      "carbs_g": 220,
      "fat_g": 65,
      "fiber_g": 25
    }
  }
}
```

### Log Meal
```http
POST /nutrition/meals
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "type": "lunch",
  "name": "Grilled Chicken Salad",
  "calories": 450,
  "macros": {
    "protein_g": 35,
    "carbs_g": 25,
    "fat_g": 18,
    "fiber_g": 8
  }
}
```

---

## Water Intake APIs

### Get Water Intake
```http
GET /hydration?date=2024-01-15
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "intake_ml": 2100,
    "goal_ml": 3000,
    "entries": [
      {
        "time": "08:00",
        "amount_ml": 250
      },
      {
        "time": "10:30",
        "amount_ml": 500
      }
    ]
  }
}
```

### Log Water Intake
```http
POST /hydration
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "amount_ml": 250,
  "time": "14:30"
}
```

---

## Goals APIs

### Get User Goals
```http
GET /goals
```

**Response:**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "goal123",
        "type": "daily_steps",
        "target": 10000,
        "current": 8432,
        "unit": "steps",
        "deadline": null
      },
      {
        "id": "goal124",
        "type": "weight_loss",
        "target": 68.0,
        "current": 70.5,
        "unit": "kg",
        "deadline": "2024-03-01"
      }
    ]
  }
}
```

### Update Goal
```http
PUT /goals/{goal_id}
```

**Request Body:**
```json
{
  "target": 12000,
  "deadline": "2024-02-01"
}
```

---

## Notifications APIs

### Get Notifications
```http
GET /notifications?limit=10&unread_only=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif123",
        "type": "achievement", // achievement, reminder, tip, alert
        "title": "Daily Goal Achieved!",
        "message": "You've reached your step goal for today!",
        "read": false,
        "created_at": "2024-01-15T18:30:00Z"
      }
    ],
    "unread_count": 3
  }
}
```

### Mark Notification as Read
```http
PUT /notifications/{notification_id}/read
```

---

## Error Response Format

All API errors should follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "age",
      "issue": "Age must be between 18 and 100"
    }
  }
}
```

### Common Error Codes:
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - User doesn't have permission
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting
- **Standard endpoints**: 100 requests per minute
- **Data-intensive endpoints**: 20 requests per minute
- **Authentication endpoints**: 5 requests per minute

---

## Pagination
For list endpoints, use cursor-based pagination:

```http
GET /workouts?limit=20&cursor=next_page_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "next_cursor": "abc123",
      "has_more": true,
      "total_count": 150
    }
  }
}
```

---

## Data Caching
- **User profile**: 5 minutes
- **Today's summary**: 1 minute
- **Historical data**: 30 minutes
- **Goals**: 10 minutes

---

## Webhooks (Optional)
For real-time updates:

### Workout Completed
```json
{
  "event": "workout.completed",
  "user_id": "user123",
  "data": {
    "workout_id": "workout123",
    "date": "2024-01-15",
    "calories_burned": 280
  }
}
```

### Goal Achieved
```json
{
  "event": "goal.achieved",
  "user_id": "user123",
  "data": {
    "goal_id": "goal123",
    "goal_type": "daily_steps",
    "achieved_at": "2024-01-15T18:30:00Z"
  }
}
```

---

## Implementation Priority

### Phase 1 (Core Features)
1. User Profile APIs
2. Today's Summary API
3. Steps & Calories APIs
4. Basic Workout APIs

### Phase 2 (Enhanced Features)
1. Weight Progress API
2. Nutrition APIs
3. Water Intake APIs
4. Goals APIs

### Phase 3 (Advanced Features)
1. Notifications API
2. Webhooks
3. Advanced Analytics
4. Social Features

---

## Testing Requirements
- Provide sandbox environment for testing
- Include test data fixtures for development
- API documentation with Swagger/OpenAPI
- Postman collection for all endpoints
