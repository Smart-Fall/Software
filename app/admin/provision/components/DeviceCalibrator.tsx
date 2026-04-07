"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Usb,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Copy,
  Activity,
  Gauge,
  Mountain,
  Footprints,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Web Serial API type declarations (shared with DeviceProvisioner)
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
const CALIBRATE_IMU_TIMEOUT_MS = 30000;
const CALIBRATE_FSR_TIMEOUT_MS = 15000;
const CALIBRATE_BMP_TIMEOUT_MS = 10000;
const CALIBRATE_ALL_TIMEOUT_MS = 60000;
const IDENTIFY_RETRIES = 3;
const INTER_ATTEMPT_DELAY_MS = 250;

type CalibrationState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "identifying" }
  | {
      status: "identified";
      deviceId: string;
      currentSsid: string;
      wifiConnected: boolean;
    }
  | { status: "calibrating"; sensor: string }
  | { status: "error"; message: string };

type SensorCalibResult =
  | { status: "pending" }
  | { status: "running" }
  | { status: "success"; data: Record<string, unknown> }
  | { status: "error"; message: string };

export function DeviceCalibrator() {
  const [state, setState] = useState<CalibrationState>({ status: "idle" });
  const [mounted, setMounted] = useState(false);

  const [imuResult, setImuResult] = useState<SensorCalibResult>({
    status: "pending",
  });
  const [fsrResult, setFsrResult] = useState<SensorCalibResult>({
    status: "pending",
  });
  const [bmpResult, setBmpResult] = useState<SensorCalibResult>({
    status: "pending",
  });

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

  const sendAndReceive = useCallback(
    async (
      payload: object,
      timeoutMs = COMMAND_TIMEOUT_MS,
    ): Promise<Record<string, unknown>> => {
      if (!writerRef.current || !readerRef.current) {
        throw new Error("Port not open");
      }

      const encoder = new TextEncoder();
      const line = JSON.stringify(payload) + "\n";
      await writerRef.current.write(encoder.encode(line));

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
              "Serial framing error. Reconnect the device and try again.",
            );
          }
          throw error;
        }

        const { value, done } = readResult;
        if (done) {
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

          if (!responseLine) continue;

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
    resetResults();
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
          )) as { device_id: string; ssid: string; wifi_connected: boolean };
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
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

  const resetResults = () => {
    setImuResult({ status: "pending" });
    setFsrResult({ status: "pending" });
    setBmpResult({ status: "pending" });
  };

  const handleCalibrateImu = async () => {
    setImuResult({ status: "running" });
    setState((prev) =>
      prev.status === "identified"
        ? { ...prev, status: "calibrating" as const, sensor: "IMU" }
        : prev,
    );
    try {
      const resp = await sendAndReceive(
        { calibrate_imu: true },
        CALIBRATE_IMU_TIMEOUT_MS,
      );
      if (resp.status === "ok") {
        setImuResult({ status: "success", data: resp });
        toast.success("IMU calibration complete");
      } else {
        throw new Error((resp.message as string) || "IMU calibration failed");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "IMU calibration failed";
      setImuResult({ status: "error", message });
      toast.error(message);
    } finally {
      setState((prev) =>
        "deviceId" in prev
          ? {
              status: "identified",
              deviceId: prev.deviceId,
              currentSsid: (prev as { currentSsid: string }).currentSsid,
              wifiConnected: (prev as { wifiConnected: boolean })
                .wifiConnected,
            }
          : prev,
      );
    }
  };

  const handleCalibrateFsr = async () => {
    setFsrResult({ status: "running" });
    setState((prev) =>
      prev.status === "identified"
        ? { ...prev, status: "calibrating" as const, sensor: "FSR" }
        : prev,
    );
    try {
      const resp = await sendAndReceive(
        { calibrate_fsr: true },
        CALIBRATE_FSR_TIMEOUT_MS,
      );
      if (resp.status === "ok") {
        setFsrResult({ status: "success", data: resp });
        toast.success("FSR calibration complete");
      } else {
        throw new Error((resp.message as string) || "FSR calibration failed");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "FSR calibration failed";
      setFsrResult({ status: "error", message });
      toast.error(message);
    } finally {
      setState((prev) =>
        "deviceId" in prev
          ? {
              status: "identified",
              deviceId: prev.deviceId,
              currentSsid: (prev as { currentSsid: string }).currentSsid,
              wifiConnected: (prev as { wifiConnected: boolean })
                .wifiConnected,
            }
          : prev,
      );
    }
  };

  const handleCalibrateBmp = async () => {
    setBmpResult({ status: "running" });
    setState((prev) =>
      prev.status === "identified"
        ? { ...prev, status: "calibrating" as const, sensor: "BMP280" }
        : prev,
    );
    try {
      const resp = await sendAndReceive(
        { calibrate_bmp: true },
        CALIBRATE_BMP_TIMEOUT_MS,
      );
      if (resp.status === "ok") {
        setBmpResult({ status: "success", data: resp });
        toast.success("BMP280 baseline reset complete");
      } else {
        throw new Error(
          (resp.message as string) || "BMP280 calibration failed",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "BMP280 calibration failed";
      setBmpResult({ status: "error", message });
      toast.error(message);
    } finally {
      setState((prev) =>
        "deviceId" in prev
          ? {
              status: "identified",
              deviceId: prev.deviceId,
              currentSsid: (prev as { currentSsid: string }).currentSsid,
              wifiConnected: (prev as { wifiConnected: boolean })
                .wifiConnected,
            }
          : prev,
      );
    }
  };

  const handleCalibrateAll = async () => {
    setImuResult({ status: "running" });
    setFsrResult({ status: "running" });
    setBmpResult({ status: "running" });
    setState((prev) =>
      prev.status === "identified"
        ? { ...prev, status: "calibrating" as const, sensor: "All Sensors" }
        : prev,
    );
    try {
      const resp = await sendAndReceive(
        { calibrate_all: true },
        CALIBRATE_ALL_TIMEOUT_MS,
      );
      if (resp.status === "ok") {
        const imu = resp.imu as {
          ok: boolean;
          accel_offset: number[];
          gyro_offset: number[];
        };
        const fsr = resp.fsr as { ok: boolean; baseline: number };
        const bmp = resp.bmp as { ok: boolean; baseline_altitude: number };

        if (imu?.ok) {
          setImuResult({
            status: "success",
            data: {
              accel_offset: imu.accel_offset,
              gyro_offset: imu.gyro_offset,
            },
          });
        } else {
          setImuResult({
            status: "error",
            message: "IMU not initialized",
          });
        }

        if (fsr?.ok) {
          setFsrResult({
            status: "success",
            data: { baseline: fsr.baseline },
          });
        } else {
          setFsrResult({
            status: "error",
            message: "FSR not initialized",
          });
        }

        if (bmp?.ok) {
          setBmpResult({
            status: "success",
            data: { baseline_altitude: bmp.baseline_altitude },
          });
        } else {
          setBmpResult({
            status: "error",
            message: "BMP280 not initialized",
          });
        }

        toast.success("Full calibration complete");
      } else {
        throw new Error(
          (resp.message as string) || "Full calibration failed",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Calibration failed";
      setImuResult((prev) =>
        prev.status === "running" ? { status: "error", message } : prev,
      );
      setFsrResult((prev) =>
        prev.status === "running" ? { status: "error", message } : prev,
      );
      setBmpResult((prev) =>
        prev.status === "running" ? { status: "error", message } : prev,
      );
      toast.error(message);
    } finally {
      setState((prev) =>
        "deviceId" in prev
          ? {
              status: "identified",
              deviceId: prev.deviceId,
              currentSsid: (prev as { currentSsid: string }).currentSsid,
              wifiConnected: (prev as { wifiConnected: boolean })
                .wifiConnected,
            }
          : prev,
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const isCalibrating = state.status === "calibrating";

  if (!mounted) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-sm text-muted-foreground">
            Initializing calibration tools...
          </p>
        </CardContent>
      </Card>
    );
  }

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
            Device calibration requires the Web Serial API, which is only
            available in Chrome 89+ and Edge 89+.
          </p>
        </CardContent>
      </Card>
    );
  }

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
              below to begin calibration.
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

  if (state.status === "identified" || state.status === "calibrating") {
    const deviceId =
      state.status === "identified"
        ? state.deviceId
        : (state as unknown as { deviceId: string }).deviceId;

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
                  {deviceId}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(deviceId)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calibrate All */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Full Calibration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Run all sensor calibrations sequentially. Place the device on a
              flat, stable surface with no pressure on the FSR before starting.
            </p>
            <Button
              onClick={handleCalibrateAll}
              disabled={isCalibrating}
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isCalibrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calibrating {state.status === "calibrating" ? state.sensor : ""}...
                </>
              ) : (
                "Calibrate All Sensors"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Individual Sensor Calibration Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* IMU Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-4 w-4 text-blue-600" />
                IMU (MPU6050)
                <SensorBadge result={imuResult} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Place device on a flat surface and keep it completely still
                during calibration.
              </p>
              {imuResult.status === "success" && (
                <div className="text-xs font-mono bg-gray-50 p-2 rounded space-y-1">
                  <div>
                    Accel offset:{" "}
                    {formatArray(
                      imuResult.data.accel_offset as number[] | undefined,
                    )}
                  </div>
                  <div>
                    Gyro offset:{" "}
                    {formatArray(
                      imuResult.data.gyro_offset as number[] | undefined,
                    )}
                  </div>
                </div>
              )}
              {imuResult.status === "error" && (
                <p className="text-xs text-red-600">{imuResult.message}</p>
              )}
              <Button
                onClick={handleCalibrateImu}
                disabled={isCalibrating}
                size="sm"
                className="w-full"
                variant="outline"
              >
                {imuResult.status === "running" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                Calibrate IMU
              </Button>
            </CardContent>
          </Card>

          {/* FSR Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Footprints className="h-4 w-4 text-green-600" />
                FSR Sensor
                <SensorBadge result={fsrResult} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Remove all pressure from the force sensor before calibrating.
              </p>
              {fsrResult.status === "success" && (
                <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                  Baseline: {String(fsrResult.data.baseline)}
                </div>
              )}
              {fsrResult.status === "error" && (
                <p className="text-xs text-red-600">{fsrResult.message}</p>
              )}
              <Button
                onClick={handleCalibrateFsr}
                disabled={isCalibrating}
                size="sm"
                className="w-full"
                variant="outline"
              >
                {fsrResult.status === "running" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                Calibrate FSR
              </Button>
            </CardContent>
          </Card>

          {/* BMP280 Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mountain className="h-4 w-4 text-orange-600" />
                BMP280
                <SensorBadge result={bmpResult} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Ensure the device is at the desired reference altitude before
                resetting the baseline.
              </p>
              {bmpResult.status === "success" && (
                <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                  Baseline altitude:{" "}
                  {Number(bmpResult.data.baseline_altitude).toFixed(2)} m
                </div>
              )}
              {bmpResult.status === "error" && (
                <p className="text-xs text-red-600">{bmpResult.message}</p>
              )}
              <Button
                onClick={handleCalibrateBmp}
                disabled={isCalibrating}
                size="sm"
                className="w-full"
                variant="outline"
              >
                {bmpResult.status === "running" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                Reset Baseline
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Disconnect */}
        <div className="flex justify-end">
          <Button
            onClick={async () => {
              await disconnect();
              setState({ status: "idle" });
              resetResults();
            }}
            variant="outline"
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function SensorBadge({ result }: { result: SensorCalibResult }) {
  if (result.status === "success") {
    return (
      <Badge
        variant="default"
        className="ml-auto bg-green-600 hover:bg-green-700 text-xs"
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Done
      </Badge>
    );
  }
  if (result.status === "error") {
    return (
      <Badge
        variant="default"
        className="ml-auto bg-red-600 hover:bg-red-700 text-xs"
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        Error
      </Badge>
    );
  }
  if (result.status === "running") {
    return (
      <Badge
        variant="secondary"
        className="ml-auto text-xs"
      >
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Running
      </Badge>
    );
  }
  return null;
}

function formatArray(arr: number[] | undefined): string {
  if (!arr || !Array.isArray(arr)) return "N/A";
  return `[${arr.map((v) => v.toFixed(4)).join(", ")}]`;
}
