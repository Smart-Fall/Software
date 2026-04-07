import { useEffect, useState, useRef } from "react";

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
    };
  };
  device?: {
    deviceId: string;
    deviceName: string;
  };
}

export function useFallAlerts(
  caregiverId?: string,
  pollingInterval: number = 5000,
) {
  const [falls, setFalls] = useState<Fall[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFallCount, setNewFallCount] = useState(0);
  const lastCheckRef = useRef<string>(new Date().toISOString());
  const initializedRef = useRef(false);

  useEffect(() => {
    const fetchFalls = async () => {
      try {
        const params = new URLSearchParams(
          caregiverId ? { caregiver_id: caregiverId } : undefined,
        );

        // First request loads currently unresolved falls so Alerts tab is populated.
        // Subsequent polls are incremental.
        if (initializedRef.current && lastCheckRef.current) {
          params.set("since", lastCheckRef.current);
        }

        const response = await fetch(`/api/falls/recent?${params}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.falls && data.falls.length > 0) {
          const incomingFalls: Fall[] = data.falls;

          if (!initializedRef.current) {
            setFalls(incomingFalls.slice(0, 20));
          } else {
            let addedCount = 0;

            setFalls((prev) => {
              const existingIds = new Set(prev.map((f) => f.id));
              const uniqueIncoming = incomingFalls.filter(
                (f) => !existingIds.has(f.id),
              );
              addedCount = uniqueIncoming.length;
              return [...uniqueIncoming, ...prev].slice(0, 20);
            });

            if (addedCount > 0) {
              setNewFallCount((prev) => prev + addedCount);

              // Browser notifications (if permitted)
              incomingFalls.forEach((fall: Fall) => {
                const patientName =
                  `${fall.patient?.user.firstName || "Unknown"} ${fall.patient?.user.lastName || ""}`.trim();
                if (Notification.permission === "granted") {
                  new Notification("Fall Detected!", {
                    body: `${patientName} - ${fall.confidenceLevel}`,
                    icon: "/favicon.ico",
                  });
                }
              });
            }
          }
        }

        lastCheckRef.current = data.timestamp ?? new Date().toISOString();
        initializedRef.current = true;
        setLoading(false);
      } catch (error) {
        console.error("Error fetching falls:", error);
        setLoading(false);
      }
    };

    fetchFalls();
    const intervalId = setInterval(fetchFalls, pollingInterval);

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => clearInterval(intervalId);
  }, [caregiverId, pollingInterval]);

  return {
    falls,
    loading,
    newFallCount,
    clearNewFallCount: () => setNewFallCount(0),
  };
}
