/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Contributor Application Modal
 * Allows registered Students to apply for Lecturer review permissions.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Input, Textarea } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../lib/api.ts';
import type { Department } from '../../types/index.ts';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

interface ContributorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContributorApplicationModal: React.FC<ContributorApplicationModalProps> = ({ isOpen, onClose }) => {
  const { applyContributor } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [bio, setBio] = useState('');
  const [requestedCourses, setRequestedCourses] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      ApiClient.request<Department[]>('/api/v1/departments').then(res => {
        if (res.success && res.data) {
          setDepartments(res.data);
          if (res.data.length > 0) setDepartmentId(res.data[0].id);
        }
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const coursesArray = requestedCourses.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const res = await applyContributor(departmentId, bio, coursesArray);

    setIsLoading(false);
    if (res.success) {
      setSuccess(res.message || 'Application submitted successfully.');
      setTimeout(() => onClose(), 2200);
    } else {
      setError(res.error || 'Failed to submit application.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Lecturer Contributor Status"
      subtitle="Institutional Academic Review Board"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#A3D9B5] text-xs text-[#2D6A4F] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="p-3 rounded-lg bg-[#FBF1E6] border border-[#F7E4D0] text-xs text-[#4A463F] space-y-1">
          <p className="font-bold text-[#8A3E12]">Institutional Review Policy</p>
          <p>
            Lecturer contributors are empowered to review submitted course materials, verify study guides, and publish multiple-choice quizzes within their authorized courses.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1">
            Academic Department
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12]"
            required
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Courses to Review (Course Codes, comma-separated)"
          placeholder="e.g. CSC 201, CSC 301"
          value={requestedCourses}
          onChange={(e) => setRequestedCourses(e.target.value)}
          helperText="Specify the academic subjects you are authorized to verify."
          required
        />

        <Textarea
          label="Academic Background / Qualifications"
          placeholder="Detail your faculty appointment, department role, or credentials..."
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isLoading}>
            Submit Application
          </Button>
        </div>
      </form>
    </Modal>
  );
};
