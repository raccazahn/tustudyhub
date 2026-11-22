/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Feedback & Support Modal
 * Allows users and visitors to submit platform feedback, bug reports, and course content requests.
 */

import React, { useState } from 'react';
import { MessageSquare, Star, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { Modal } from '../ui/Modal.tsx';
import { Input, Textarea } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { ApiClient } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { FeedbackCategory } from '../../types/index.ts';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<FeedbackCategory>('PLATFORM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [userName, setUserName] = useState(user?.fullName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const categories: Array<{ id: FeedbackCategory; label: string; desc: string }> = [
    { id: 'PLATFORM', label: 'General Experience', desc: 'Interface, speed, and usability' },
    { id: 'COURSE_CONTENT', label: 'Course Materials', desc: 'Missing past questions, notes, or syllabi' },
    { id: 'VERIFICATION', label: 'Verification & Stamps', desc: 'QR codes, document hashes, or audit stamps' },
    { id: 'BUG', label: 'Bug / Technical Issue', desc: 'Errors or unexpected behavior' },
    { id: 'FEATURE_REQUEST', label: 'Feature Suggestion', desc: 'New ideas for TuStudyHub' },
    { id: 'OTHER', label: 'Other Inquiries', desc: 'General institutional communication' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Please provide both a summary title and detailed description.');
      return;
    }

    setIsSubmitting(true);

    const res = await ApiClient.request('/api/v1/feedback', {
      method: 'POST',
      body: JSON.stringify({
        category,
        title: title.trim(),
        description: description.trim(),
        rating,
        userEmail: userEmail.trim() || undefined,
        userName: userName.trim() || undefined
      })
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setTitle('');
        setDescription('');
        onClose();
      }, 1800);
    } else {
      setError(res.error?.message || 'Failed to submit feedback. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Institutional Feedback & Support"
      subtitle="Help improve TuStudyHub academic exchange and verification"
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#2D6A4F] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#1C1A17]">Thank You for Your Feedback!</h3>
          <p className="text-xs text-[#726B62] max-w-sm mx-auto">
            Your submission has been delivered directly to the academic administrator review queue.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1.5">
              Feedback Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    category === c.id
                      ? 'border-[#8A3E12] bg-[#FBF1E6] ring-1 ring-[#8A3E12]'
                      : 'border-[#DDD8CF] bg-white hover:border-[#8A3E12]/40'
                  }`}
                >
                  <div className="font-bold text-xs text-[#1C1A17]">{c.label}</div>
                  <div className="text-[10px] text-[#726B62] mt-0.5 line-clamp-1">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A463F] mb-1">
              Overall Experience Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-[#C4BEB4] hover:text-[#D97706] transition-colors focus:outline-none"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= rating ? 'fill-[#D97706] text-[#D97706]' : 'text-[#C4BEB4]'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-[#726B62] ml-2">
                {rating === 5 ? 'Exceptional' : rating === 4 ? 'Very Good' : rating === 3 ? 'Satisfactory' : rating === 2 ? 'Needs Improvement' : 'Poor'}
              </span>
            </div>
          </div>

          <Input
            label="Feedback Summary / Title"
            placeholder="e.g. Request for past questions or dark mode suggestion"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Detailed Description"
            placeholder="Provide context, specific course codes, or steps to reproduce if reporting an issue."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input
                label="Your Name (Optional)"
                placeholder="e.g. Amina Musa"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <Input
                label="Your Email (Optional, for follow-up)"
                placeholder="e.g. scholar@tustudyhub.edu"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-[#DDD8CF]">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="font-bold flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Send Feedback'}</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
