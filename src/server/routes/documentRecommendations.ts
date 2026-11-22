import { Router, type Response } from 'express';
import { pgClient } from '../db/pgClient.ts';
import { requireAuth } from '../auth.ts';
import type { AuthRequest } from '../auth.ts';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  try {
    const userCourses = req.user.assignedCourseCodes || [];

    // Get courses of documents the user recently viewed
    const viewedDocs = await pgClient.query(
      'SELECT d.course_id FROM document_views dv JOIN documents d ON dv.document_id = d.id WHERE dv.user_id = $1 ORDER BY dv.viewed_at DESC LIMIT 10',
      [req.user.id]
    );
    const viewedCourseIds = viewedDocs.rows.map((r: any) => r.course_id);

    // Fetch approved documents
    const docsResult = await pgClient.query(
      `SELECT d.id, d.title, d.course_id, c.code as "courseCode", d.verified_at, d.download_count
       FROM documents d
       JOIN courses c ON d.course_id = c.id
       WHERE d.status = 'APPROVED' AND d.access_level IN ('PUBLIC', 'STUDENT_ONLY')
       ORDER BY d.verified_at DESC LIMIT 50`
    );

    // Score documents: +10 for assigned course, +5 for recently viewed course, +popularity
    const scoredDocs = docsResult.rows.map((doc: any) => {
      let score = 0;
      if (userCourses.includes(doc.courseCode)) score += 10;
      if (viewedCourseIds.includes(doc.course_id)) score += 5;
      score += Math.min((doc.download_count || 0) / 10, 5);
      return { ...doc, score };
    });

    // Sort by score descending, then by verification date
    scoredDocs.sort((a: any, b: any) => b.score - a.score || new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime());

    res.json({ success: true, data: scoredDocs.slice(0, 5) }); // Return top 5
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch recommendations.' } });
  }
});

export default router;
