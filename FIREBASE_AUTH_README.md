# Firebase Google Authentication with Context API

This project implements a complete Firebase Google Authentication system using React Context API for state management.

## Features

- ✅ Google OAuth Sign-in (Popup & Redirect)
- ✅ Persistent authentication state
- ✅ Protected routes component
- ✅ User profile management
- ✅ Comprehensive error handling
- ✅ Loading states
- ✅ Custom authentication hook
- ✅ Mobile-friendly responsive design

## Project Structure

```
src/
├── context/
│   └── Firebase.jsx          # Main Firebase context provider
├── components/
│   ├── AuthButton.jsx        # Sign-in/out button component
│   ├── ProtectedRoute.jsx    # HOC for protecting routes
│   └── UserProfile.jsx       # User profile display component
├── hooks/
│   └── useAuth.js            # Custom authentication hook
└── app/
    ├── page.js               # Home page with auth demo
    ├── dashboard/
    │   └── page.js           # Protected dashboard example
    └── layout.js             # Root layout with Firebase provider
```

## Setup Instructions

### 1. Firebase Configuration

Your Firebase config is already set up in `src/context/Firebase.jsx`. Make sure your Firebase project has:

- Authentication enabled
- Google sign-in provider configured
- Authorized domains added (localhost for development)

### 2. Google Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable Google+ API
4. Configure OAuth consent screen
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - Your production domain

### 3. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the authentication demo.

## Usage Examples

### Basic Authentication Check

```jsx
import { useFirebase } from '@/context/Firebase';

function MyComponent() {
    const { user, isAuthenticated, loading } = useFirebase();
    
    if (loading) return <div>Loading...</div>;
    
    return (
        <div>
            {isAuthenticated ? (
                <p>Welcome, {user.displayName}!</p>
            ) : (
                <p>Please sign in</p>
            )}
        </div>
    );
}
```

### Using the Custom Hook

```jsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
    const { user, signIn, signOut, loading, error } = useAuth();
    
    const handleSignIn = async () => {
        const user = await signIn();
        if (user) {
            console.log('Signed in successfully!');
        }
    };
    
    return (
        <div>
            {user ? (
                <button onClick={signOut}>Sign Out</button>
            ) : (
                <button onClick={handleSignIn}>Sign In</button>
            )}
        </div>
    );
}
```

### Protecting Routes

```jsx
import ProtectedRoute from '@/components/ProtectedRoute';

function ProtectedPage() {
    return (
        <ProtectedRoute>
            <div>This content is only visible to authenticated users</div>
        </ProtectedRoute>
    );
}
```

### Custom Fallback for Protected Routes

```jsx
<ProtectedRoute
    fallback={
        <div className="text-center p-8">
            <h2>Please sign in to continue</h2>
            <AuthButton />
        </div>
    }
>
    <ProtectedContent />
</ProtectedRoute>
```

## Available Context Methods

### Firebase Context (`useFirebase`)

```jsx
const {
    // User state
    user,                    // Current user object or null
    loading,                 // Authentication loading state
    error,                   // Authentication error message
    isAuthenticated,         // Boolean: whether user is signed in
    
    // Authentication methods
    signInWithGoogle,        // Sign in with popup
    signInWithGoogleRedirect,// Sign in with redirect (mobile-friendly)
    logout,                  // Sign out current user
    clearError,              // Clear error state
    
    // Firebase instances
    app,                     // Firebase app instance
    auth                     // Firebase auth instance
} = useFirebase();
```

### Custom Hook (`useAuth`)

```jsx
const {
    // Enhanced methods
    signIn,                  // Sign in with error handling
    signOut,                 // Sign out with error handling
    getUserDisplayInfo,      // Get formatted user display data
    hasPermission,           // Check user permissions (placeholder)
    
    // All Firebase context methods are also available
    ...firebaseContext
} = useAuth();
```

## User Object Structure

```javascript
{
    uid: "user-unique-id",
    email: "user@example.com",
    displayName: "User Name",
    photoURL: "https://photo-url.com",
    emailVerified: true
}
```

## Error Handling

The system includes comprehensive error handling:

```jsx
const { error, clearError } = useFirebase();

// Display errors
if (error) {
    return (
        <div className="error">
            {error}
            <button onClick={clearError}>Dismiss</button>
        </div>
    );
}
```

## Mobile Compatibility

For better mobile experience, use redirect instead of popup:

```jsx
// Use redirect for mobile devices
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const handleSignIn = () => {
    if (isMobile) {
        signInWithGoogleRedirect();
    } else {
        signInWithGoogle();
    }
};
```

## Security Considerations

1. **Environment Variables**: Store sensitive config in environment variables for production
2. **Domain Restrictions**: Configure authorized domains in Firebase Console
3. **Security Rules**: Implement Firestore security rules if using database
4. **HTTPS**: Always use HTTPS in production

## Common Issues & Solutions

### Popup Blocked
- Use redirect method for mobile devices
- Inform users to allow popups for your domain

### Authentication Not Persisting
- Check if Firebase is properly initialized in layout
- Ensure FirebaseProvider wraps your entire app

### Redirect Not Working
- Verify authorized domains in Firebase Console
- Check that redirect URL matches exactly

## Next Steps

1. **Add Email/Password Authentication**
2. **Implement Custom Claims for Roles**
3. **Add Password Reset Functionality**
4. **Integrate with Firestore for User Profiles**
5. **Add Social Media Providers (Facebook, Twitter, etc.)**

## Dependencies

- `firebase`: ^12.3.0
- `next`: 15.5.4
- `react`: 19.1.0
- `tailwindcss`: ^4

## Support

For issues related to Firebase setup, refer to the [Firebase Documentation](https://firebase.google.com/docs/auth).
For React/Next.js issues, refer to the [Next.js Documentation](https://nextjs.org/docs).