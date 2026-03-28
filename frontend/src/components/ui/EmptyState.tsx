type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="app-frame-soft px-4 py-6 text-center">
      <p className="text-sm font-semibold text-app-text">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-2xl text-[13px] text-app-textMuted">{description}</p> : null}
    </div>
  );
}
