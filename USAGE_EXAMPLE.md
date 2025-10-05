# Updated Map Component Usage - Direct userId Tracking

## New Improved System

Now the Map component directly tracks users by their Firebase Auth `userId`, making it much simpler!

### How it works:
1. **User publishes location** → `user_locations/{userId}` in Firebase
2. **Map tracks specific users** → Pass array of `userIds` to track
3. **Real-time updates** → Automatic marker updates when users move

### Basic Usage

```jsx
import Map from '@/components/Map';

function MyComponent() {
    // Array of Firebase Auth user IDs you want to track
    const userIdsToTrack = [
        'firebase-auth-uid-1',
        'firebase-auth-uid-2', 
        'firebase-auth-uid-3'
    ];
    
    return (
        <Map
            trackUserIds={userIdsToTrack}
            publishCurrentUser={true}  // Publish my location too
            center={{ lat: 29.860, lng: 77.900 }}
            zoom={15}
            followUser={true}
        />
    );
}
```

### Advanced Usage

```jsx
import Map from '@/components/Map';
import { useFirebase } from '@/context/Firebase';

function TrackingComponent() {
    const { user } = useFirebase();
    const [selectedUsers, setSelectedUsers] = useState([
        'user-abc123',
        'user-def456'
    ]);
    
    const handleAddUser = (userId) => {
        setSelectedUsers(prev => [...prev, userId]);
    };
    
    const handleRemoveUser = (userId) => {
        setSelectedUsers(prev => prev.filter(id => id !== userId));
    };
    
    return (
        <div>
            <div>
                <h3>My User ID: {user?.uid}</h3>
                <h3>Tracking: {selectedUsers.join(', ')}</h3>
                <button onClick={() => handleAddUser('new-user-id')}>
                    Add User to Track
                </button>
            </div>
            
            <Map
                trackUserIds={selectedUsers}
                publishCurrentUser={true}
                center={{ lat: 29.860, lng: 77.900 }}
                zoom={15}
                followUser={true}
            />
        </div>
    );
}
```

## What happens:

1. **Current User Publishing**: When `publishCurrentUser={true}`, your location gets saved to `user_locations/{your-firebase-uid}`
2. **Tracking Others**: Map listens to `user_locations/{userId}` for each user in `trackUserIds` array
3. **Real-time Updates**: Markers automatically update when users move
4. **Clean Display**: Each user gets a consistent color and their display name shows on marker

## Firebase Data Structure:

```json
{
  "user_locations": {
    "firebase-auth-uid-1": {
      "lat": 29.860,
      "lng": 77.900,
      "displayName": "John Doe",
      "userId": "firebase-auth-uid-1",
      "status": "online",
      "lastUpdate": 1696536000000,
      "heartbeat": 1696536000000,
      "deviceName": "iPhone"
    },
    "firebase-auth-uid-2": {
      "lat": 29.865,
      "lng": 77.905,
      "displayName": "Jane Smith", 
      "userId": "firebase-auth-uid-2",
      "status": "online",
      "lastUpdate": 1696536000000,
      "heartbeat": 1696536000000,
      "deviceName": "Android"
    }
  }
}
```

## Key Benefits:

✅ **Direct userId mapping** - No confusion between deviceId and userId
✅ **Automatic Firebase Auth integration** - Uses `user.uid` directly  
✅ **Simpler setup** - Just pass array of userIds to track
✅ **Real-time updates** - Instant marker updates when users move
✅ **Clean data structure** - One location per user, no device complexity
✅ **Display names** - Shows actual user names on markers

## Props:

- **`trackUserIds`**: Array of Firebase Auth user IDs to track on map
- **`publishCurrentUser`**: Boolean - publish current logged-in user's location
- **`additionalMarkers`**: Static markers (still works)
- **`enableRealTimeTracking`**: Legacy device-based tracking (deprecated)

## How to get Firebase user IDs:

```jsx
import { useFirebase } from '@/context/Firebase';

function GetUserIds() {
    const { user } = useFirebase();
    
    console.log('My user ID:', user?.uid);
    
    // You can get other user IDs from:
    // - Your database/API
    // - Firebase Firestore user collection
    // - Manual input
    // - Friends/contacts system
    
    return (
        <div>Current user: {user?.uid}</div>
    );
}
```