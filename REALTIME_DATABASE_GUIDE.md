# Firebase Realtime Database Integration Guide

## 🎉 New Features Added

Your Firebase authentication system now includes **Realtime Database integration** with automatic user management and role-based access control!

## 📊 Database Structure

```json
{
  "users": {
    "user_uid_here": {
      "uid": "user_uid_here",
      "email": "user@example.com",
      "displayName": "User Name",
      "photoURL": "https://profile-photo-url.com",
      "emailVerified": true,
      "role": "user",
      "createdAt": 1696204800000,
      "lastLogin": 1696204800000,
      "roleUpdatedAt": 1696204800000
    }
  }
}
```

## 🔑 User Roles

### Default Role Assignment
- **New users**: Automatically assigned `"user"` role
- **Role hierarchy**: `user` < `moderator` < `admin`

### Role Descriptions
- **`user`**: Default role with basic access
- **`moderator`**: Can moderate content and manage some users
- **`admin`**: Full access to all features and user management

## 🚀 New Context Features

### Enhanced Firebase Context
```jsx
const {
    // Database-enhanced user object
    user,                    // Includes role, createdAt, lastLogin
    userProfile,            // Full database profile object
    
    // Role checking
    isAdmin,                // Boolean: user role === 'admin'
    isModerator,            // Boolean: user role === 'moderator' || 'admin'
    
    // Database methods
    updateUserRole,         // Admin function to change user roles
    getUserById,            // Get any user's profile by UID
    getAllUsers,            // Admin function to get all users
    
    // Everything else from before...
    isAuthenticated,
    signInWithGoogle,
    logout,
    // etc.
} = useFirebase();
```

### Enhanced Custom Hook
```jsx
const {
    // Enhanced permission checking
    hasPermission,          // Check specific permissions
    canManageUsers,         // Check if user can manage others
    canModerate,            // Check if user can moderate content
    
    // All Firebase context methods included
    ...firebaseContext
} = useAuth();
```

## 🔒 Permission System

### Basic Permission Checking
```jsx
const { hasPermission } = useAuth();

// Check specific roles
const canAccessAdmin = hasPermission('admin');
const canModerate = hasPermission('moderator');
const isRegularUser = hasPermission('user');
```

### Component-Level Protection
```jsx
import { useFirebase } from '@/context/Firebase';

function AdminOnlyComponent() {
    const { isAdmin } = useFirebase();
    
    if (!isAdmin) {
        return <div>Access denied. Admin only.</div>;
    }
    
    return <div>Admin content here</div>;
}
```

### Route-Level Protection
```jsx
// Admin-only page
function AdminPage() {
    const { isAdmin } = useFirebase();
    
    if (!isAdmin) {
        return <AccessDenied />;
    }
    
    return <AdminPanel />;
}
```

## 🛠 User Management

### Admin User Management Component
```jsx
import UserManagement from '@/components/UserManagement';

function AdminPanel() {
    return (
        <div>
            <h1>Admin Panel</h1>
            <UserManagement />
        </div>
    );
}
```

### Programmatic Role Updates
```jsx
const { updateUserRole } = useFirebase();

const promoteToModerator = async (userId) => {
    try {
        await updateUserRole(userId, 'moderator');
        console.log('User promoted successfully!');
    } catch (error) {
        console.error('Failed to update role:', error);
    }
};
```

## 🔄 Automatic User Lifecycle

### What Happens When a User Signs In:

1. **Authentication**: User signs in with Google
2. **Database Check**: System checks if user exists in database
3. **Create/Update**: 
   - **New user**: Creates profile with default `"user"` role
   - **Existing user**: Updates `lastLogin` timestamp
4. **Real-time Sync**: User profile changes are automatically synced
5. **State Update**: React state updates with enhanced user object

### Profile Data Flow
```
Google Auth → Firebase Auth → Realtime Database → React Context → Components
     ↓              ↓               ↓                ↓            ↓
  User Signs In → Creates/Updates → Real-time Sync → State Update → UI Update
```

## 📱 New Components

