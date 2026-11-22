import React from 'react';
import { Lock, UserPlus, LogIn, X } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Modal } from '../ui/Modal.tsx';

interface VisitorActionGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: string; // e.g., "Download Document", "Take Quiz"
  onRegister: () => void;
  onLogin: () => void;
}

export const VisitorActionGateModal: React.FC<VisitorActionGateModalProps> = ({ isOpen, onClose, action, onRegister, onLogin }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Required" maxWidth="sm">
      <div className="space-y-4 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center">
          <Lock className="w-8 h-8 text-[#B91C1C]" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-[#1C1A17]">Visitor View-Only Mode</h3>
          <p className="text-sm text-[#726B62] leading-relaxed">
            To <strong>{action}</strong>, you must have a registered student or faculty account.
            This ensures secure access, tracks your academic progress, and prevents unauthorized distribution of institutional resources.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => { onClose(); onRegister(); }}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="w-full"
          >
            Create Free Account
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { onClose(); onLogin(); }}
            leftIcon={<LogIn className="w-4 h-4" />}
            className="w-full"
          >
            Sign In
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full text-[#726B62]"
          >
            Continue Browsing as Visitor
          </Button>
        </div>
      </div>
    </Modal>
  );
};
