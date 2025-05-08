import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Calculate password strength from 0-100
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 25;
  
  // Character variety checks
  if (/[A-Z]/.test(password)) strength += 25; // Uppercase
  if (/[a-z]/.test(password)) strength += 25; // Lowercase
  if (/[0-9]/.test(password)) strength += 12.5; // Numbers
  if (/[^A-Za-z0-9]/.test(password)) strength += 12.5; // Special chars
  
  return strength;
}

// Get appropriate strength description and color
export function getPasswordStrengthDetails(strength: number): { text: string; color: string } {
  if (strength < 25) {
    return { text: 'Too weak', color: 'bg-red-500' };
  } else if (strength < 50) {
    return { text: 'Weak', color: 'bg-yellow-500' };
  } else if (strength < 75) {
    return { text: 'Moderate', color: 'bg-yellow-500' };
  } else {
    return { text: 'Strong', color: 'bg-green-500' };
  }
}
