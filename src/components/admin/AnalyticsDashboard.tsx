import React from 'react';
import { BarChart3, TrendingUp, Users, FileCheck } from 'lucide-react';
import { Card } from '../ui/Card.tsx';

export const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-xl border border-[#DDD8CF] shadow-xs">
        <h3 className="text-base font-bold text-[#1C1A17] flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#8A3E12]" />
          <span>Platform Analytics Engine</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default" padding="sm" className="space-y-2">
            <div className="flex items-center gap-2 text-[#726B62]">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Active Scholars</span>
            </div>
            <p className="text-2xl font-black text-[#1C1A17]">1,248</p>
            <span className="text-[11px] text-[#2D6A4F] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% this month
            </span>
          </Card>

          <Card variant="default" padding="sm" className="space-y-2">
            <div className="flex items-center gap-2 text-[#726B62]">
              <FileCheck className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Verified Docs</span>
            </div>
            <p className="text-2xl font-black text-[#1C1A17]">3,892</p>
            <span className="text-[11px] text-[#2D6A4F] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +5% this month
            </span>
          </Card>
        </div>
        <div className="mt-6 p-8 text-center text-xs text-[#726B62] bg-[#FAF8F5] rounded-lg border border-dashed border-[#DDD8CF]">
          <p className="font-semibold text-[#1C1A17]">Advanced visual charts will be integrated here.</p>
          <p className="mt-1">Currently displaying high-level institutional metrics.</p>
        </div>
      </div>
    </div>
  );
};
