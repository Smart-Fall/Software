import { NextResponse } from 'next/server';
import pool from 'app/lib/db';
import { getSession } from 'app/lib/auth';

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
    
    // Get last 12 months of data
    const yearlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() - i + 1);
      monthEnd.setDate(1);
      monthEnd.setHours(0, 0, 0, 0);
      
      // Get falls for this month
      const fallsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM fall_incidents
        WHERE patient_id = $1 
        AND fall_datetime >= $2 
        AND fall_datetime < $3
      `, [patientId, monthStart, monthEnd]);
      
      // Get average health score for this month
      const healthResult = await pool.query(`
        SELECT AVG(health_score)::int as avg_score
        FROM health_logs
        WHERE patient_id = $1 
        AND recorded_at >= $2 
        AND recorded_at < $3
      `, [patientId, monthStart, monthEnd]);
      
      const healthScore = healthResult.rows.length > 0 && healthResult.rows[0].avg_score
        ? healthResult.rows[0].avg_score 
        : 0;
      
      yearlyData.push({
        name: monthNames[monthStart.getMonth()],
        healthScore: healthScore,
        falls: parseInt(fallsResult.rows[0].count)
      });
    }
    
    return NextResponse.json(yearlyData);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
