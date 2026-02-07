# API Endpoints Documentation

## Security & Authentication

### Overview

All API endpoints require proper authentication and follow these security measures:

- **JWT Authentication**: Token-based authentication using JWT (JSON Web Tokens)
- **Password Security**: Passwords hashed with bcrypt (cost factor: 10)
- **Token Validation**: Required on every authenticated request
- **Input Validation**: All inputs validated and sanitized before processing
- **Rate Limiting**: Applied to all endpoints (15 minutes, 100 requests per IP)
- **Strict Auth Rate Limiting**: Authentication endpoints limited to 10 attempts per hour

### Authentication Headers

All protected endpoints require the following header:

```
Authorization: Bearer <jwt_token>
```

### Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 10 attempts per hour per IP (login/register)

### Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Server Information

### Welcome Route

**GET** `/`

Returns general API information and available endpoints.

**Response:**
```json
{
  "success": true,
  "message": "🎲 Welcome to Tabletop Mastering API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "groups": "/api/groups",
    "games": "/api/games",
    "matches": "/api/matches"
  }
}
```

### API Information Route

**GET** `/api`

Returns the same information as the welcome route.

### Health Check

**GET** `/health`

Checks if the server is running correctly without requiring authentication.

**Response:**
```json
{
  "success": true,
  "message": "Server running correctly",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Metrics

**GET** `/metrics`

Returns Prometheus metrics for monitoring (requires Prometheus setup).

---

## Authentication Endpoints

**Base URL:** `/api/auth`

All endpoints in this section are prefixed with `/api/auth`.

### Register User

**POST** `/register`

Creates a new user account.

**Authentication:** Not required (public)

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "nickname": "johndoe"
  }
}
```

### Login

**POST** `/login`

Authenticates a user and returns a JWT token.

**Authentication:** Not required (public)

**Body:**
```json
{
  "identifier": "john@example.com or johndoe",
  "password": "securePassword123"
}
```

**Validation:**
- `identifier`: Required, email or nickname, minimum 3 characters
- `password`: Required

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "nickname": "johndoe"
  }
}
```

### Check Nickname Availability

**POST** `/check-nickname`

Checks if a nickname is already taken.

**Authentication:** Not required (public)

**Body:**
```json
{
  "nickname": "johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "available": true
}
```

### Check Email Availability

**POST** `/check-email`

Checks if an email is already registered.

**Authentication:** Not required (public)

**Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "available": false
}
```

### Get Current User Profile

**GET** `/me`

Retrieves the authenticated user's profile information.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "nickname": "johndoe",
    "avatar": "https://example.com/avatar.jpg",
    "description": "Board game enthusiast",
    "quote": "The best games are shared with friends",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Update User Profile

**PUT** `/profile`

Updates the authenticated user's profile information.

**Authentication:** Required (JWT token)

**Body:**
```json
{
  "name": "John Smith",
  "avatar": "https://example.com/new-avatar.jpg or data:image/png;base64,...",
  "description": "Competitive board game player",
  "quote": "One more game!"
}
```

**Validation:**
- `name`: Optional, 2-50 characters
- `avatar`: Optional, URL or base64 image
- `description`: Optional, maximum 500 characters
- `quote`: Optional, maximum 200 characters

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@example.com",
    "nickname": "johndoe",
    "avatar": "https://example.com/new-avatar.jpg",
    "description": "Competitive board game player",
    "quote": "One more game!"
  }
}
```

### Export User Data (GDPR)

**GET** `/export-data`

Exports all user data in JSON format for GDPR compliance.

**Authentication:** Required (JWT token)

**Response:** JSON file containing all user's data

### Delete Account

**DELETE** `/delete-account`

Permanently deletes the user account and all associated data.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## Group Endpoints

**Base URL:** `/api/groups`

All endpoints in this section are prefixed with `/api/groups`.

### Get Group Public Info

**GET** `/public/:id`

Retrieves public information about a group without requiring membership.

**Authentication:** Not required (public)

**Parameters:**
- `id` (path): Group ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "group": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Sunday Game Club",
    "description": "Weekly board game sessions",
    "avatar": "https://example.com/group.jpg",
    "memberCount": 8,
    "settings": {
      "isPrivate": false
    }
  }
}
```

### Create Group

**POST** `/`

Creates a new gaming group.

**Authentication:** Required (JWT token)

