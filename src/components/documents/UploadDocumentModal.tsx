/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Upload Document Modal
 * Supports PDF documents and photo/image scans with client-side verification.
 */

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal.tsx';
import { Input, Textarea } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { ApiClient } from '../../lib/api.ts';
import type { Course, DocumentCategory, AccessLevel } from '../../types/index.ts';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onUploaded
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('LECTURE_NOTE');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('PUBLIC');
  const [file, setFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      ApiClient.request<Course[]>('/api/v1/courses').then((res) => {
        if (res.success && res.data) {
          setCourses(res.data);
          if (res.data.length > 0) setCourseId(res.data[0].id);
        }
      });
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // Max 20MB check
      if (selected.size > 20 * 1024 * 1024) {
        setError('File size exceeds maximum institutional limit of 20 MB.');
        return;
      }
      setFile(selected);
      setError(null);
      if (!title) {
        // Derive clean title from filename
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an academic file to upload (PDF, PNG, or JPEG).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('academicYear', academicYear);
    formData.append('accessLevel', accessLevel);

    const res = await ApiClient.request('/api/v1/documents', {
      method: 'POST',
      body: formData
    });

    setIsLoading(false);
    if (res.success) {
      setSuccess('Academic document submitted. Queued for lecturer review and verification.');
      setTimeout(() => {
        onUploaded();
        onClose();
      }, 1800);
    } else {
      setError(res.error?.message || 'Failed to submit document.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Academic Document"
      subtitle="Supported Formats: PDF documents and photo/image scans (Max 20MB)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#A3D9B5] text-xs text-[#2D6A4F] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* File Drop Area */}
        <div className="border-2 border-dashed border-[#DDD8CF] hover:border-[#8A3E12] rounded-xl p-5 text-center bg-[#F7F5F1] transition-colors">
          <input
            type="file"
            id="file-upload"
            accept=".pdf,image/png,image/jpeg"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#EDE9E2] flex items-center justify-center text-[#8A3E12] mb-2 shadow-xs">
              {file && file.type.startsWith('image/') ? (
                <ImageIcon className="w-6 h-6" />
              ) : (
                <FileText className="w-6 h-6" />
              )}
            </div>
            {file ? (
              <div>
                <p className="text-sm font-bold text-[#1C1A17]">{file.name}</p>
                <p className="text-xs text-[#726B62]">{(file.size / (1024 * 1024)).toFixed(2)} MB • Click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-[#1C1A17]">Choose document or photo scan</p>
                <p className="text-xs text-[#726B62] mt-0.5">PDF, PNG, or JPEG up to 20MB</p>
              </div>
            )}
          </label>
        </div>

        {/* Course and Category Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1">
              Associated Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12]"
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1">
              Document Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12]"
              required
            >
              <option value="LECTURE_NOTE">Lecture Notes</option>
              <option value="PAST_QUESTION">Past Exam Questions</option>
              <option value="STUDY_GUIDE">Study Guide / Summary</option>
              <option value="LAB_MANUAL">Lab Manual</option>
              <option value="SYLLABUS">Course Syllabus</option>
              <option value="OTHER">Other Academic Resource</option>
            </select>
          </div>
        </div>

        <Input
          label="Document Title"
          placeholder="e.g. Complete Dynamic Programming Proofs & Notes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Academic Term / Year"
            placeholder="e.g. 2025/2026"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1">
              Access Restriction
            </label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white text-[#1C1A17] rounded-lg border border-[#C4BEB4] focus:border-[#8A3E12] focus:ring-1 focus:ring-[#8A3E12]"
            >
              <option value="PUBLIC">Public (All verified visitors)</option>
              <option value="STUDENT_ONLY">Student Only (Institutional login required)</option>
            </select>
          </div>
        </div>

        <Textarea
          label="Description / Context"
          placeholder="Summarize the core topics covered in this resource..."
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isLoading}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Submit for Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};
