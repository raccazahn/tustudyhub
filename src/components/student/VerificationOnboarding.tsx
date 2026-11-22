import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, Clock, FileText, Upload, X } from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import type { TuCollege, TuDepartment } from '../../types/index.ts';

export const VerificationOnboarding: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [colleges, setColleges] = useState<TuCollege[]>([]);
  const [departments, setDepartments] = useState<TuDepartment[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    fullName: user?.fullName || '',
    collegeId: '',
    departmentId: '',
    academicProgramme: '',
    academicStatus: 'Freshman',
    institutionalEmail: '',
    documentType: '' as '' | 'ID_CARD' | 'BILLING_FORM',
    documentPath: ''
  });

  useEffect(() => {
    fetchStatus();
    fetchColleges();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await ApiClient.request<any>('/api/v1/verification/status');
      if (res.success) setStatus(res.data);
    } catch (error) {
      console.error('Failed to fetch verification status:', error);
    }
    setLoading(false);
  };

  const fetchColleges = async () => {
    try {
      const res = await ApiClient.request<TuCollege[]>('/api/v1/academic/colleges');
      if (res.success && res.data) setColleges(res.data);
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  };

  const fetchDepartments = async (collegeId: string) => {
    if (!collegeId) {
      setDepartments([]);
      return;
    }
    setLoadingDepts(true);
    try {
      const res = await ApiClient.request<TuDepartment[]>(`/api/v1/academic/departments?collegeId=${collegeId}`);
      if (res.success && res.data) setDepartments(res.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
    setLoadingDepts(false);
  };

  const handleCollegeChange = (collegeId: string) => {
    setFormData({ ...formData, collegeId, departmentId: '' });
    fetchDepartments(collegeId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    // For now, we'll store the filename as a placeholder
    // In production, you'd upload to your storage service
    setFormData({ ...formData, documentPath: `verification_docs/${user?.id}/${file.name}` });
    alert(`Document "${file.name}" selected. In production, this would be uploaded securely.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const selectedCollege = colleges.find(c => c.id === formData.collegeId);
    const selectedDept = departments.find(d => d.id === formData.departmentId);

    try {
      const res = await ApiClient.request('/api/v1/verification/submit', {
        method: 'POST',
        body: JSON.stringify({
          studentId: formData.studentId,
          fullName: formData.fullName,
          college: selectedCollege?.name || '',
          department: selectedDept?.name || '',
          academicProgramme: formData.academicProgramme,
          academicStatus: formData.academicStatus,
          institutionalEmail: formData.institutionalEmail,
          documentPath: formData.documentPath,
          documentType: formData.documentType || null
        })
      });

      if (res.success) {
        await fetchStatus();
        await refreshProfile();
      } else {
        alert(res.error?.message || 'Submission failed.');
      }
    } catch (error) {
      alert('An error occurred during submission.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-12 text-center text-[#726B62]">Loading verification status...</div>;

  // APPROVED STATE
  if (status?.verificationStatus === 'VERIFIED') {
    return (
      <Card variant="default" padding="lg" className="max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-[#2D6A4F]" />
        </div>
        <h2 className="text-xl font-black text-[#1C1A17]">TU Verification Approved</h2>
        <p className="text-sm text-[#726B62]">
          Your Tubman University student status has been verified. You now have full access to all student features.
        </p>
      </Card>
    );
  }

  // REJECTED / CORRECTION REQUESTED STATE
  if (status?.verificationStatus === 'REJECTED' || status?.verificationStatus === 'CORRECTION_REQUESTED') {
    return (
      <Card variant="default" padding="lg" className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#EDE9E2]">
          <AlertCircle className="w-6 h-6 text-[#B91C1C]" />
          <h2 className="text-lg font-black text-[#1C1A17]">
            Verification {status.verificationStatus === 'REJECTED' ? 'Rejected' : 'Correction Requested'}
          </h2>
        </div>
        <div className="bg-[#FEE2E2] border border-[#FECACA] p-4 rounded-lg text-sm text-[#991B1B]">
          <p className="font-bold mb-1">Administrator Notes:</p>
          <p>{status.adminReviewNotes || 'Please review your submitted information and resubmit.'}</p>
        </div>
        <p className="text-xs text-[#726B62]">Please update your information below and resubmit.</p>
        <VerificationForm
          formData={formData}
          setFormData={setFormData}
          colleges={colleges}
          departments={departments}
          loadingDepts={loadingDepts}
          handleCollegeChange={handleCollegeChange}
          handleFileUpload={handleFileUpload}
          handleSubmit={handleSubmit}
          submitting={submitting}
        />
      </Card>
    );
  }

   // PENDING STATE
  if (status?.verificationStatus === 'PENDING') {
    return (
      <Card variant="default" padding="lg" className="max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#FFF3CD] flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-[#C2691D]" />
        </div>
        <h2 className="text-xl font-black text-[#1C1A17]">Verification Pending Review</h2>
        <p className="text-sm text-[#726B62] max-w-md mx-auto">
          Your Tubman University student verification application has been successfully submitted and is currently awaiting administrator review.
        </p>

        <div className="bg-[#E8F5E9] border border-[#A3D9B5] p-4 rounded-lg text-left space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#2D6A4F]" />
            <p className="text-xs font-bold text-[#2D6A4F]">What happens next?</p>
          </div>
          <ul className="text-xs text-[#1E4D35] space-y-1.5 list-disc list-inside">
            <li>An administrator will review your submitted academic information.</li>
            <li>This process typically takes <strong>24 to 48 hours</strong>.</li>
            <li>You will receive an in-app notification as soon as a decision is made.</li>
            <li>Once approved, you will automatically gain full access to all student features.</li>
          </ul>
        </div>

        <div className="pt-2 text-xs text-[#726B62] bg-[#FAF8F5] p-3 rounded-lg text-left space-y-1 border border-[#EDE9E2]">
          <p><strong>Student ID:</strong> {status.studentId}</p>
          <p><strong>Submitted:</strong> {new Date(status.createdAt).toLocaleDateString()}</p>
        </div>
      </Card>
    );
  }

  // INITIAL SUBMISSION STATE
  return (
    <Card variant="default" padding="lg" className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#EDE9E2]">
  <div className="flex items-center gap-3">
    <Shield className="w-6 h-6 text-[#8A3E12]" />
    <div>
      <h2 className="text-lg font-black text-[#1C1A17]">Tubman University Student Verification</h2>
      <p className="text-xs text-[#726B62]">Required to access quizzes, protected documents, and student features.</p>
    </div>
  </div>
  <button
    onClick={logout}
    className="text-xs font-bold text-[#B91C1C] hover:text-[#991B1B] px-3 py-1.5 rounded-lg hover:bg-[#FEE2E2] transition-colors"
  >
    Sign Out
  </button>
</div>

      <VerificationForm
        formData={formData}
        setFormData={setFormData}
        colleges={colleges}
        departments={departments}
        loadingDepts={loadingDepts}
        handleCollegeChange={handleCollegeChange}
        handleFileUpload={handleFileUpload}
        handleSubmit={handleSubmit}
        submitting={submitting}
      />
    </Card>
  );
};

interface VerificationFormProps {
  formData: any;
  setFormData: (data: any) => void;
  colleges: TuCollege[];
  departments: TuDepartment[];
  loadingDepts: boolean;
  handleCollegeChange: (collegeId: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  formData, setFormData, colleges, departments, loadingDepts,
  handleCollegeChange, handleFileUpload, handleSubmit, submitting
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#4A463F] mb-1">TU Student ID *</label>
          <input
            required
            value={formData.studentId}
            onChange={e => setFormData({...formData, studentId: e.target.value})}
            placeholder="e.g., TVU/2023/00123"
            className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#4A463F] mb-1">Full Name (as registered) *</label>
          <input
            required
            value={formData.fullName}
            onChange={e => setFormData({...formData, fullName: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#4A463F] mb-1">College *</label>
          <select
            required
            value={formData.collegeId}
            onChange={e => handleCollegeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
          >
            <option value="">Select your college...</option>
            {colleges.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#4A463F] mb-1">Department *</label>
          <select
            required
            value={formData.departmentId}
            onChange={e => setFormData({...formData, departmentId: e.target.value})}
            disabled={!formData.collegeId || loadingDepts}
            className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none disabled:bg-[#F7F5F1]"
          >
            <option value="">{loadingDepts ? 'Loading...' : 'Select your department...'}</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#4A463F] mb-1">Academic Programme *</label>
          <input
            required
            value={formData.academicProgramme}
            onChange={e => setFormData({...formData, academicProgramme: e.target.value})}
            placeholder="e.g., BSc Computer Science"
            className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#4A463F] mb-1">Academic Status *</label>
          <select
            required
            value={formData.academicStatus}
            onChange={e => setFormData({...formData, academicStatus: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
          >
            <option value="Freshman">Freshman</option>
            <option value="Sophomore">Sophomore</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-[#4A463F] mb-1">Institutional Email (Optional)</label>
          <input
            type="email"
            value={formData.institutionalEmail}
            onChange={e => setFormData({...formData, institutionalEmail: e.target.value})}
            placeholder="name@tustudyhub.edu"
            className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none"
          />
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="pt-3 border-t border-[#EDE9E2]">
        <label className="block text-xs font-bold text-[#4A463F] mb-2">Supporting Document (Optional)</label>
        <p className="text-[11px] text-[#726B62] mb-3">Upload either your current student ID card or current semester billing form to speed up verification.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <button
            type="button"
            onClick={() => setFormData({...formData, documentType: 'ID_CARD'})}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              formData.documentType === 'ID_CARD'
                ? 'border-[#8A3E12] bg-[#FBF1E6]'
                : 'border-[#DDD8CF] hover:border-[#C4BEB4]'
            }`}
          >
            <p className="text-xs font-bold text-[#1C1A17]">Student ID Card</p>
            <p className="text-[10px] text-[#726B62]">Photo of your current ID</p>
          </button>
          <button
            type="button"
            onClick={() => setFormData({...formData, documentType: 'BILLING_FORM'})}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              formData.documentType === 'BILLING_FORM'
                ? 'border-[#8A3E12] bg-[#FBF1E6]'
                : 'border-[#DDD8CF] hover:border-[#C4BEB4]'
            }`}
          >
            <p className="text-xs font-bold text-[#1C1A17]">Billing Form</p>
            <p className="text-[10px] text-[#726B62]">Current semester billing</p>
          </button>
        </div>

        {formData.documentType && (
          <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-lg border border-[#EDE9E2]">
            <Upload className="w-5 h-5 text-[#8A3E12]" />
            <div className="flex-1">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#8A3E12] file:text-white hover:file:bg-[#6B2F0E]"
              />
            </div>
            {formData.documentPath && (
              <button
                type="button"
                onClick={() => setFormData({...formData, documentPath: '', documentType: ''})}
                className="text-[#B91C1C] hover:text-[#991B1B]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#EDE9E2] text-xs text-[#726B62] flex items-start gap-2">
        <FileText className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Your submission will be reviewed by an administrator. Ensure all details match your official Tubman University records.</p>
      </div>

      <Button type="submit" variant="clayFill" size="md" isLoading={submitting} className="w-full">
        Submit Verification Application
      </Button>
    </form>
  );
};
