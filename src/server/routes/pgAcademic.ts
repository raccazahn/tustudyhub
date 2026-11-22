import { Router, type NextFunction, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import type { College, Course, Department } from '../../types/index.ts';
import { AuthRequest, requireAuth, requireRole } from '../auth.ts';
import { pgClient } from '../db/pgClient.ts';
import { insertPgAudit } from '../db/pgRecords.ts';

const router = Router();

type CollegeRow = College & { departmentCount: number; courseCount: number };
type DepartmentRow = Department & { courseCount: number; documentCount: number };
type CourseRow = Course & { assignedLecturers: Array<{ id: string; fullName: string; email: string }> };

const courseSelect = `
  SELECT c.id, c.college_id AS "collegeId", co.name AS "collegeName",
         c.department_id AS "departmentId", d.name AS "departmentName",
         c.code, c.title, c.level, c.semester, COALESCE(c.description, '') AS description,
         c.status, c.created_at AS "createdAt", c.updated_at AS "updatedAt",
         (SELECT COUNT(*)::int FROM documents doc WHERE doc.course_id = c.id AND doc.status = 'APPROVED') AS "documentCount",
         (SELECT COUNT(*)::int FROM quizzes q WHERE q.course_id = c.id AND q.status = 'PUBLISHED') AS "quizCount",
         COALESCE((SELECT json_agg(json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email)
           ORDER BY u.full_name)
           FROM lecturer_course_assignments lca JOIN users u ON u.id = lca.lecturer_id
           WHERE lca.course_id = c.id AND u.role = 'LECTURER'), '[]'::json) AS "assignedLecturers"
  FROM courses c
  JOIN departments d ON d.id = c.department_id
  LEFT JOIN colleges co ON co.id = c.college_id
`;

function sendDatabaseError(error: unknown, res: Response, next: NextFunction, conflictMessage: string): void {
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
    res.status(409).json({ success: false, error: { code: 'CODE_EXISTS', message: conflictMessage } });
    return;
  }
  next(error);
}

function shouldUsePostgres(next: NextFunction): boolean {
  if (pgClient.isPostgresEnabled()) return true;
  next();
  return false;
}

