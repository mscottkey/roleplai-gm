'use client';

import React from 'react';
import { app } from '@/lib/firebase'; // This will initialize firebase

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  // By rendering this component, we ensure that the Firebase app is initialized
  return <>{children}</>;
};
