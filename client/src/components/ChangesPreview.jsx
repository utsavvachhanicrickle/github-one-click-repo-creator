import { useState } from 'react';
import { PlusCircle, FileText, CheckCircle, Trash2, AlertCircle } from 'lucide-react';

export default function ChangesPreview({ summary }) {
  if (!summary) return null;

  const { added = [], modified = [], deleted = [], unchangedCount = 0, ignoredCount = 0 } = summary;

  const totalChanges = added.length + modified.length + deleted.length;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between border-b border-(--border) pb-4 select-none">
        <h3 className="text-lg font-extrabold text-(--text-primary)">
          Changes Comparison Preview
        </h3>
        <span className="text-xs font-bold text-(--text-inverse) bg-(--primary) px-2.5 py-1 rounded-full font-mono">
          {totalChanges} changed files
        </span>
      </div>

      {totalChanges === 0 ? (
        <div className="p-6 rounded-2xl bg-(--bg-secondary)/30 border border-dashed border-(--border) text-center select-none">
          <p className="text-sm font-bold text-(--text-primary)">No changes detected</p>
          <p className="text-xs text-(--text-secondary) mt-1">
            Uploaded local folder contents match remote branch files.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {/* Added Files */}
          {added.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-(--success) bg-(--success-bg) border border-(--success-border) px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 select-none">
                <PlusCircle size={12} /> Added ({added.length})
              </span>
              <div className="space-y-1">
                {added.map((path) => (
                  <div
                    key={path}
                    className="p-3 rounded-xl bg-(--bg-secondary)/40 border border-(--border) hover:border-(--success-border) text-xs font-mono text-(--text-primary) break-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-(--success)" />
                    {path}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modified Files */}
          {modified.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 select-none">
                <FileText size={12} /> Modified ({modified.length})
              </span>
              <div className="space-y-1">
                {modified.map((path) => (
                  <div
                    key={path}
                    className="p-3 rounded-xl bg-(--bg-secondary)/40 border border-(--border) hover:border-amber-500/20 text-xs font-mono text-(--text-primary) break-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {path}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Files */}
          {deleted.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-(--danger) bg-(--danger-bg) border border-(--danger-border) px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 select-none">
                <Trash2 size={12} /> Deleted ({deleted.length})
              </span>
              <div className="space-y-1">
                {deleted.map((path) => (
                  <div
                    key={path}
                    className="p-3 rounded-xl bg-(--bg-secondary)/40 border border-(--border) hover:border-(--danger-border) text-xs font-mono text-(--text-primary) break-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-(--danger)" />
                    {path}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meta counters section */}
      <div className="p-4 rounded-2xl bg-(--bg-secondary)/50 border border-(--border) grid grid-cols-2 gap-4 text-xs font-semibold text-(--text-secondary) select-none">
        <div className="flex items-center gap-1.5">
          <CheckCircle size={14} className="text-(--success)" />
          <span>{unchangedCount} Unchanged files</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertCircle size={14} className="text-(--text-secondary)" />
          <span>{ignoredCount} Ignored files</span>
        </div>
      </div>
    </div>
  );
}
