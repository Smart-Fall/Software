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
    
    // Get the patient's ID and health info
    const patientResult = await pool.query(`
      SELECT id, risk_score, is_high_risk 
      FROM patients 
      WHERE user_id = $1
    `, [session.userId]);
    
    if (patientResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    const patientId = patientResult.rows[0].id;
    const riskScore = patientResult.rows[0].risk_score || 0;
    const isHighRisk = patientResult.rows[0].is_high_risk || false;
    
    // Get fall statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    // Total falls
    const totalFallsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM falls
      WHERE patient_id = $1
    `, [patientId]);
    
    // Falls this week
    const weekFallsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM falls
      WHERE patient_id = $1 AND fall_datetime >= $2
    `, [patientId, oneWeekAgo]);
    
    // Falls this month
    const monthFallsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM falls
      WHERE patient_id = $1 AND fall_datetime >= $2
    `, [patientId, oneMonthAgo]);
    
    // Falls this year
    const yearFallsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM falls
      WHERE patient_id = $1 AND fall_datetime >= $2
    `, [patientId, oneYearAgo]);
    
    const stats = {
      totalFalls: parseInt(totalFallsResult.rows[0].count),
      fallsThisWeek: parseInt(weekFallsResult.rows[0].count),
      fallsThisMonth: parseInt(monthFallsResult.rows[0].count),
      fallsThisYear: parseInt(yearFallsResult.rows[0].count),
      currentHealthScore: 100 - riskScore, // Convert risk score to health score
      isHighRisk: isHighRisk
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
