import React, { useMemo } from 'react';
import { useGeneration } from '../../contexts/GenerationContext';

interface TreeNode {
  id: string;
  parent_id: string | null;
  title?: string;
  content_preview?: string;
  is_ai_generated: number;
  created_at: string;
  sequence?: number;
  children?: TreeNode[];
}

interface OutlineNode { id: string; parent_id: string | null; title?: string; is_ai_generated: number; created_at: string; }
interface StoryNode { id: string; parent_id: string | null; content_preview?: string; is_ai_generated: number; created_at: string; }

function buildOutlineTree(items: OutlineNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  items.forEach(item => map.set(item.id, { ...item, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    nodes.forEach(n => n.children && sortChildren(n.children));
  };
  sortChildren(roots);
  return roots;
}

function buildStoryTree(items: StoryNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  items.forEach(item => map.set(item.id, { ...item, children: [] }));

  const roots: TreeNode[] = [];
  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children by created_at descending (newest first)
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    nodes.forEach(n => n.children && sortChildren(n.children));
  };
  sortChildren(roots);
  return roots;
}

function VersionNode({
  node,
  depth,
  currentId,
  onClick,
  icon,
  colorClass,
}: {
  node: TreeNode;
  depth: number;
  currentId: string | null;
  onClick: (id: string) => void;
  icon: string;
  colorClass: string;
}) {
  const isCurrent = node.id === currentId;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="version-node" style={{ paddingLeft: `${depth * 24}px` }}>
      <div
        className={`version-item ${isCurrent ? 'version-item--current' : ''} ${hasChildren ? 'version-item--has-children' : ''}`}
        onClick={() => onClick(node.id)}
      >
        {/* Connecting line */}
        {depth > 0 && (
          <div className="version-connector" />
        )}
        {/* Expand icon if has children */}
        {hasChildren && (
          <i className={`${icon} ${colorClass}`} style={{ fontSize: '12px', marginRight: '8px', flexShrink: 0 }}></i>
        )}
        {/* Node content */}
        <div className="version-item-content" style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-200 truncate" style={{ fontSize: '13px' }}>
              {node.title || node.content_preview || `版本`}
            </span>
            <span className="text-xs text-gray-500 shrink-0">{formatDate2(node.created_at)}</span>
          </div>
          <div className="flex gap-1.5 mt-1">
            {node.is_ai_generated ? (
              <span className="version-badge version-badge--ai">AI</span>
            ) : (
              <span className="version-badge version-badge--user">用户修改</span>
            )}
          </div>
        </div>
        {/* Current indicator */}
        {isCurrent && (
          <span className="version-current-tag">当前</span>
        )}
      </div>
      {/* Children */}
      {hasChildren && (
        <div className="version-children">
          {node.children!.map(child => (
            <VersionNode
              key={child.id}
              node={child}
              depth={depth + 1}
              currentId={currentId}
              onClick={onClick}
              icon={icon}
              colorClass={colorClass}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate2(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SectionHeader({ icon, label, colorClass }: { icon: string; label: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <i className={`fa-solid ${icon} ${colorClass}`} style={{ fontSize: '14px' }}></i>
      <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{label}</span>
    </div>
  );
}

const VersionHistoryModal: React.FC = () => {
  const {
    state,
    showVersionHistory,
    setShowVersionHistory,
    versions,
    loadOutlineVersion,
    loadStoryVersion,
    loadKeyframeVersion,
  } = useGeneration();

  const outlineTree = useMemo(() =>
    versions?.outlines ? buildOutlineTree(versions.outlines as OutlineNode[]) : [],
    [versions?.outlines]
  );

  const storyTree = useMemo(() =>
    versions?.stories ? buildStoryTree(versions.stories as StoryNode[]) : [],
    [versions?.stories]
  );

  // Keyframes don't use parent chain — they are flat per story, grouped by story_id
  const keyframeGroups = useMemo(() => {
    if (!versions?.keyframes) return [];
    interface KfItem { id: string; story_id: string | null; sequence?: number; is_ai_generated: number; created_at: string; }
    const groups: Record<string, KfItem[]> = {};
    versions.keyframes.forEach((kf: KfItem) => {
      const sid = kf.story_id || 'unknown';
      if (!groups[sid]) groups[sid] = [];
      groups[sid].push(kf);
    });
    return Object.entries(groups).map(([storyId, kfs]) => ({
      storyId,
      keyframes: kfs.sort((a: KfItem, b: KfItem) => (a.sequence ?? 0) - (b.sequence ?? 0)),
    }));
  }, [versions?.keyframes]);

  if (!showVersionHistory) return null;

  return (
    <div className="dw-modal-overlay" onClick={() => setShowVersionHistory(false)}>
      <div
        className="dw-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="dw-modal-header">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--color-accent)' }}></i>
            <h2 className="dw-modal-title">版本历史</h2>
          </div>
          <button onClick={() => setShowVersionHistory(false)} className="dw-modal-close">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="dw-modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {versions === null ? (
            <div className="flex items-center justify-center py-12">
              <i className="fa-solid fa-spinner fa-spin text-purple-400 text-xl"></i>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>

              {/* 大纲版本 */}
              {outlineTree.length > 0 && (
                <div>
                  <SectionHeader icon="fa-list-check" label={`大纲版本 (${versions.outlines.length})`} colorClass="text-purple-400" />
                  <div className="version-tree">
                    {outlineTree.map(node => (
                      <VersionNode
                        key={node.id}
                        node={node}
                        depth={0}
                        currentId={state.outlineId}
                        onClick={loadOutlineVersion}
                        icon="fa-feather-pointed"
                        colorClass="text-purple-400"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 故事版本 */}
              {storyTree.length > 0 && (
                <div>
                  <SectionHeader icon="fa-book-open" label={`故事版本 (${versions.stories.length})`} colorClass="text-blue-400" />
                  <div className="version-tree">
                    {storyTree.map(node => (
                      <VersionNode
                        key={node.id}
                        node={node}
                        depth={0}
                        currentId={state.storyId}
                        onClick={loadStoryVersion}
                        icon="fa-pen-nib"
                        colorClass="text-blue-400"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 关键帧版本 */}
              {keyframeGroups.length > 0 && (
                <div>
                  <SectionHeader icon="fa-film" label={`关键帧版本 (${versions.keyframes.length})`} colorClass="text-pink-400" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {keyframeGroups.map(group => (
                      <div key={group.storyId} className="glass rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-2">故事: {group.storyId}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {group.keyframes.map((kf: { id: string; sequence?: number; is_ai_generated: number }) => {
                            const isCurrentKf = state.keyframes.some(k => k.id === kf.id);
                            return (
                              <div
                                key={kf.id}
                                className={`kf-version-card ${isCurrentKf ? 'kf-version-card--current' : ''}`}
                                onClick={() => loadKeyframeVersion(kf.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-300">关键帧 {(kf.sequence ?? 0) + 1}</span>
                                  {isCurrentKf && <span className="version-current-tag">当前</span>}
                                </div>
                                <div className="flex gap-1 mt-1">
                                  {kf.is_ai_generated ? (
                                    <span className="version-badge version-badge--ai">AI</span>
                                  ) : (
                                    <span className="version-badge version-badge--user">用户修改</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {versions.outlines.length === 0 && versions.stories.length === 0 && versions.keyframes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 opacity-50">
                  <i className="fa-solid fa-clock-rotate-left text-4xl text-gray-500 mb-3"></i>
                  <p className="text-gray-400 text-sm">暂无版本历史</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .version-tree {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .version-node {
          position: relative;
        }
        .version-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--color-bg-card);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .version-item:hover {
          border-color: var(--color-accent);
          background: var(--color-bg-card-hover);
        }
        .version-item--current {
          border-color: var(--color-accent) !important;
          background: rgba(99, 102, 241, 0.1) !important;
        }
        .version-connector {
          position: absolute;
          left: -12px;
          top: 50%;
          width: 12px;
          height: 1px;
          border-top: 1px solid rgba(255,255,255,0.15);
        }
        .version-node:not(:first-child) .version-connector::before {
          content: '';
          position: absolute;
          left: 0;
          top: -100%;
          width: 1px;
          height: calc(100% + 1px);
          border-left: 1px solid rgba(255,255,255,0.15);
        }
        .version-item-content {
          flex: 1;
          min-width: 0;
        }
        .version-badge {
          display: inline-block;
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 9999px;
          font-weight: 500;
        }
        .version-badge--ai {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
        }
        .version-badge--user {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }
        .version-current-tag {
          font-size: 10px;
          font-weight: 600;
          color: var(--color-accent);
          background: rgba(99, 102, 241, 0.15);
          padding: 2px 8px;
          border-radius: 9999px;
          flex-shrink: 0;
        }
        .kf-version-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .kf-version-card:hover {
          border-color: var(--color-accent);
        }
        .kf-version-card--current {
          border-color: var(--color-accent) !important;
          background: rgba(99, 102, 241, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default VersionHistoryModal;
