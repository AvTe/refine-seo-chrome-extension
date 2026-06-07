import { useState } from 'react';
import { Info, Key } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

export default function SettingsView() {
  const { apiKey, setApiKey } = useAnalysis();
  const [autoScan, setAutoScan] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Configure RefineAI Inspector</p>
      </div>

      {/* General */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">General</h3>

        <ToggleSetting
          label="Auto-scan on page load"
          description="Automatically analyze pages when you navigate"
          enabled={autoScan}
          onChange={setAutoScan}
        />

        <ToggleSetting
          label="Show notifications"
          description="Alert when critical issues are found"
          enabled={showNotifications}
          onChange={setShowNotifications}
        />
      </div>

      {/* API Configuration */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Key size={14} className="text-primary-dark" />
          AI API Configuration
        </h3>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="api-key-input" className="text-2xs font-semibold text-gray-500 uppercase">Gemini API Key</label>
          <input
            id="api-key-input"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key..."
            className="text-xs px-3 py-1.5 border border-border rounded-md focus:outline-none focus:border-primary"
          />
          <p className="text-3xs text-gray-400">
            Saved locally in browser storage. Enter a valid key to activate live AI answers in the AI Insights panel.
          </p>
        </div>
      </div>

      {/* About */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">About</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Version</span>
            <span className="text-gray-800 font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Build</span>
            <span className="text-gray-800 font-medium font-mono text-xs">
              {new Date().toISOString().split('T')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card bg-primary/5 border-primary/20">
        <div className="flex gap-3">
          <Info size={16} className="text-primary-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">RefineAI Inspector</p>
            <p className="text-xs text-gray-500 mt-1">
              Website Intelligence for WordPress, WooCommerce & Modern Websites.
              Built with React, TypeScript, and Vite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
