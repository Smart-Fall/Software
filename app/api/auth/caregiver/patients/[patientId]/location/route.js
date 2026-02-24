import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req, context) {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const params = await context.params;
    const patientId = params.patientId;
    
    // Verify caregiver has access to this patient
    const caregiverResult = await pool.query(
      'SELECT id FROM caregivers WHERE user_id = $1',
      [session.userId]
    );
    
    if (caregiverResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Caregiver not found' },
        { status: 404 }
      );
    }
    
    const caregiverId = caregiverResult.rows[0].id;
    
    // Check if caregiver has access to patient
    const accessCheck = await pool.query(`
      SELECT 1 FROM caregiver_patients 
      WHERE caregiver_id = $1 AND patient_id = $2 AND is_active = true
    `, [caregiverId, patientId]);
    
    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Fetch most recent location from patient_locations table
    const result = await pool.query(`
      SELECT 
        latitude,
        longitude,
        address,
        location_type,
        location_datetime as last_updated
      FROM patient_locations
      WHERE patient_id = $1
      ORDER BY location_datetime DESC
      LIMIT 1
    `, [patientId]);
    
    if (result.rows.length > 0) {
      const location = result.rows[0];
      return NextResponse.json({
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        address: location.address,
        locationType: location.location_type,
        lastUpdated: location.last_updated
      });
    }
    
    // Fallback: Try to get location from falls table
    const fallLocationResult = await pool.query(`
      SELECT 
        location_lat as latitude,
        location_lng as longitude,
        location_description as address,
        fall_datetime as last_updated
      FROM falls
      WHERE patient_id = $1
        AND location_lat IS NOT NULL 
        AND location_lng IS NOT NULL
      ORDER BY fall_datetime DESC
      LIMIT 1
    `, [patientId]);
    
    if (fallLocationResult.rows.length > 0) {
      const loc = fallLocationResult.rows[0];
      return NextResponse.json({
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude),
        address: loc.address || 'Location from fall incident',
        lastUpdated: loc.last_updated
      });
    }
    
    // No location data available
    return NextResponse.json(
      { error: 'No location data available' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching patient location:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}