**Body:**
```json
{
  "name": "Sunday Game Club",
  "description": "Weekly board game sessions",
  "avatar": "https://example.com/group.jpg or base64..."
}
```

**Validation:**
- `name`: Required, 3-50 characters
- `description`: Optional, maximum 500 characters
- `avatar`: Optional

**Response:**
```json
{
  "success": true,
  "message": "Group created successfully",
  "group": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Sunday Game Club",
    "description": "Weekly board game sessions",
    "avatar": "https://example.com/group.jpg",
    "owner": "506f1f77bcf86cd799439010",
    "inviteCode": "ABC12XYZ",
    "members": ["506f1f77bcf86cd799439010"],
    "settings": {
      "isPrivate": false,
      "maxMembers": 50,
      "requireApproval": false
    },
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Get My Groups

**GET** `/`

Lists all groups the authenticated user is a member of.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "success": true,
  "groups": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Sunday Game Club",
      "description": "Weekly board game sessions",
      "avatar": "https://example.com/group.jpg",
      "memberCount": 8,
      "role": "admin"
    }
  ]
}
```

### Join Group

**POST** `/join`

Joins an existing group using an invite code.

**Authentication:** Required (JWT token)

**Body:**
```json
{
  "inviteCode": "ABC12XYZ"
}
```

**Validation:**
- `inviteCode`: Required, exactly 8 alphanumeric characters

**Response:**
```json
{
  "success": true,
  "message": "Joined group successfully",
  "group": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Sunday Game Club"
  }
}
```

### Get Group Details

**GET** `/:id`

Retrieves detailed information about a group (requires membership).

**Authentication:** Required (JWT token)  
**Authorization:** Must be a member of the group

**Parameters:**
- `id` (path): Group ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "group": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Sunday Game Club",
    "description": "Weekly board game sessions",
    "avatar": "https://example.com/group.jpg",
    "owner": "506f1f77bcf86cd799439010",
    "inviteCode": "ABC12XYZ",
    "members": [
      {
        "id": "506f1f77bcf86cd799439010",
        "name": "John Doe",
        "nickname": "johndoe",
        "role": "admin"
      }
    ],
    "settings": {
      "isPrivate": false,
      "maxMembers": 50,
      "requireApproval": false
    },
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Get Group Members

**GET** `/:id/members`

Lists all members of a group.

**Authentication:** Required (JWT token)  
**Authorization:** Must be a member of the group

