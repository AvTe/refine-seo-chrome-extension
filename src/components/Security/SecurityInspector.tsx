import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import StatusCheck from '@/components/shared/StatusCheck';
import { calculateSecurityScore, getScoreColor } from '@/utils/scoring';

export default function SecurityInspector() {
  const { analysis } = useAnalysis();
  if (!analysis) return null;
  const { security } = analysis;
  const score = calculateSecurityScore(analysis);
  const color = getScoreColor(score);

  const headers = security.headers || {};

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Security</h1>
          <p className="text-xs text-gray-400 dark:text-zinc-550 mt-0.5">{analysis.site.hostname}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">/ 100</span>
        </div>
      </div>

      {/* HTTPS */}
      <SectionCard title="Transport Security" collapsible={false}>
        <div className="space-y-0">
          <StatusCheck label="HTTPS" status={security.isHTTPS ? 'pass' : 'fail'} detail={security.isHTTPS ? 'Connection is encrypted' : 'Not using HTTPS'} />
          <StatusCheck label="Mixed Content" status={security.mixedContent.count === 0 ? 'pass' : 'fail'} detail={security.mixedContent.count === 0 ? 'No mixed content' : `${security.mixedContent.count} mixed content issue(s)`} />
        </div>
      </SectionCard>

      {/* Security Headers */}
      <SectionCard title="Security Headers">
        <div className="space-y-0">
          <StatusCheck
            label="Strict-Transport-Security"
            status={headers['strict-transport-security'] ? 'pass' : 'fail'}
            detail={headers['strict-transport-security'] || 'Not set'}
          />
          <StatusCheck
            label="Content-Security-Policy"
            status={headers['content-security-policy'] ? 'pass' : 'fail'}
            detail={headers['content-security-policy'] ? 'Policy configured' : 'Not set'}
          />
          <StatusCheck
            label="X-Frame-Options"
            status={headers['x-frame-options'] ? 'pass' : 'fail'}
            detail={headers['x-frame-options'] || 'Not set'}
          />
          <StatusCheck
            label="X-Content-Type-Options"
            status={headers['x-content-type-options'] ? 'pass' : 'fail'}
            detail={headers['x-content-type-options'] || 'Not set'}
          />
          <StatusCheck
            label="Referrer-Policy"
            status={headers['referrer-policy'] ? 'pass' : 'warning'}
            detail={headers['referrer-policy'] || 'Not set'}
          />
          <StatusCheck
            label="Permissions-Policy"
            status={headers['permissions-policy'] ? 'pass' : 'warning'}
            detail={headers['permissions-policy'] ? 'Configured' : 'Not set'}
          />
        </div>
      </SectionCard>

      {/* Cookies */}
      <SectionCard title="Cookies" badge={<span className="badge badge-neutral">{security.cookies.count}</span>} defaultOpen={false}>
        {security.cookies.count === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500">No cookies detected</p>
        ) : (
          <div className="space-y-1">
            {security.cookies.items.map((cookie: { name: string }, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border-light dark:border-zinc-800/40 last:border-0">
                <span className="text-gray-700 dark:text-zinc-300 font-mono text-xs">{cookie.name}</span>
                <span className="badge badge-warning text-2xs">JS Accessible</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* External Scripts */}
      <SectionCard title="External Scripts" badge={<span className="badge badge-neutral">{security.externalScripts.count}</span>} defaultOpen={false}>
        {security.externalScripts.count === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500">No external scripts</p>
        ) : (
          <div className="space-y-1">
            {security.externalScripts.items.slice(0, 10).map((script: { src: string; integrity: string | null }, i: number) => (
              <div key={i} className="text-xs py-1.5 border-b border-border-light dark:border-zinc-800/40 last:border-0">
                <p className="text-gray-600 dark:text-zinc-400 truncate">{script.src}</p>
                <div className="flex gap-2 mt-0.5">
                  <StatusCheck
                    label="SRI"
                    status={script.integrity ? 'pass' : 'warning'}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Vulnerabilities */}
      {(security.passwordOverHTTP || security.insecureForms.count > 0) && (
        <SectionCard title="Vulnerabilities">
          <div className="space-y-0">
            {security.passwordOverHTTP && (
              <StatusCheck label="Password field over HTTP" status="fail" detail="Credentials can be intercepted" />
            )}
            {security.insecureForms.count > 0 && (
              <StatusCheck label="Insecure form actions" status="fail" detail={`${security.insecureForms.count} form(s) submit over HTTP`} />
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
