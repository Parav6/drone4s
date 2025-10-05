'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSOSProtection } from '@/hooks/useSOSProtection';

const CheckSOSActive = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { sosActive, loading } = useSOSProtection();

    useEffect(() => {
        // Wait for loading to complete
        if (loading) return;

        // If SOS is active and not on SOS page, redirect to SOS page
        if (sosActive && pathname !== '/sos') {
            router.push('/sos');
        }
    }, [sosActive, loading, pathname, router]);

    // This component doesn't render anything
    return null;
};

export default CheckSOSActive;