### 1. UserManagement.jsx
- Admin-only component for managing all users
- Role assignment interface
- User statistics and filtering
- Real-time user list updates

### 2. Enhanced UserProfile.jsx
- Shows user role with color coding
- Displays creation date and last login
- Role-based styling and information

### 3. Admin Panel (/admin)
- Complete admin dashboard
- User management interface
- System statistics
- Role management tools

## 🔧 Firebase Console Setup

### Enable Realtime Database
1. Go to Firebase Console → Your Project
2. Navigate to "Realtime Database"
3. Click "Create Database"
4. Choose location and security rules
5. Set initial security rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('role').val() == 'admin')",
        ".write": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('role').val() == 'admin')",
        "role": {
          ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'"
        }
      }
    }
  }
}
```

### Security Rules Explanation
- **Read**: Users can read their own data; admins can read all data
- **Write**: Users can update their own data; admins can update all data
- **Role**: Only admins can change user roles

## 🎯 Usage Examples

### Check User Role in Component
```jsx
function MyComponent() {
    const { user, isAdmin, isModerator } = useFirebase();
    
    return (
        <div>
            <h2>Welcome, {user?.displayName}!</h2>
            <p>Your role: {user?.role}</p>
            
            {isAdmin && <AdminControls />}
            {isModerator && <ModeratorControls />}
            
            <UserContent />
        </div>
    );
}
```

### Conditional Navigation
```jsx
function Navigation() {
    const { isAuthenticated, isAdmin } = useFirebase();
    
    return (
        <nav>
            <Link href="/">Home</Link>
            {isAuthenticated && <Link href="/dashboard">Dashboard</Link>}
            {isAdmin && <Link href="/admin">Admin Panel</Link>}
        </nav>
    );
}
```

### Get All Users (Admin Only)
```jsx
function UsersList() {
    const { getAllUsers, isAdmin } = useFirebase();
    const [users, setUsers] = useState({});
    
    useEffect(() => {
        if (isAdmin) {
            getAllUsers().then(setUsers);
        }
    }, [isAdmin]);
    
    if (!isAdmin) return <div>Access denied</div>;
    
    return (
        <div>
            {Object.values(users).map(user => (
                <div key={user.uid}>
                    {user.displayName} - {user.role}
                </div>
            ))}
        </div>
    );
}
```

## 🔍 Testing the System

### 1. Create Your First Admin
To make yourself an admin, you'll need to manually update the database initially:

1. Sign in to your app
2. Go to Firebase Console → Realtime Database
3. Find your user under `users/{your-uid}`
4. Change `role` from `"user"` to `"admin"`
5. Refresh your app - you should now see admin features

### 2. Test User Management
1. Create multiple test accounts
2. Use admin panel to change their roles
3. Test permission-based UI changes
4. Verify database updates in Firebase Console

### 3. Test Protected Routes
1. Visit `/admin` as regular user (should show access denied)
2. Visit `/admin` as admin (should show admin panel)
3. Test dashboard access for authenticated users

## 🚨 Important Security Notes

1. **Never trust client-side role checks for security**
   - Always validate permissions server-side
   - Client-side checks are for UI/UX only

2. **Secure your Firebase Rules**
   - The provided rules are a starting point
   - Customize based on your specific needs
   - Test rules thoroughly

3. **Admin Assignment**
   - First admin must be created manually in Firebase Console
   - Consider implementing admin invitation system
   - Keep admin list minimal

## 🔄 Migration from Previous Version

If upgrading from the previous version:

1. **Existing users**: Will be automatically migrated on next login
2. **Default role**: All existing users get `"user"` role
3. **No breaking changes**: All existing functionality preserved
4. **New features**: Available immediately after user signs in

## 🎉 What's Next?

Consider implementing:
- **Custom Claims**: For more granular permissions
- **User Groups**: Organize users into teams/departments  
- **Activity Logging**: Track user actions and changes
- **Email Notifications**: Notify users of role changes
- **Bulk Operations**: Mass user management tools
- **Advanced Analytics**: User engagement metrics

Your authentication system is now enterprise-ready with full user management capabilities! 🚀