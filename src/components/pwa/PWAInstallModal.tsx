import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Apple } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Modal } from '../ui/Modal.tsx';
import { usePWA } from '../../context/PWAContext.tsx';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { canInstall, isIOS, isAndroid, promptInstall } = usePWA();
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(isIOS ? 'ios' : isAndroid ? 'android' : 'desktop');
    }
  }, [isOpen, isIOS, isAndroid]);

  const handleInstallClick = async () => {
    await promptInstall();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install TuStudyHub" maxWidth="lg">
      <div className="space-y-6">
        <p className="text-sm text-[#4A463F] leading-relaxed">
          Install TuStudyHub to your device for quick access, offline capabilities, and a seamless, app-like experience without visiting an app store.
        </p>

        {/* Tabs */}
        <div className="flex border-b border-[#DDD8CF]">
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 pb-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'ios' ? 'text-[#8A3E12] border-b-2 border-[#8A3E12]' : 'text-[#726B62] hover:text-[#1C1A17]'
            }`}
          >
            <Apple className="w-4 h-4" /> iOS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 pb-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'android' ? 'text-[#8A3E12] border-b-2 border-[#8A3E12]' : 'text-[#726B62] hover:text-[#1C1A17]'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Android
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 pb-2 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'desktop' ? 'text-[#8A3E12] border-b-2 border-[#8A3E12]' : 'text-[#726B62] hover:text-[#1C1A17]'
            }`}
          >
            <Monitor className="w-4 h-4" /> Desktop
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[200px]">
          {activeTab === 'ios' && (
            <div className="space-y-4 text-sm text-[#4A463F]">
              <p className="font-semibold text-[#1C1A17]">How to install on iPhone or iPad:</p>
              <ol className="list-decimal list-inside space-y-2 ml-1">
                <li>Open this website in <strong>Safari</strong>.</li>
                <li>Tap the <strong>Share</strong> icon (a square with an arrow pointing up) at the bottom of the screen.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>"Add"</strong> in the top right corner.</li>
              </ol>
              <p className="text-xs text-[#726B62] mt-4">
                Note: Installation is only supported in Safari. Other browsers on iOS do not support home screen installation.
              </p>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-4 text-sm text-[#4A463F]">
              <p className="font-semibold text-[#1C1A17]">How to install on Android:</p>
              <ol className="list-decimal list-inside space-y-2 ml-1">
                <li>Open this website in <strong>Chrome</strong> or <strong>Edge</strong>.</li>
                <li>Tap the <strong>Menu</strong> icon (three vertical dots) in the top right corner.</li>
                <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li>Confirm by tapping <strong>"Install"</strong> or <strong>"Add"</strong>.</li>
              </ol>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-4 text-sm text-[#4A463F]">
              <p className="font-semibold text-[#1C1A17]">How to install on Desktop:</p>
              <ol className="list-decimal list-inside space-y-2 ml-1">
                <li>Open this website in <strong>Chrome</strong> or <strong>Edge</strong>.</li>
                <li>Look for the <strong>Install</strong> icon (a computer screen with a down arrow) in the right side of the address bar.</li>
                <li>Click the icon and select <strong>"Install"</strong>.</li>
                <li>Alternatively, open the browser menu and select <strong>"Install TuStudyHub"</strong>.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#EDE9E2]">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          {canInstall && (
            <Button variant="primary" onClick={handleInstallClick} leftIcon={<Download className="w-4 h-4" />}>
              Install Now
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
