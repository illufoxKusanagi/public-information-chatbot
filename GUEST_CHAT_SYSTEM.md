# Guest Chat System Implementation

## Overview
This system allows unauthorized users (guests) to use the chatbot while maintaining proper data management and security. Guest chats are automatically cleaned up after 24 hours to prevent database bloat.

## Key Features

### 1. Temporary Guest Chats
- **Duration**: 24 hours from creation
- **Storage**: Full database persistence during the active period
- **Identification**: UUID-based chat IDs, marked as guest chats in database
- **Access Control**: Anyone can access guest chats (no authentication required)

### 2. Database Schema Updates
New fields added to `conversations` table:
```sql
isGuestChat BOOLEAN DEFAULT false  -- Identifies guest vs user chats
guestSessionId TEXT                -- Unique identifier for guest sessions  
expiresAt TIMESTAMP                -- Automatic expiration timestamp
```

### 3. API Enhancements

#### Chat Creation (`/api/chat`)
- **Authenticated Users**: Creates permanent chats linked to user account
- **Guest Users**: Creates temporary chats with 24-hour expiration
- **Response**: Always returns `chatId` for both user types (enabling proper message display)

#### Chat Access (`/api/chat/[chatId]`)
- **User Chats**: Requires authentication and ownership verification
- **Guest Chats**: Public access, with expiration checking
- **Expired Chats**: Returns 410 Gone status

### 4. Frontend Updates

#### Message Display Fix
- **Previous Issue**: Guest users' messages weren't appearing due to null `chatId`
- **Solution**: Modified `useChat` hook to always add user messages to state
- **Result**: Chat bubbles now appear for both authenticated and guest users

#### User Experience
- **Guest Notice**: Prominent warning about 24-hour auto-deletion
- **Chat Persistence**: Guest chats work exactly like user chats during active period
- **URL Routing**: Both user types get redirected to specific chat URLs

### 5. Cleanup System

#### Automatic Cleanup API (`/api/cleanup-guest-chats`)
- **DELETE**: Removes all expired guest chats and their messages
- **GET**: Health check endpoint
- **Process**: 
  1. Finds expired guest chats
  2. Deletes associated messages
  3. Deletes chat records
  4. Returns deletion count

#### Recommended Cron Job
```bash
# Run every hour to clean up expired guest chats
0 * * * * curl -X DELETE https://your-domain.com/api/cleanup-guest-chats
```

## Implementation Details

### Database Operations
```typescript
// Guest chat creation
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours

await db.insert(conversations).values({
  userId: null,                    // No user for guest chats
  title: title || "Guest Chat",
  isGuestChat: true,
  guestSessionId: uniqueSessionId,
  expiresAt: expiresAt,
  // ... other fields
});
```

### Security Considerations
- **Data Isolation**: Guest chats are separate from user chats
- **Access Control**: User chats remain protected by authentication
- **Resource Management**: Automatic cleanup prevents database bloat
- **No Persistence**: Guest data automatically expires

### Migration Requirements
Before deploying, run database migration to add new fields:
```bash
npm run db:generate  # Generate migration for schema changes
npm run db:migrate   # Apply migration to database
```

## Usage Flow

### Guest User Journey
1. **Visit Chat**: Access `/chat` without authentication
2. **See Notice**: Warning about 24-hour auto-deletion
3. **Send Message**: Create temporary chat automatically  
4. **Get Response**: Full chatbot functionality available
5. **Continue Chat**: Can continue conversation via URL with `chatId`
6. **Expiration**: Chat automatically deleted after 24 hours

### Authenticated User Journey
1. **Login**: Standard authentication flow
2. **Create Chat**: Permanent chat linked to account
3. **Chat History**: Full persistence and history access
4. **No Expiration**: Chats remain until manually deleted

## Benefits
- **Accessibility**: Anyone can use the chatbot immediately
- **Data Management**: Automatic cleanup prevents storage issues
- **Security**: User data remains protected
- **User Experience**: Seamless functionality for both user types
- **Scalability**: System handles guest traffic without impact on authenticated users

## Future Enhancements
- **Session Extension**: Allow users to convert guest chats to permanent
- **Rate Limiting**: IP-based limits for guest users
- **Analytics**: Track guest usage patterns
- **Cleanup Scheduling**: Built-in scheduled cleanup jobs