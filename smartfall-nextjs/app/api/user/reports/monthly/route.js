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
    
    // Get last 4 weeks of data
    const monthlyData = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7) + 1);
      weekEnd.setHours(0, 0, 0, 0);
      
      // Get falls for this week
      const fallsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM fall_incidents
        WHERE patient_id = $1 
        AND fall_datetime >= $2 
        AND fall_datetime < $3
      `, [patientId, weekStart, weekEnd]);
      
      // Get average health score for this week
      const healthResult = await pool.query(`
        SELECT AVG(health_score)::int as avg_score
        FROM health_logs
        WHERE patient_id = $1 
        AND recorded_at >= $2 
        AND recorded_at < $3
      `, [patientId, weekStart, weekEnd]);
      
      const healthScore = healthResult.rows.length > 0 && healthResult.rows[0].avg_score
        ? healthResult.rows[0].avg_score 
        : 0;
      
      monthlyData.push({
        name: `Week ${4 - i}`,
        healthScore: healthScore,
        falls: parseInt(fallsResult.rows[0].count)
      });
    }
    
    return NextResponse.json(monthlyData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
