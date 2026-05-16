import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

// Shared nav ref so non-component code (notification response handler, deep
// link handlers) can call navigate without prop drilling.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