**Parameters:**
- `id` (path): Group ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "members": [
    {
      "id": "506f1f77bcf86cd799439010",
      "name": "John Doe",
      "nickname": "johndoe",
      "avatar": "https://example.com/avatar.jpg",
      "role": "admin",
      "joinedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### Update Group

**PUT** `/:id`

Updates group information.

**Authentication:** Required (JWT token)  
**Authorization:** Must be group admin

**Parameters:**
- `id` (path): Group ID (MongoDB ObjectId)

**Body:**
```json
{
  "name": "Sunday Game Masters",
  "description": "Weekly competitive board games",
  "avatar": "https://example.com/new-group.jpg",
  "settings": {
    "isPrivate": false,
    "maxMembers": 100,
    "requireApproval": true
  }
}
```

**Validation:**
- `name`: Optional, 3-50 characters
- `description`: Optional, maximum 500 characters
- `avatar`: Optional
- `settings.isPrivate`: Optional, boolean
- `settings.maxMembers`: Optional, integer 2-100
- `settings.requireApproval`: Optional, boolean

**Response:**
```json
{
  "success": true,
  "message": "Group updated successfully",
  "group": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Sunday Game Masters"
  }
}
```

### Regenerate Invite Code

**PUT** `/:id/invite-code`

Generates a new invite code for the group.

**Authentication:** Required (JWT token)  
**Authorization:** Must be group admin

**Parameters:**
- `id` (path): Group ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Invite code regenerated",
  "inviteCode": "XYZ98ABC"
}
```

### Invite User to Group

**POST** `/:id/invite`

Sends an invitation to a user to join the group.

**Authentication:** Required (JWT token)  
**Authorization:** Must be group admin

**Parameters:**
- `id` (path): Group ID (MongoDB ObjectId)

**Body:**
```json
{
  "email": "friend@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

### Remove Group Member

**DELETE** `/:id/members/:userId`

Removes a member from the group.

**Authentication:** Required (JWT token)  
**Authorization:** Must be group admin

**Parameters:**
- `id` (path): Group ID (MongoDB ObjectId)
- `userId` (path): User ID to remove (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

### Leave Group

**DELETE** `/:id/leave`

Leaves the group as the authenticated user.

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Group ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Left group successfully"
}
```

### Delete Group

**DELETE** `/:id`

Permanently deletes a group and all its data.

**Authentication:** Required (JWT token)  
**Authorization:** Must be group owner/admin

**Parameters:**
- `id` (path): Group ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Group deleted successfully"
}
```

---

## Game Endpoints

**Base URL:** `/api/games`

All endpoints in this section are prefixed with `/api/games`.

### Search BoardGameGeek

**GET** `/search-bgg`

Searches for games in the BoardGameGeek catalog.

**Authentication:** Required (JWT token)

**Query Parameters:**
- `query` (string): Game name to search for
- `limit` (number, optional): Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": 13,
      "name": "Carcassonne",
      "yearPublished": 2000,
      "image": "https://example.com/carcassonne.jpg",
      "description": "Tile-laying game...",
      "minPlayers": 2,
      "maxPlayers": 5,
      "playingTime": 45
    }
  ]
}
```

### Get BGG Game Details

**GET** `/bgg/:bggId`

Retrieves detailed information about a specific game from BoardGameGeek.

**Authentication:** Required (JWT token)

**Parameters:**
- `bggId` (path): BoardGameGeek game ID

**Response:**
```json
{
  "success": true,
  "game": {
    "id": 13,
    "name": "Carcassonne",
    "yearPublished": 2000,
    "image": "https://example.com/carcassonne.jpg",
    "description": "Tile-laying game...",
    "minPlayers": 2,
    "maxPlayers": 5,
    "playingTime": 45,
    "designerNames": ["Klaus Teuber"],
    "publisherNames": ["Z-Man Games"]
  }
}
```

### Get Hot Games

**GET** `/bgg/hot`

Retrieves the currently trending games from BoardGameGeek.

**Authentication:** Required (JWT token)

**Query Parameters:**
- `limit` (number, optional): Number of hot games to return (default: 10)

**Response:**
```json
{
  "success": true,
  "hotGames": [
    {
      "id": 13,
      "name": "Carcassonne",
      "yearPublished": 2000,
      "image": "https://example.com/carcassonne.jpg"
    }
  ]
}
```

### Add Game from BoardGameGeek

**POST** `/add-from-bgg`

Adds a game from BoardGameGeek to the user's game collection.

**Authentication:** Required (JWT token)

**Body:**
```json
{
  "bggId": 13,
  "customName": "My Custom Carcassonne Name (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Game added successfully",
  "game": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Carcassonne",
    "bggId": 13,
    "image": "https://example.com/carcassonne.jpg",
    "minPlayers": 2,
    "maxPlayers": 5,
    "playingTime": 45
  }
}
```

### Create Custom Game

**POST** `/`

Creates a custom game (not from BoardGameGeek).

**Authentication:** Required (JWT token)

**Body:**
```json
{
  "name": "Custom Board Game",
  "description": "A homemade game",
  "minPlayers": 2,
  "maxPlayers": 4,
  "playingTime": 60
}
```

**Response:**
```json
{
  "success": true,
  "message": "Game created successfully",
  "game": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Custom Board Game",
    "minPlayers": 2,
    "maxPlayers": 4,
    "playingTime": 60,
    "custom": true
  }
}
```

### Get Games

**GET** `/`

Lists games (filtered by group or user collection).

**Authentication:** Required (JWT token)

**Query Parameters:**
- `groupId` (string, optional): Filter by group ID
- `limit` (number, optional): Number of results per page
- `page` (number, optional): Page number

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Carcassonne",
      "bggId": 13,
      "image": "https://example.com/carcassonne.jpg",
      "minPlayers": 2,
      "maxPlayers": 5,
      "playingTime": 45
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### Get Game Details

**GET** `/:id`

Retrieves detailed information about a specific game.

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Game ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Carcassonne",
    "bggId": 13,
    "description": "Tile-laying game...",
    "image": "https://example.com/carcassonne.jpg",
    "minPlayers": 2,
    "maxPlayers": 5,
    "playingTime": 45,
    "designer": "Klaus Teuber",
    "publisher": "Z-Man Games",
    "yearPublished": 2000,
    "custom": false
  }
}
```

### Update Game

**PUT** `/:id`

