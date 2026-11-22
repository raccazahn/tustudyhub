/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Academic Structure Manager
 * Full administration of Colleges, Departments, and Courses with hierarchical relationships:
 * College → Department → Course.
 */

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, Building, BookOpen, GraduationCap, X } from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { Input, Textarea } from '../ui/Input.tsx';
import { ApiClient } from '../../lib/api.ts';
import type { College, Department, Course } from '../../types/index.ts';

export const AcademicStructureManager: React.FC = () => {
  const [subTab, setSubTab] = useState<'colleges' | 'departments' | 'courses'>('colleges');
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Array<{ id: string; fullName: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal / Form States
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [collegeCode, setCollegeCode] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [collegeDesc, setCollegeDesc] = useState('');

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptCollegeId, setDeptCollegeId] = useState('');

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDeptId, setCourseDeptId] = useState('');
  const [courseLevel, setCourseLevel] = useState(100);
  const [courseSemester, setCourseSemester] = useState<'FIRST' | 'SECOND'>('FIRST');
  const [courseDesc, setCourseDesc] = useState('');
  const [selectedLecturerId, setSelectedLecturerId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [cRes, dRes, crsRes, lecRes] = await Promise.all([
      ApiClient.request<College[]>('/api/v1/colleges'),
      ApiClient.request<Department[]>('/api/v1/departments'),
      ApiClient.request<Course[]>('/api/v1/courses'),
      ApiClient.request<any[]>('/api/v1/lecturers')
    ]);

    if (cRes.success && cRes.data) setColleges(cRes.data);
    if (dRes.success && dRes.data) setDepartments(dRes.data);
    if (crsRes.success && crsRes.data) setCourses(crsRes.data);
    if (lecRes.success && lecRes.data) setLecturers(lecRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- College Actions ---
  const handleOpenCollegeModal = (col?: College) => {
    setError(null);
    if (col) {
      setEditingCollege(col);
      setCollegeCode(col.code);
      setCollegeName(col.name);
      setCollegeDesc(col.description || '');
    } else {
      setEditingCollege(null);
      setCollegeCode('');
      setCollegeName('');
      setCollegeDesc('');
    }
    setIsCollegeModalOpen(true);
  };

  const handleSaveCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const url = editingCollege ? `/api/v1/colleges/${editingCollege.id}` : '/api/v1/colleges';
    const method = editingCollege ? 'PUT' : 'POST';

    const res = await ApiClient.request(url, {
      method,
      body: JSON.stringify({
        code: collegeCode.trim(),
        name: collegeName.trim(),
        description: collegeDesc.trim()
      })
    });

    if (res.success) {
      setSuccess(`College ${collegeCode} saved successfully.`);
      setIsCollegeModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error?.message || 'Failed to save college.');
    }
  };

  const handleToggleCollegeStatus = async (col: College) => {
    const newStatus = col.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await ApiClient.request(`/api/v1/colleges/${col.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      fetchData();
    } else {
      setError(res.error?.message || 'Failed to update college status.');
    }
  };

  // --- Department Actions ---
  const handleOpenDeptModal = (dept?: Department) => {
    setError(null);
    if (dept) {
      setEditingDept(dept);
      setDeptCode(dept.code);
      setDeptName(dept.name);
      setDeptCollegeId(dept.collegeId || (colleges.length > 0 ? colleges[0].id : ''));
    } else {
      setEditingDept(null);
      setDeptCode('');
      setDeptName('');
      setDeptCollegeId(colleges.length > 0 ? colleges[0].id : '');
    }
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const url = editingDept ? `/api/v1/departments/${editingDept.id}` : '/api/v1/departments';
    const method = editingDept ? 'PUT' : 'POST';

    const res = await ApiClient.request(url, {
      method,
      body: JSON.stringify({
        code: deptCode.trim(),
        name: deptName.trim(),
        collegeId: deptCollegeId
      })
    });

    if (res.success) {
      setSuccess(`Department ${deptCode} saved successfully.`);
      setIsDeptModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error?.message || 'Failed to save department.');
    }
  };

  const handleToggleDeptStatus = async (dept: Department) => {
    const newStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await ApiClient.request(`/api/v1/departments/${dept.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      fetchData();
    } else {
      setError(res.error?.message || 'Failed to update department status.');
    }
  };

  // --- Course Actions ---
  const handleOpenCourseModal = (course?: Course) => {
    setError(null);
    if (course) {
      setEditingCourse(course);
      setCourseCode(course.code);
      setCourseTitle(course.title);
      setCourseDeptId(course.departmentId);
      setCourseLevel(course.level);
      setCourseSemester(course.semester);
      setCourseDesc(course.description || '');
      setSelectedLecturerId(course.assignedLecturers && course.assignedLecturers[0] ? course.assignedLecturers[0].id : '');
    } else {
      setEditingCourse(null);
      setCourseCode('');
      setCourseTitle('');
      setCourseDeptId(departments.length > 0 ? departments[0].id : '');
      setCourseLevel(100);
      setCourseSemester('FIRST');
      setCourseDesc('');
      setSelectedLecturerId(lecturers.length > 0 ? lecturers[0].id : '');
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const url = editingCourse ? `/api/v1/courses/${editingCourse.id}` : '/api/v1/courses';
    const method = editingCourse ? 'PUT' : 'POST';

    const res = await ApiClient.request(url, {
      method,
      body: JSON.stringify({
        code: courseCode.trim(),
        title: courseTitle.trim(),
        departmentId: courseDeptId,
        level: courseLevel,
        semester: courseSemester,
        description: courseDesc.trim(),
        lecturerId: selectedLecturerId || undefined
      })
    });

    if (res.success) {
      setSuccess(`Course ${courseCode} saved successfully.`);
      setIsCourseModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error?.message || 'Failed to save course.');
    }
  };

  const handleToggleCourseStatus = async (course: Course) => {
    const newStatus = course.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await ApiClient.request(`/api/v1/courses/${course.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      fetchData();
    } else {
      setError(res.error?.message || 'Failed to update course status.');
    }
  };

  return (
    <div className="space-y-6">

      {/* Subnavigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#DDD8CF] pb-3">
        <div className="flex rounded-lg bg-[#EDE9E2] p-1 border border-[#DDD8CF]">
          <button
            type="button"
            onClick={() => setSubTab('colleges')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              subTab === 'colleges' ? 'bg-white text-[#8A3E12] shadow-xs' : 'text-[#726B62] hover:text-[#1C1A17]'
            }`}
          >
            Colleges ({colleges.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('departments')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              subTab === 'departments' ? 'bg-white text-[#8A3E12] shadow-xs' : 'text-[#726B62] hover:text-[#1C1A17]'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('courses')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              subTab === 'courses' ? 'bg-white text-[#8A3E12] shadow-xs' : 'text-[#726B62] hover:text-[#1C1A17]'
            }`}
          >
            Courses ({courses.length})
          </button>
        </div>

        <div>
          {subTab === 'colleges' && (
            <Button variant="primary" size="sm" onClick={() => handleOpenCollegeModal()} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add College
            </Button>
          )}
          {subTab === 'departments' && (
            <Button variant="primary" size="sm" onClick={() => handleOpenDeptModal()} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Department
            </Button>
          )}
          {subTab === 'courses' && (
            <Button variant="primary" size="sm" onClick={() => handleOpenCourseModal()} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Course
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#A3D9B5] text-xs text-[#2D6A4F] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Subtab 1: Colleges */}
      {subTab === 'colleges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colleges.map((col) => (
            <Card key={col.id} variant="default" padding="md" className="space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F7E4D0] text-[#8A3E12] border border-[#EDE9E2]">
                    {col.code}
                  </span>
                  <span className={`text-[10px] font-bold ${col.status === 'ACTIVE' ? 'text-[#2D6A4F]' : 'text-[#B91C1C]'}`}>
                    {col.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#1C1A17]">{col.name}</h3>
                <p className="text-[11px] text-[#726B62] line-clamp-2">
                  {col.description || 'Institutional college division.'}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] text-[#726B62]">
                  <span>{col.departmentCount || 0} Departments</span>
                  <span>•</span>
                  <span>{col.courseCount || 0} Courses</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE9E2]">
                <button
                  type="button"
                  onClick={() => handleToggleCollegeStatus(col)}
                  className="text-[10px] font-bold text-[#726B62] hover:text-[#1C1A17] px-2 py-1"
                >
                  {col.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
                <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleOpenCollegeModal(col)}>
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Subtab 2: Departments */}
      {subTab === 'departments' && (
        <div className="bg-white rounded-xl border border-[#DDD8CF] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EDE9E2] text-[#4A463F] uppercase font-bold border-b border-[#DDD8CF]">
              <tr>
                <th className="px-4 py-3">Code & Department</th>
                <th className="px-4 py-3">Parent College</th>
                <th className="px-4 py-3">Courses / Docs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9E2]">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#8A3E12] block">{d.code}</span>
                    <span className="text-[#1C1A17] font-medium">{d.name}</span>
                  </td>
                  <td className="px-4 py-3 text-[#726B62]">
                    {d.collegeName || '—'}
                  </td>
                  <td className="px-4 py-3 text-[#726B62]">
                    {d.courseCount || 0} courses • {d.documentCount || 0} docs
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold ${d.status === 'ACTIVE' ? 'text-[#2D6A4F]' : 'text-[#B91C1C]'}`}>
                      {d.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleDeptStatus(d)}
                        className="text-[10px] font-bold text-[#726B62] hover:text-[#1C1A17]"
                      >
                        {d.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeptModal(d)}
                        className="text-[#8A3E12] hover:text-[#A84D16] p-1"
                        title="Edit Department"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 3: Courses */}
      {subTab === 'courses' && (
        <div className="bg-white rounded-xl border border-[#DDD8CF] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EDE9E2] text-[#4A463F] uppercase font-bold border-b border-[#DDD8CF]">
              <tr>
                <th className="px-4 py-3">Course Code & Title</th>
                <th className="px-4 py-3">Department & College</th>
                <th className="px-4 py-3">Level / Sem</th>
                <th className="px-4 py-3">Assigned Lecturers</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9E2]">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#8A3E12] block">{c.code}</span>
                    <span className="text-[#1C1A17] font-medium">{c.title}</span>
                  </td>
                  <td className="px-4 py-3 text-[#726B62]">
                    <div className="text-[11px] font-medium text-[#1C1A17]">{c.departmentName}</div>
                    <div className="text-[10px] text-[#726B62]">{c.collegeName || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-[#726B62]">
                    {c.level} Level • {c.semester}
                  </td>
                  <td className="px-4 py-3 text-[#726B62]">
                    {c.assignedLecturers && c.assignedLecturers.length > 0 ? (
                      c.assignedLecturers.map(l => l.fullName).join(', ')
                    ) : (
                      <span className="text-[10px] italic text-[#C4BEB4]">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold ${c.status === 'ACTIVE' ? 'text-[#2D6A4F]' : 'text-[#B91C1C]'}`}>
                      {c.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCourseStatus(c)}
                        className="text-[10px] font-bold text-[#726B62] hover:text-[#1C1A17]"
                      >
                        {c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCourseModal(c)}
                        className="text-[#8A3E12] hover:text-[#A84D16] p-1"
                        title="Edit Course"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* College Modal */}
      {isCollegeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#DDD8CF]">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE9E2]">
              <h3 className="text-sm font-bold text-[#1C1A17]">
                {editingCollege ? `Edit College (${editingCollege.code})` : 'Register New College'}
              </h3>
              <button onClick={() => setIsCollegeModalOpen(false)} className="text-[#726B62] hover:text-[#1C1A17]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCollege} className="space-y-3">
              <Input
                label="College Code"
                placeholder="e.g. COST, COENG"
                value={collegeCode}
                onChange={(e) => setCollegeCode(e.target.value)}
                required
              />
              <Input
                label="College Full Name"
                placeholder="e.g. College of Science and Technology"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                required
              />
              <Textarea
                label="Academic Description"
                placeholder="Disciplinary scope, research faculties, and departments."
                rows={2}
                value={collegeDesc}
                onChange={(e) => setCollegeDesc(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-[#EDE9E2]">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsCollegeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save College
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#DDD8CF]">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE9E2]">
              <h3 className="text-sm font-bold text-[#1C1A17]">
                {editingDept ? `Edit Department (${editingDept.code})` : 'Register New Department'}
              </h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-[#726B62] hover:text-[#1C1A17]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveDept} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1">
                  Parent College
                </label>
                <select
                  value={deptCollegeId}
                  onChange={(e) => setDeptCollegeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-white border border-[#DDD8CF] text-[#1C1A17]"
                  required
                >
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} ({col.code})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Department Code"
                placeholder="e.g. CSC, LAW, ENG"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                required
              />
              <Input
                label="Department Full Name"
                placeholder="e.g. Department of Computer Science"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-[#EDE9E2]">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsDeptModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Department
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#DDD8CF]">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE9E2]">
              <h3 className="text-sm font-bold text-[#1C1A17]">
                {editingCourse ? `Edit Course (${editingCourse.code})` : 'Register New Curriculum Course'}
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-[#726B62] hover:text-[#1C1A17]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1">
                  Department
                </label>
                <select
                  value={courseDeptId}
                  onChange={(e) => setCourseDeptId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-white border border-[#DDD8CF] text-[#1C1A17]"
                  required
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Course Code"
                  placeholder="e.g. CSC 201"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  required
                />
                <Input
                  label="Level"
                  type="number"
                  placeholder="e.g. 200"
                  value={courseLevel}
                  onChange={(e) => setCourseLevel(Number(e.target.value))}
                  required
                />
              </div>

              <Input
                label="Course Title"
                placeholder="e.g. Data Structures & Algorithms"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1">
                    Semester
                  </label>
                  <select
                    value={courseSemester}
                    onChange={(e) => setCourseSemester(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg bg-white border border-[#DDD8CF] text-[#1C1A17]"
                  >
                    <option value="FIRST">First Semester</option>
                    <option value="SECOND">Second Semester</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1">
                    Assign Lecturer
                  </label>
                  <select
                    value={selectedLecturerId}
                    onChange={(e) => setSelectedLecturerId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-white border border-[#DDD8CF] text-[#1C1A17]"
                  >
                    <option value="">None (Unassigned)</option>
                    {lecturers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Textarea
                label="Syllabus Description"
                placeholder="Topics covered, prerequisite knowledge, and course objectives."
                rows={2}
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EDE9E2]">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsCourseModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Course
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
