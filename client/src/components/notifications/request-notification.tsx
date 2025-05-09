import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { getQueryFn } from '@/lib/queryClient';
import { PairingRequestWithUsers } from '@/types/matching';
import { UserPlus } from 'lucide-react';

/**
 * Component that checks for new pairing requests and shows notifications
 * This component doesn't render anything visible - it just handles the notification logic
 */
export default function RequestNotification() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [notifiedRequestIds, setNotifiedRequestIds] = useState<number[]>([]);
  
  // Fetch pairing requests
  const { data: pairingRequests } = useQuery({
    queryKey: ['/api/pairing-requests'],
    queryFn: getQueryFn<PairingRequestWithUsers[]>({ on401: "throw" }),
    refetchInterval: 60000, // Check every minute
    refetchIntervalInBackground: true,
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: false, // Don't retry on error (e.g., when not authenticated)
    enabled: true, // Always enabled
  });
  
  // Filter for pending incoming requests
  const incomingRequests = pairingRequests?.filter(req => 
    req.recipientId === req.recipient.id && req.status === 'pending'
  ) || [];

  useEffect(() => {
    if (!incomingRequests.length) return;
    
    // Find new requests that haven't been notified yet
    const newRequests = incomingRequests.filter(
      request => !notifiedRequestIds.includes(request.id)
    );
    
    if (newRequests.length > 0) {
      // Get the most recent request
      const latestRequest = newRequests.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      const requesterName = latestRequest.requester.displayName || latestRequest.requester.fullname;
      
      // Show toast notification
      toast({
        title: 'New Pairing Request',
        description: `${requesterName} has sent you a request to pair for skill exchange.`,
        variant: 'default',
      });
      
      // Navigate to matches page when user clicks the toast
      setTimeout(() => {
        // Give the toast time to appear before focusing on it
        const toastActionButton = document.querySelector('[data-toast-action]') as HTMLButtonElement;
        if (toastActionButton) {
          toastActionButton.addEventListener('click', () => navigate('/matches'));
        }
      }, 100);
      
      // Update notified request IDs
      setNotifiedRequestIds(prev => [
        ...prev,
        ...newRequests.map(request => request.id)
      ]);
    }
  }, [incomingRequests, notifiedRequestIds, toast, navigate]);

  // This component doesn't render anything visible
  return null;
}
