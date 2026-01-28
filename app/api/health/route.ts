import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'SmartFall API is running',
      timestamp: new Date().toISOString(),
      endpoints: {
        falls: '/api/falls',
        status: '/api/device/status',
        sensor: '/api/device/sensor-stream',
        recent: '/api/falls/recent'
      }
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  const data = await request.json();
  const deviceId = data.device_id || request.headers.get('x-device-id');

  return NextResponse.json(
    {
      status: 'ok',
      message: 'Server connection verified',
      device_id: deviceId,
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
