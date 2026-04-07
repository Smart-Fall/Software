"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Usb,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Web Serial API type declarations
declare global {
  interface Navigator {
    serial: {
      requestPort: (options?: {
        filters?: { usbVendorId?: number }[];
      }) => Promise<SerialPort>;
    };
  }
  interface SerialPort {
    open: (options: {
      baudRate: number;
      dataBits?: 7 | 8;
      stopBits?: 1 | 2;
      parity?: "none" | "even" | "odd";
      flowControl?: "none" | "hardware";
    }) => Promise<void>;
    close: () => Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
  }
}

const BAUD_RATE = 115200;
const COMMAND_TIMEOUT_MS = 15000;
const IDENTIFY_TIMEOUT_MS = 45000;
const SET_WIFI_TIMEOUT_MS = 30000;
const IDENTIFY_RETRIES = 3;
const INTER_ATTEMPT_DELAY_MS = 250;

type SendOptions = {
  allowPortCloseAsSuccess?: boolean;
};

type ProvisionState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "identifying" }
  | {
      status: "identified";
      deviceId: string;
      currentSsid: string;
      wifiConnected: boolean;
    }
  | { status: "provisioning" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

export function DeviceProvisioner() {
  const [state, setState] = useState<ProvisionState>({ status: "idle" });
  const [mounted, setMounted] = useState(false);
  const [expectedSsid, setExpectedSsid] = useState<string | null>(null);
  const [verifyingReboot, setVerifyingReboot] = useState(false);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(
    null,
  );
  const receiveBufferRef = useRef("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSerialSupported =
    mounted && typeof navigator !== "undefined" && "serial" in navigator;

  // Send a JSON line and wait for the next JSON line response, skipping boot logs/noise.
  const sendAndReceive = useCallback(
    async (
      payload: object,
      timeoutMs = COMMAND_TIMEOUT_MS,
      options?: SendOptions,
    ): Promise<object> => {
      if (!writerRef.current || !readerRef.current) {
        throw new Error("Port not open");
      }

      const encoder = new TextEncoder();
      const line = JSON.stringify(payload) + "\n";
      await writerRef.current.write(encoder.encode(line));

      // Read characters until newline with timeout, but only parse JSON-looking lines.
      const decoder = new TextDecoder();
      const deadline = Date.now() + timeoutMs;

      while (true) {
        if (Date.now() > deadline) {
          throw new Error("Device response timed out");
        }
        let readResult: ReadableStreamReadResult<Uint8Array>;
        try {
          readResult = await readerRef.current.read();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          if (message.toLowerCase().includes("framing")) {
            throw new Error(
              "Serial framing error. Reconnect the device, close other serial monitors, and try again.",
            );
          }
          throw error;
        }

        const { value, done } = readResult;
        if (done) {
          if (options?.allowPortCloseAsSuccess) {
            return {
              status: "ok",
              message:
                "Device port closed after command (likely rebooting with new credentials).",
            };
          }
          throw new Error("Port closed unexpectedly");
        }

        receiveBufferRef.current += decoder.decode(value, { stream: true });

        while (true) {
          const newlineIdx = receiveBufferRef.current.indexOf("\n");
          if (newlineIdx === -1) break;

          const responseLine = receiveBufferRef.current
            .slice(0, newlineIdx)
            .replace(/\r/g, "")
            .trim();
          receiveBufferRef.current = receiveBufferRef.current.slice(
            newlineIdx + 1,
          );

          if (!responseLine) {
            continue;
          }

          // Some transports include log prefixes or control chars before JSON.
          const firstBrace = responseLine.indexOf("{");
          const lastBrace = responseLine.lastIndexOf("}");
          if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
            continue;
          }

          const jsonCandidate = responseLine.slice(firstBrace, lastBrace + 1);

          try {
            return JSON.parse(jsonCandidate);
          } catch {
            // Ignore malformed JSON lines and keep reading.
          }
        }
      }
    },
    [],
  );

  const handleConnect = async () => {
    if (!isSerialSupported) return;
    setState({ status: "connecting" });
    try {
      const port = await navigator.serial.requestPort();
      await port.open({
        baudRate: BAUD_RATE,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });
      portRef.current = port;
      readerRef.current = port.readable!.getReader();
      writerRef.current = port.writable!.getWriter();
      receiveBufferRef.current = "";

      // Some ESP32 boards reset when serial opens; give it a short settle window.
      await new Promise((resolve) => setTimeout(resolve, 400));

      setState({ status: "identifying" });

      let resp: {
        device_id: string;
        ssid: string;
        wifi_connected: boolean;
      } | null = null;

      for (let attempt = 1; attempt <= IDENTIFY_RETRIES; attempt++) {
        try {
          resp = (await sendAndReceive(
            { action: "identify" },
            IDENTIFY_TIMEOUT_MS,
          )) as {
            device_id: string;
            ssid: string;
            wifi_connected: boolean;
          };
          break;
        } catch (error) {
          if (attempt === IDENTIFY_RETRIES) throw error;
          await new Promise((resolve) =>
            setTimeout(resolve, INTER_ATTEMPT_DELAY_MS),
          );
        }
      }

      if (!resp) {
        throw new Error("Unable to identify device");
      }

      setState({
        status: "identified",
        deviceId: resp.device_id,
        currentSsid: resp.ssid,
        wifiConnected: resp.wifi_connected,
      });
      setSsid("");
      setPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      // User cancelled the picker dialog — don't show error toast
      if (
        message.includes("No port selected") ||
        message.includes("cancelled")
      ) {
        setState({ status: "idle" });
      } else {
        setState({ status: "error", message });
        toast.error(`Connection failed: ${message}`);
      }
      await disconnect();
    }
  };

  const disconnect = async () => {
    try {
      readerRef.current?.releaseLock();
    } catch {}
    try {
      writerRef.current?.releaseLock();
    } catch {}
    try {
      await portRef.current?.close();
    } catch {}
    portRef.current = null;
    readerRef.current = null;
    writerRef.current = null;
  };

  const handleApply = async () => {
    if (!ssid.trim()) {
      toast.error("SSID cannot be empty");
      return;
    }
    setState({ status: "provisioning" });
    try {
      const resp = (await sendAndReceive({
        action: "set_wifi",
        ssid: ssid.trim(),
        password,
      }, SET_WIFI_TIMEOUT_MS, {
        allowPortCloseAsSuccess: true,
      })) as { status: string; message: string };

      if (resp.status === "ok") {
        setExpectedSsid(ssid.trim());
        setState({ status: "done", message: resp.message });
        toast.success("Credentials saved — device is rebooting");
        // Port will close on its own as device reboots
        await disconnect();
      } else {
        throw new Error(resp.message || "Device returned error");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Provisioning failed";
      if (message.includes("Device response timed out")) {
        setState({
          status: "error",
          message:
            "Timed out waiting for ACK. If the device rebooted, credentials may still have been saved. Reconnect and run identify to verify SSID.",
        });
        toast.error("Timed out waiting for device ACK");
        return;
      }
      setState({ status: "error", message });
      toast.error(message);
    }
  };

  const handleVerifyAfterReboot = async () => {
    if (!isSerialSupported) return;

    const expected = expectedSsid?.trim() || "";
    setVerifyingReboot(true);

    try {
      setState({ status: "connecting" });

      const port = await navigator.serial.requestPort();
      await port.open({
        baudRate: BAUD_RATE,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });

      portRef.current = port;
      readerRef.current = port.readable!.getReader();
      writerRef.current = port.writable!.getWriter();
      receiveBufferRef.current = "";

      await new Promise((resolve) => setTimeout(resolve, 400));
      setState({ status: "identifying" });

      const respRaw = await sendAndReceive(
        { action: "identify" },
        IDENTIFY_TIMEOUT_MS,
      );
      const resp = respRaw as {
        device_id?: string;
        ssid?: string;
        wifi_connected?: boolean;
      };

      if (!resp.device_id || typeof resp.ssid !== "string") {
        throw new Error("Unexpected identify response");
      }

      const currentSsid = resp.ssid;
      const matchesExpected = expected.length > 0 && currentSsid === expected;

      if (expected.length > 0) {
        if (matchesExpected) {
          toast.success(`Verified. Device saved SSID \"${currentSsid}\".`);
          setExpectedSsid(null);
        } else {
          toast.error(
            `Device responded, but SSID is \"${currentSsid || "(none)"}\" instead of \"${expected}\".`,
          );
        }
      } else {
        toast.success("Verification complete.");
      }

      setState({
        status: "identified",
        deviceId: resp.device_id,
        currentSsid,
        wifiConnected: !!resp.wifi_connected,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      if (
        message.includes("No port selected") ||
        message.includes("cancelled")
      ) {
        setState({
          status: "done",
          message: "Credentials saved. Reconnect and verify when ready.",
        });
      } else {
        setState({ status: "error", message });
        toast.error(`Verification failed: ${message}`);
      }
      await disconnect();
    } finally {
      setVerifyingReboot(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Keep the first client render identical to SSR to avoid hydration mismatch.
  if (!mounted) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-sm text-muted-foreground">
            Initializing device tools...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Browser compatibility warning
  if (!isSerialSupported) {
    return (
      <Card className="border-yellow-300 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Browser Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700 text-sm">
            Device provisioning requires the Web Serial API, which is only
            available in Chrome 89+ and Edge 89+. Please open this page in
            Chrome or Edge to continue.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Idle or Error state
  if (state.status === "idle" || state.status === "error") {
    return (
      <div className="space-y-4">
        {state.status === "error" && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700 text-sm font-medium">
                {state.message}
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Usb className="h-5 w-5 text-blue-600" />
              Connect Device
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Plug in your SmartFall device via USB-C, then click the button
              below to begin provisioning.
            </p>
            <Button
              onClick={handleConnect}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Usb className="h-4 w-4 mr-2" />
              Open Serial Port
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connecting or Identifying state
  if (state.status === "connecting" || state.status === "identifying") {
    const statusText =
      state.status === "connecting"
        ? "Opening port..."
        : "Identifying device...";
    return (
      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-sm text-muted-foreground">{statusText}</p>
        </CardContent>
      </Card>
    );
  }

  // Identified state
  if (state.status === "identified") {
    return (
      <div className="space-y-6">
        {/* Device Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-600" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Device ID
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono text-gray-900">
                  {state.deviceId}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(state.deviceId)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Current WiFi SSID
              </Label>
              <div className="mt-1 px-3 py-2 bg-gray-100 rounded text-sm text-gray-900">
                {state.currentSsid || "(none)"}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                WiFi Status
              </Label>
              <div className="mt-1">
                <Badge
                  variant={state.wifiConnected ? "default" : "secondary"}
                  className={
                    state.wifiConnected
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 hover:bg-gray-500"
                  }
                >
                  {state.wifiConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credentials Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configure WiFi Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ssid" className="text-sm font-medium">
                WiFi Network Name (SSID)
              </Label>
              <Input
                id="ssid"
                type="text"
                placeholder="Enter SSID"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                WiFi Password
              </Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleApply}
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Apply & Reboot
              </Button>
              <Button
                onClick={async () => {
                  await disconnect();
                  setState({ status: "idle" });
                }}
                variant="outline"
                size="lg"
              >
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Provisioning state
  if (state.status === "provisioning") {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-sm text-muted-foreground">Saving credentials...</p>
        </CardContent>
      </Card>
    );
  }

  // Done state
  if (state.status === "done") {
    return (
      <Card className="border-green-300 bg-green-50">
        <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
          <p className="text-green-700 font-medium text-center mb-6">
            {state.message}
          </p>
          {expectedSsid && (
            <p className="text-sm text-green-800 mb-4 text-center">
              Expected SSID after reboot: <strong>{expectedSsid}</strong>
            </p>
          )}
          <div className="flex gap-3">
            <Button
              onClick={handleVerifyAfterReboot}
              disabled={verifyingReboot}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {verifyingReboot ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              Verify After Reboot
            </Button>
            <Button
              onClick={() => setState({ status: "idle" })}
              className="bg-green-600 hover:bg-green-700"
            >
              <Usb className="h-4 w-4 mr-2" />
              Provision Another Device
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
