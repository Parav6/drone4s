"use client";
// Deprecated: useLocationPermission
// Keeping temporary for backward compatibility; will be removed later.
import useLocation from './useLocation';
const useLocationPermission = (options) => useLocation(options);
export default useLocationPermission;