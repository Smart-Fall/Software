import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the patient's ID
    const patientResult = await pool.query(`
      SELECT id FROM patients WHERE user_id = $1
    `, [session.userId]);
    
    if (patientResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    const patientId = patientResult.rows[0].id;
    
    // Get last 7 days of data
    const weeklyData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Get falls for this day
      const fallsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM fall_incidents
        WHERE patient_id = $1 
        AND fall_datetime >= $2 
        AND fall_datetime < $3
      `, [patientId, date, nextDate]);
      
      // Get health score for this day (you might need to adjust this based on your health_logs table structure)
      const healthResult = await pool.query(`
        SELECT health_score
        FROM health_logs
        WHERE patient_id = $1 
        AND recorded_at >= $2 
        AND recorded_at < $3
        ORDER BY recorded_at DESC
        LIMIT 1
      `, [patientId, date, nextDate]);
      
      const healthScore = healthResult.rows.length > 0 
        ? healthResult.rows[0].health_score 
        : 0;
      
      weeklyData.push({
        name: daysOfWeek[date.getDay()],
        healthScore: healthScore,
        falls: parseInt(fallsResult.rows[0].count)
      });
    }
    
    return NextResponse.json(weeklyData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
