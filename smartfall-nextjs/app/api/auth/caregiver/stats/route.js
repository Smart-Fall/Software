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
    
    // Get caregiver_id from logged-in user
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
    
    // Total patients
    const totalPatients = await pool.query(`
      SELECT COUNT(*) as count
      FROM caregiver_patients
      WHERE caregiver_id = $1 AND is_active = true
    `, [caregiverId]);
    
    // Recent falls
    const recentFalls = await pool.query(`
      SELECT COUNT(*) as count
      FROM falls f
      JOIN patients p ON f.patient_id = p.id
      JOIN caregiver_patients cp ON p.id = cp.patient_id
      WHERE cp.caregiver_id = $1 
      AND cp.is_active = true
      AND f.fall_datetime > NOW() - INTERVAL '7 days'
    `, [caregiverId]);
    
    // High risk patients
    const highRisk = await pool.query(`
      SELECT COUNT(*) as count
      FROM patients p
      JOIN caregiver_patients cp ON p.id = cp.patient_id
      WHERE cp.caregiver_id = $1 
      AND cp.is_active = true
      AND p.risk_score >= 75
    `, [caregiverId]);
    
    // Average health score
    const avgScore = await pool.query(`
      SELECT COALESCE(ROUND(100 - AVG(p.risk_score)), 0) as score
      FROM patients p
      JOIN caregiver_patients cp ON p.id = cp.patient_id
      WHERE cp.caregiver_id = $1 
      AND cp.is_active = true
    `, [caregiverId]);
    
    return NextResponse.json({
      totalPatients: parseInt(totalPatients.rows[0].count),
      recentFalls: parseInt(recentFalls.rows[0].count),
      avgHealthScore: parseInt(avgScore.rows[0].score || 0),
      highRiskPatients: parseInt(highRisk.rows[0].count)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}