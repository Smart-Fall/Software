import { useEffect, useState, useRef } from 'react';

interface Fall {
  id: string;
  fallDatetime: string;
  confidenceScore: number;
  confidenceLevel: string;
  sosTriggered: boolean;
  patient?: {
    user: {
      firstName: string;
      lastName: string;
    }
  };
  device?: {
    deviceId: string;
    deviceName: string;
  };
}

export function useFallAlerts(caregiverId?: string, pollingInterval: number = 5000) {
  const [falls, setFalls] = useState<Fall[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFallCount, setNewFallCount] = useState(0);
  const lastCheckRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const fetchFalls = async () => {
      try {
        const params = new URLSearchParams({
          since: lastCheckRef.current,
          ...(caregiverId && { caregiver_id: caregiverId })
        });

        const response = await fetch(`/api/falls/recent?${params}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.falls && data.falls.length > 0) {
          setFalls(prev => [...data.falls, ...prev].slice(0, 20));
          setNewFallCount(prev => prev + data.falls.length);

          // Browser notifications (if permitted)
          data.falls.forEach((fall: Fall) => {
            const patientName = `${fall.patient?.user.firstName || 'Unknown'} ${fall.patient?.user.lastName || ''}`.trim();
            if (Notification.permission === 'granted') {
              new Notification('Fall Detected!', {
                body: `${patientName} - ${fall.confidenceLevel}`,
                icon: '/favicon.ico'
              });
            }
          });
        }

        lastCheckRef.current = data.timestamp ?? new Date().toISOString();
        setLoading(false);
      } catch (error) {
        console.error('Error fetching falls:', error);
        setLoading(false);
      }
    };

    fetchFalls();
    const intervalId = setInterval(fetchFalls, pollingInterval);

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => clearInterval(intervalId);
  }, [caregiverId, pollingInterval]);

  return { falls, loading, newFallCount, clearNewFallCount: () => setNewFallCount(0) };
}
