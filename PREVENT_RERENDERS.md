// ✅ CORRECT: How to prevent infinite re-renders

import React, { useState, useMemo } from 'react';
import Map from '@/components/Map';

// ✅ Good: Define array outside component or use useMemo
const STATIC_USER_IDS = ['user1', 'user2', 'user3'];

function MyComponent() {
    // ✅ Good: Memoize dynamic arrays
    const [selectedUsers, setSelectedUsers] = useState(['user1']);
    
    const trackUserIds = useMemo(() => {
        return selectedUsers; // This prevents new array creation on every render
    }, [selectedUsers]);

    return (
        <Map
            trackUserIds={trackUserIds}  // ✅ Stable reference
            publishCurrentUser={true}
        />
    );
}

// ❌ BAD: This will cause infinite re-renders
function BadExample() {
    return (
        <Map
            trackUserIds={['user1', 'user2']}  // ❌ New array on every render!
            publishCurrentUser={true}
        />
    );
}

// ✅ GOOD: Static array
function GoodExample1() {
    return (
        <Map
            trackUserIds={STATIC_USER_IDS}  // ✅ Stable reference
            publishCurrentUser={true}
        />
    );
}

// ✅ GOOD: Memoized array
function GoodExample2() {
    const [users] = useState(['user1', 'user2']); // ✅ Stable state
    
    return (
        <Map
            trackUserIds={users}  // ✅ Stable reference
            publishCurrentUser={true}
        />
    );
}

export default MyComponent;