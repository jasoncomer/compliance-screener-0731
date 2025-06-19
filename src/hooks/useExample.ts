import { useState } from 'react';

export function useExample() {
  const [message] = useState('Hello from useExample hook!');
  return message;
} 