Updates a game (custom fields only).

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Game ID (MongoDB ObjectId)

**Body:**
```json
{
  "name": "Carcassonne: New Edition",
  "description": "Updated description",
  "minPlayers": 2,
  "maxPlayers": 6,
  "playingTime": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Game updated successfully",
  "game": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Carcassonne: New Edition"
  }
}
```

### Sync Game with BoardGameGeek

**PUT** `/:id/sync-bgg`

Updates game information from BoardGameGeek (if it has a bggId).

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Game ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Game synchronized successfully",
  "game": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Carcassonne",
    "image": "https://example.com/carcassonne.jpg"
  }
}
```

### Upload Game Image

**POST** `/:id/upload-image`

Uploads a custom image for a game.

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Game ID (MongoDB ObjectId)

**Body:** Form data with `image` file
- Accepted formats: JPEG, PNG, WebP, GIF
- Maximum size: 5MB

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "game": {
    "id": "507f1f77bcf86cd799439011",
    "image": "/uploads/games/507f1f77bcf86cd799439011.jpg"
  }
}
```

### Delete Game

**DELETE** `/:id`

Deletes a game from the collection.

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Game ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Game deleted successfully"
}
```

### Get Group Game Statistics

**GET** `/stats/:groupId`

Retrieves game statistics for a specific group.

**Authentication:** Required (JWT token)

**Parameters:**
- `groupId` (path): Group ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalGames": 12,
    "mostPlayed": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Carcassonne",
      "playCount": 15
    },
    "averagePlayingTime": 45,
    "gamesWithMatches": 8
  }
}
```

### Cache Statistics

**GET** `/cache/stats`

Retrieves BGG cache statistics and performance metrics.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "success": true,
  "cache": {
    "totalCached": 42,
    "hitRate": 0.85,
    "lastCleaned": "2024-01-15T10:00:00.000Z"
  }
}
```

### Invalidate Game Cache

**DELETE** `/cache/:bggId`

Removes a specific game from the BGG cache.

**Authentication:** Required (JWT token)

**Parameters:**
- `bggId` (path): BoardGameGeek ID

**Response:**
```json
{
  "success": true,
  "message": "Cache invalidated"
}
```

### Clear All Cache

**DELETE** `/cache`

Clears the entire BGG cache.

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

---

## Match Endpoints

**Base URL:** `/api/matches`

All endpoints in this section are prefixed with `/api/matches`.

### Create Match

**POST** `/`

Creates a new match/game session.

**Authentication:** Required (JWT token)

**Body:**
```json
{
  "groupId": "507f1f77bcf86cd799439011",
  "gameId": "507f1f77bcf86cd799439012",
  "scheduledDate": "2024-01-20T15:00:00.000Z",
  "location": "Downtown Board Game Cafe",
  "notes": "Bring both game versions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Match created successfully",
  "match": {
    "id": "507f1f77bcf86cd799439013",
    "group": "507f1f77bcf86cd799439011",
    "game": "507f1f77bcf86cd799439012",
    "creator": "506f1f77bcf86cd799439010",
    "scheduledDate": "2024-01-20T15:00:00.000Z",
    "location": "Downtown Board Game Cafe",
    "status": "pending",
    "attendees": ["506f1f77bcf86cd799439010"],
    "results": null
  }
}
```

### Get Matches

**GET** `/`

Lists matches the authenticated user is involved in.

**Authentication:** Required (JWT token)

**Query Parameters:**
- `groupId` (string, optional): Filter by group ID
- `status` (string, optional): Filter by status (pending, finished, cancelled)
- `limit` (number, optional): Results per page
- `page` (number, optional): Page number

**Response:**
```json
{
  "success": true,
  "matches": [
    {
      "id": "507f1f77bcf86cd799439013",
      "game": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Carcassonne"
      },
      "group": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Sunday Game Club"
      },
      "scheduledDate": "2024-01-20T15:00:00.000Z",
      "location": "Downtown Board Game Cafe",
      "status": "pending",
      "attendeeCount": 4
    }
  ],
  "total": 12
}
```

### Get Match Details

**GET** `/:id`

Retrieves detailed information about a specific match.

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Match ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "match": {
    "id": "507f1f77bcf86cd799439013",
    "game": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Carcassonne",
      "minPlayers": 2,
      "maxPlayers": 5
    },
    "group": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Sunday Game Club"
    },
    "creator": {
      "id": "506f1f77bcf86cd799439010",
      "name": "John Doe"
    },
    "scheduledDate": "2024-01-20T15:00:00.000Z",
    "location": "Downtown Board Game Cafe",
    "notes": "Bring both game versions",
    "status": "pending",
    "attendees": [
      {
        "id": "506f1f77bcf86cd799439010",
        "name": "John Doe",
        "confirmed": true
      }
    ],
    "results": null
  }
}
```