router.get('/colleges', async (_req: Request, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  try {
    const result = await pgClient.query<CollegeRow>(`
      SELECT c.id, c.code, c.name, c.description, c.status, c.created_at AS "createdAt",
             c.updated_at AS "updatedAt",
             (SELECT COUNT(*)::int FROM departments d WHERE d.college_id = c.id) AS "departmentCount",
             (SELECT COUNT(*)::int FROM courses co WHERE co.college_id = c.id) AS "courseCount"
      FROM colleges c ORDER BY c.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.post('/colleges', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  const { code, name, description } = req.body;
  if (!code || !name) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'College code and name are required.' } });
    return;
  }
  const college: College = {
    id: crypto.randomUUID(), code: String(code).trim().toUpperCase(), name: String(name).trim(),
    description: description ? String(description).trim() : '', status: 'ACTIVE', createdAt: new Date().toISOString()
  };
  try {
    await pgClient.transaction(async client => {
      await client.query('INSERT INTO colleges (id, code, name, description, status) VALUES ($1, $2, $3, $4, $5)',
        [college.id, college.code, college.name, college.description, college.status]);
      await insertPgAudit(client, req.user, 'COLLEGE_CREATED', 'COLLEGE', college.id, { code: college.code, name: college.name }, req.ip);
    });
    res.status(201).json({ success: true, data: college, message: `College ${college.code} created successfully.` });
  } catch (error) { sendDatabaseError(error, res, next, 'A college with this code already exists.'); }
});

router.put('/colleges/:id', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  const { code, name, description, status } = req.body;
  try {
    const result = await pgClient.query<College>('UPDATE colleges SET code = COALESCE($1, code), name = COALESCE($2, name), description = COALESCE($3, description), status = COALESCE($4, status), updated_at = NOW() WHERE id = $5 RETURNING id, code, name, description, status, created_at AS "createdAt", updated_at AS "updatedAt"',
      [code ? String(code).trim().toUpperCase() : null, name ? String(name).trim() : null,
        description === undefined ? null : String(description).trim(), ['ACTIVE', 'INACTIVE'].includes(status) ? status : null, (req.params.id as string)]);
    if (!result.rowCount) {
      res.status(404).json({ success: false, error: { code: 'COLLEGE_NOT_FOUND', message: 'College record not found.' } });
      return;
    }
    const college = result.rows[0];
    await pgClient.transaction(client => insertPgAudit(client, req.user, 'COLLEGE_UPDATED', 'COLLEGE', college.id,
      { code: college.code, name: college.name, status: college.status }, req.ip));
    res.json({ success: true, data: college, message: `College ${college.code} updated successfully.` });
  } catch (error) { sendDatabaseError(error, res, next, 'College code already exists.'); }
});

router.delete('/colleges/:id', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  try {
    const college = await pgClient.query<College>('SELECT id, code, name FROM colleges WHERE id = $1', [(req.params.id as string)]);
    if (!college.rowCount) {
      res.status(404).json({ success: false, error: { code: 'COLLEGE_NOT_FOUND', message: 'College not found.' } });
      return;
    }
    const children = await pgClient.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM departments WHERE college_id = $1', [(req.params.id as string)]);
    if (children.rows[0].count > 0) {
      res.status(400).json({ success: false, error: { code: 'COLLEGE_HAS_DEPARTMENTS', message: `Cannot delete college with ${children.rows[0].count} active departments. Reassign departments first or set college status to INACTIVE.` } });
      return;
    }
    await pgClient.transaction(async client => {
      await client.query('DELETE FROM colleges WHERE id = $1', [(req.params.id as string)]);
      await insertPgAudit(client, req.user, 'COLLEGE_DELETED', 'COLLEGE', (req.params.id as string),
        { code: college.rows[0].code, name: college.rows[0].name }, req.ip);
    });
    res.json({ success: true, message: `College ${college.rows[0].code} deleted successfully.` });
  } catch (error) { next(error); }
});

router.get('/departments', async (_req: Request, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  try {
    const result = await pgClient.query<DepartmentRow>(`
      SELECT d.id, d.college_id AS "collegeId", c.name AS "collegeName", d.code, d.name,
             d.status, d.created_at AS "createdAt", d.updated_at AS "updatedAt",
             (SELECT COUNT(*)::int FROM courses co WHERE co.department_id = d.id) AS "courseCount",
             (SELECT COUNT(*)::int FROM documents doc JOIN courses co ON co.id = doc.course_id WHERE co.department_id = d.id) AS "documentCount"
      FROM departments d LEFT JOIN colleges c ON c.id = d.college_id ORDER BY d.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.post('/departments', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  const { code, name, collegeId } = req.body;
  if (!code || !name) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Department code and name are required.' } });
    return;
  }
  const departmentId = crypto.randomUUID();
  try {
    const result = await pgClient.transaction(async client => {
      const parent = collegeId ? await client.query<{ id: string; name: string }>('SELECT id, name FROM colleges WHERE id = $1', [collegeId]) : null;
      if (collegeId && !parent?.rowCount) return null;
      const inserted = await client.query<Department>(
        'INSERT INTO departments (id, college_id, code, name, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, college_id AS "collegeId", code, name, status, created_at AS "createdAt", updated_at AS "updatedAt"',
        [departmentId, parent?.rows[0].id ?? null, String(code).trim().toUpperCase(), String(name).trim(), 'ACTIVE']);
      const department = { ...inserted.rows[0], collegeName: parent?.rows[0].name };
      await insertPgAudit(client, req.user, 'DEPARTMENT_CREATED', 'DEPARTMENT', departmentId,
        { code: department.code, name: department.name, college: department.collegeName }, req.ip);
      return department;
    });
    if (!result) {
      res.status(404).json({ success: false, error: { code: 'COLLEGE_NOT_FOUND', message: 'Selected parent college not found.' } });
      return;
    }
    res.status(201).json({ success: true, data: result, message: `Department ${result.code} created successfully.` });
  } catch (error) { sendDatabaseError(error, res, next, 'A department with this code already exists.'); }
});

router.put('/departments/:id', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  const { code, name, collegeId, status } = req.body;
  try {
    const result = await pgClient.transaction(async client => {
      const parent = collegeId ? await client.query<{ id: string; name: string }>('SELECT id, name FROM colleges WHERE id = $1', [collegeId]) : null;
      if (collegeId && !parent?.rowCount) return { missingCollege: true as const };
      const updated = await client.query<Department>(
        `UPDATE departments SET code = COALESCE($1, code), name = COALESCE($2, name),
         college_id = CASE WHEN $3::boolean THEN $4::uuid ELSE college_id END,
         status = COALESCE($5, status), updated_at = NOW() WHERE id = $6
         RETURNING id, college_id AS "collegeId", code, name, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [code ? String(code).trim().toUpperCase() : null, name ? String(name).trim() : null,
          collegeId !== undefined, parent?.rows[0]?.id ?? null, ['ACTIVE', 'INACTIVE'].includes(status) ? status : null, (req.params.id as string)]);
      if (!updated.rowCount) return null;
      const department = { ...updated.rows[0], collegeName: parent?.rows[0]?.name };
      await insertPgAudit(client, req.user, 'DEPARTMENT_UPDATED', 'DEPARTMENT', department.id,
        { code: department.code, name: department.name, status: department.status }, req.ip);
      return department;
    });
    if (!result) {
      res.status(404).json({ success: false, error: { code: 'DEPARTMENT_NOT_FOUND', message: 'Department record not found.' } });
      return;
    }
    if ('missingCollege' in result) {
      res.status(404).json({ success: false, error: { code: 'COLLEGE_NOT_FOUND', message: 'Selected parent college not found.' } });
      return;
    }
    res.json({ success: true, data: result, message: `Department ${result.code} updated successfully.` });
  } catch (error) { sendDatabaseError(error, res, next, 'Department code already exists.'); }
});

router.delete('/departments/:id', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  try {
    const department = await pgClient.query<Department>('SELECT id, code, name FROM departments WHERE id = $1', [(req.params.id as string)]);
    if (!department.rowCount) {
      res.status(404).json({ success: false, error: { code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found.' } });
      return;
    }
    const children = await pgClient.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM courses WHERE department_id = $1', [(req.params.id as string)]);
    if (children.rows[0].count > 0) {
      res.status(400).json({ success: false, error: { code: 'DEPARTMENT_HAS_COURSES', message: `Cannot delete department with ${children.rows[0].count} active courses. Reassign courses first or set department status to INACTIVE.` } });
      return;
    }
    await pgClient.transaction(async client => {
      await client.query('DELETE FROM departments WHERE id = $1', [(req.params.id as string)]);
      await insertPgAudit(client, req.user, 'DEPARTMENT_DELETED', 'DEPARTMENT', (req.params.id as string),
        { code: department.rows[0].code, name: department.rows[0].name }, req.ip);
    });
    res.json({ success: true, message: `Department ${department.rows[0].code} deleted successfully.` });
  } catch (error) { next(error); }
});

router.get('/lecturers', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  try {
    const result = await pgClient.query(`
      SELECT u.id, u.full_name AS "fullName", u.email, u.department_id AS "departmentId",
             d.name AS "departmentName",
             COALESCE(ARRAY(SELECT c.code FROM lecturer_course_assignments lca JOIN courses c ON c.id = lca.course_id
               WHERE lca.lecturer_id = u.id ORDER BY c.code), ARRAY[]::VARCHAR[]) AS "assignedCourseCodes"
      FROM users u LEFT JOIN departments d ON d.id = u.department_id
      WHERE u.role = 'LECTURER' AND u.status = 'ACTIVE' ORDER BY u.full_name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
});

router.get('/courses', async (req: Request, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  const { departmentId, level, semester, q } = req.query as Record<string, string>;
  try {
    const values: unknown[] = [];
    const conditions: string[] = [];
    if (departmentId) { values.push(departmentId); conditions.push(`c.department_id = $${values.length}`); }
    if (level) { values.push(Number(level)); conditions.push(`c.level = $${values.length}`); }
    if (semester) { values.push(semester.toUpperCase()); conditions.push(`c.semester = $${values.length}`); }
    if (q) { values.push(`%${q}%`); conditions.push(`(c.code ILIKE $${values.length} OR c.title ILIKE $${values.length} OR c.description ILIKE $${values.length})`); }
    const result = await pgClient.query<CourseRow>(`${courseSelect} ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY c.code`, values);
    res.json({ success: true, data: result.rows, meta: { total: result.rowCount } });
  } catch (error) { next(error); }
});

router.get('/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  try {
    const result = await pgClient.query<CourseRow>(`${courseSelect} WHERE c.id = $1`, [(req.params.id as string)]);
    if (!result.rowCount) {
      res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' } });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
});

router.get('/courses/:id/materials', async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!shouldUsePostgres(next)) return;
    try {
      const course = await pgClient.query(`${courseSelect} WHERE c.id = $1`, [(req.params.id as string)]);
      if (!course.rowCount) {
        res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' } });
        return;
      }
      const user = req.user;
      const privileged = user && ['LECTURER', 'MODERATOR', 'ADMINISTRATOR'].includes(user.role);
      const values: unknown[] = [(req.params.id as string)];
      let visibility = '';
      if (!privileged) {
        if (user) {
          values.push(user.id);
          visibility = `AND (doc.status = 'APPROVED' OR doc.uploader_id = ${values.length})`;
        } else {
          visibility = "AND doc.status = 'APPROVED' AND doc.access_level = 'PUBLIC'";
        }
      }
      const docs = await pgClient.query(`
        SELECT doc.id, doc.course_id AS "courseId", co.code AS "courseCode", co.title AS "courseTitle",
               d.name AS "departmentName", doc.uploader_id AS "uploaderId", doc.uploader_name AS "uploaderName",
               doc.uploader_role AS "uploaderRole", doc.title, doc.description, doc.category, doc.academic_year AS "academicYear",
               doc.file_name AS "fileName", doc.file_size AS "fileSize", doc.mime_type AS "mimeType", doc.file_hash AS "fileHash",
               doc.status, doc.access_level AS "accessLevel", doc.download_count AS "downloadCount",
               doc.verification_token AS "verificationToken", doc.is_verified AS "isVerified", doc.verified_at AS "verifiedAt",
               doc.rejection_reason AS "rejectionReason", doc.created_at AS "createdAt", doc.updated_at AS "updatedAt"
        FROM documents doc JOIN courses co ON co.id = doc.course_id JOIN departments d ON d.id = co.department_id
        WHERE doc.course_id = $1 ${visibility} ORDER BY doc.created_at DESC
      `, values);
      const c = course.rows[0];
      const materials = user ? docs.rows : docs.rows.map(({ verificationToken: _token, isVerified: _verified, verifiedAt: _verifiedAt, fileHash: _hash, ...metadata }) => metadata);
      res.json({ success: true, data: { course: { id: c.id, code: c.code, title: c.title, departmentName: c.departmentName, assignedLecturers: c.assignedLecturers }, materials, total: docs.rowCount } });
    } catch (error) {
      console.error('Course materials endpoint error:', error);
      next(error);
    }
  });

  router.post('/courses', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  const { departmentId, code, title, level, semester, description, lecturerIds, lecturerId } = req.body;
  if (!departmentId || !code || !title || !level || !semester) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Department, course code, title, level, and semester are required.' } });
    return;
  }
  const id = crypto.randomUUID();
  const courseCode = String(code).trim().toUpperCase();
  const selectedIds: string[] = Array.isArray(lecturerIds) ? lecturerIds : lecturerId ? [lecturerId] : [];
  try {
    const course = await pgClient.transaction(async client => {
      const department = await client.query<{ id: string; collegeId: string | null; name: string; collegeName: string | null }>(
        'SELECT d.id, d.college_id AS "collegeId", d.name, c.name AS "collegeName" FROM departments d LEFT JOIN colleges c ON c.id = d.college_id WHERE d.id = $1', [departmentId]);
      if (!department.rowCount) return null;
      const inserted = await client.query<Course>(
        `INSERT INTO courses (id, college_id, department_id, code, title, level, semester, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
         RETURNING id, college_id AS "collegeId", department_id AS "departmentId", code, title, level, semester,
                   description, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [id, department.rows[0].collegeId, departmentId, courseCode, String(title).trim(), Number(level),
          String(semester).toUpperCase() === 'SECOND' ? 'SECOND' : 'FIRST', description || '']);
      for (const lecturerId of selectedIds) {
        await client.query(`INSERT INTO lecturer_course_assignments (lecturer_id, course_id)
          SELECT id, $2 FROM users WHERE id = $1 AND role = 'LECTURER' ON CONFLICT DO NOTHING`, [lecturerId, id]);
      }
      const assigned = await client.query(`SELECT u.id, u.full_name AS "fullName", u.email FROM lecturer_course_assignments lca JOIN users u ON u.id = lca.lecturer_id WHERE lca.course_id = $1 ORDER BY u.full_name`, [id]);
      await insertPgAudit(client, req.user, 'COURSE_CREATED', 'COURSE', id,
        { code: courseCode, title: inserted.rows[0].title, college: department.rows[0].collegeName, assignedLecturers: assigned.rows.map(item => item.fullName) }, req.ip);
      return { ...inserted.rows[0], collegeName: department.rows[0].collegeName, departmentName: department.rows[0].name,
        documentCount: 0, quizCount: 0, assignedLecturers: assigned.rows };
    });
    if (!course) {
      res.status(404).json({ success: false, error: { code: 'DEPT_NOT_FOUND', message: 'Department not found.' } });
      return;
    }
    res.status(201).json({ success: true, data: course });
  } catch (error) { sendDatabaseError(error, res, next, 'Course code already exists.'); }
});

router.put('/courses/:id', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  const { departmentId, code, title, level, semester, description, status, lecturerIds, lecturerId } = req.body;
  const shouldAssign = lecturerIds !== undefined || lecturerId !== undefined;
  const selectedIds: string[] = Array.isArray(lecturerIds) ? lecturerIds : lecturerId ? [lecturerId] : [];
  try {
    const result = await pgClient.transaction(async client => {
      const updated = await client.query<Course>(
        `UPDATE courses SET department_id = COALESCE($1, department_id),
         college_id = CASE WHEN $1::uuid IS NULL THEN college_id ELSE (SELECT college_id FROM departments WHERE id = $1) END,
         code = COALESCE($2, code), title = COALESCE($3, title), level = COALESCE($4, level),
         semester = COALESCE($5, semester), description = COALESCE($6, description),
         status = COALESCE($7, status), updated_at = NOW() WHERE id = $8
         RETURNING id, department_id AS "departmentId", code, title, level, semester, description, status,
                   college_id AS "collegeId", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [departmentId || null, code ? String(code).trim().toUpperCase() : null, title ? String(title).trim() : null,
          level ? Number(level) : null, semester ? (String(semester).toUpperCase() === 'SECOND' ? 'SECOND' : 'FIRST') : null,
          description === undefined ? null : String(description).trim(), ['ACTIVE', 'INACTIVE'].includes(status) ? status : null, (req.params.id as string)]);
      if (!updated.rowCount) return null;
      if (shouldAssign) {
        await client.query('DELETE FROM lecturer_course_assignments WHERE course_id = $1', [(req.params.id as string)]);
        for (const assignedId of selectedIds) {
          await client.query(`INSERT INTO lecturer_course_assignments (lecturer_id, course_id)
            SELECT id, $2 FROM users WHERE id = $1 AND role = 'LECTURER' ON CONFLICT DO NOTHING`, [assignedId, (req.params.id as string)]);
        }
      }
      const courseData = await client.query(`${courseSelect} WHERE c.id = $1`, [(req.params.id as string)]);
      await insertPgAudit(client, req.user, 'COURSE_UPDATED', 'COURSE', (req.params.id as string),
        { code: courseData.rows[0].code, title: courseData.rows[0].title,
          assignedLecturers: courseData.rows[0].assignedLecturers.map((item: { fullName: string }) => item.fullName) }, req.ip);
      return courseData.rows[0];
    });
    if (!result) {
      res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' } });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error) { sendDatabaseError(error, res, next, 'Course code already exists.'); }
});

router.delete('/courses/:id', requireAuth, requireRole(['ADMINISTRATOR']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!shouldUsePostgres(next)) return;
  try {
    const course = await pgClient.query<Course>('SELECT id, code, title FROM courses WHERE id = $1', [(req.params.id as string)]);
    if (!course.rowCount) {
      res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' } });
      return;
    }
    const documents = await pgClient.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM documents WHERE course_id = $1', [(req.params.id as string)]);
    if (documents.rows[0].count > 0) {
      res.status(400).json({ success: false, error: { code: 'COURSE_HAS_MATERIALS', message: `Cannot delete course with ${documents.rows[0].count} active academic materials. Reassign or archive materials first.` } });
      return;
    }
    await pgClient.transaction(async client => {
      await client.query('DELETE FROM lecturer_course_assignments WHERE course_id = $1', [(req.params.id as string)]);
      await client.query('DELETE FROM courses WHERE id = $1', [(req.params.id as string)]);
      await insertPgAudit(client, req.user, 'COURSE_DELETED', 'COURSE', (req.params.id as string),
        { code: course.rows[0].code, title: course.rows[0].title }, req.ip);
    });
    res.json({ success: true, message: `Course ${course.rows[0].code} deleted successfully.` });
  } catch (error) { next(error); }
});

export default router;
