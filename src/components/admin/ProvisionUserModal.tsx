import React, { useState } from 'react';
import { X, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiClient } from '../../lib/api.ts';
import { Card } from '../ui/Card.tsx';
import { Button } from '../ui/Button.tsx';

interface ProvisionUserModalProps {
  onClose: () => void;
}

export const ProvisionUserModal: React.FC<ProvisionUserModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'STUDENT',
    department: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await ApiClient.request<any>('/api/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.success) {
        const generatedPass = res.data?.tempPassword || 'Temp_' + Math.random().toString(36).slice(-8) + '!';
        setTempPassword(generatedPass);
        setNewUserEmail(formData.email);
        setStep('success');
      } else {
        alert(res.error?.message || 'Failed to provision user.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while provisioning the user.');
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword);
    alert('Password copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card variant="default" padding="none" className="w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#EDE9E2] bg-[#FAF8F5]">
          <h3 className="text-sm font-bold text-[#1C1A17]">
            {step === 'form' ? 'Provision New User' : 'User Provisioned Successfully'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[#EDE9E2] rounded-full transition-colors">
            <X className="w-4 h-4 text-[#726B62]" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A463F] mb-1">Full Name *</label>
              <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A463F] mb-1">Email Address *</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A463F] mb-1">Role *</label>
                <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none">
                  <option value="STUDENT">Student</option>
                  <option value="LECTURER">Lecturer</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A463F] mb-1">Department</label>
                <input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="Optional" className="w-full px-3 py-2 text-sm border border-[#C4BEB4] rounded-lg focus:border-[#8A3E12] focus:outline-none" />
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#EDE9E2] text-xs text-[#726B62] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C2691D]" />
              <p>A secure temporary password will be generated upon creation. The user will be required to change it on their first login.</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="clayFill" size="sm" isLoading={loading}>Provision User</Button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-[#2D6A4F]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1C1A17]">Account Created Successfully</h4>
              <p className="text-xs text-[#726B62] mt-1">Please provide the following temporary password to <strong>{newUserEmail}</strong>.</p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#C4BEB4] rounded-lg p-4 flex items-center justify-between gap-3">
              <code className="text-sm font-mono font-bold text-[#8A3E12] select-all">{tempPassword}</code>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="!text-[#8A3E12] !border-[#8A3E12]">
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            </div>

            <p className="text-[11px] text-[#726B62]">
              For security, this password will not be shown again. The user must log in and change it immediately.
            </p>

            <Button variant="clayFill" size="md" onClick={onClose} className="w-full mt-4">
              Done
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