### Update Match

**PUT** `/:id`

Updates match information (date, location, notes).

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Match ID (MongoDB ObjectId)

**Body:**
```json
{
  "scheduledDate": "2024-01-21T15:00:00.000Z",
  "location": "Updated Cafe Location",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Match updated successfully",
  "match": {
    "id": "507f1f77bcf86cd799439013",
    "scheduledDate": "2024-01-21T15:00:00.000Z",
    "location": "Updated Cafe Location"
  }
}
```

### Confirm Attendance

**POST** `/:id/confirm`

Confirms the authenticated user's attendance to a match.

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Match ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Attendance confirmed"
}
```

### Cancel Attendance

**DELETE** `/:id/confirm`

Cancels the authenticated user's attendance to a match.

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Match ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Attendance cancelled"
}
```

### Finish Match

**POST** `/:id/finish`

Marks a match as finished and records the results.

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Match ID (MongoDB ObjectId)

**Body:**
```json
{
  "results": [
    {
      "userId": "506f1f77bcf86cd799439010",
      "position": 1,
      "score": 85
    },
    {
      "userId": "506f1f77bcf86cd799439011",
      "position": 2,
      "score": 72
    }
  ],
  "notes": "Great game! Very competitive."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Match finished successfully",
  "match": {
    "id": "507f1f77bcf86cd799439013",
    "status": "finished",
    "results": [
      {
        "userId": "506f1f77bcf86cd799439010",
        "name": "John Doe",
        "position": 1,
        "score": 85,
        "pointsGained": 10
      }
    ]
  }
}
```

### Delete Match

**DELETE** `/:id`

Deletes a match (only by creator).

**Authentication:** Required (JWT token)

**Parameters:**
- `id` (path): Match ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Match deleted successfully"
}
```

### Get Global Ranking

**GET** `/ranking/global`

Retrieves the global ranking of all players based on match results.

**Authentication:** Required (JWT token)

**Query Parameters:**
- `limit` (number, optional): Number of players to return (default: 10)
- `page` (number, optional): Page number

**Response:**
```json
{
  "success": true,
  "ranking": [
    {
      "position": 1,
      "user": {
        "id": "506f1f77bcf86cd799439010",
        "name": "John Doe",
        "nickname": "johndoe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "wins": 12,
      "losses": 3,
      "totalMatches": 15,
      "winRate": 0.8,
      "totalPoints": 1250
    }
  ],
  "total": 42
}
```

### Get Group Ranking

**GET** `/ranking/group/:groupId`

Retrieves the ranking of players within a specific group.

**Authentication:** Required (JWT token)

**Parameters:**
- `groupId` (path): Group ID (MongoDB ObjectId)

**Query Parameters:**
- `limit` (number, optional): Number of players to return

**Response:**
```json
{
  "success": true,
  "ranking": [
    {
      "position": 1,
      "user": {
        "id": "506f1f77bcf86cd799439010",
        "name": "John Doe",
        "nickname": "johndoe"
      },
      "wins": 8,
      "losses": 2,
      "totalMatches": 10,
      "winRate": 0.8,
      "groupPoints": 800
    }
  ],
  "total": 8
}
```

---

## Common Error Responses

### Unauthorized (401)

```json
{
  "success": false,
  "message": "Unauthorized: Invalid or missing token"
}
```

### Forbidden (403)

```json
{
  "success": false,
  "message": "Forbidden: You do not have permission to access this resource"
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "Not found: The requested resource does not exist"
}
```

### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email"
    }
  ]
}
```

### Too Many Requests (429)

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again in 15 minutes"
}
```

---

## Testing Endpoints

You can test these endpoints using:

- **Postman**: Import the API collection
- **cURL**: Command-line HTTP client
- **Insomnia**: REST client alternative
- **Thunder Client**: VS Code extension
- **Frontend**: Use the integrated frontend application

### Example cURL Request

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

**Last Updated:** February 2024  
**API Version:** 1.0.0  
**Maintained by:** Tabletop Mastering Team
