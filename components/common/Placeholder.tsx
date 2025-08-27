import React from 'react';

interface PlaceholderProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  action?: React.ReactNode;
  layout?: 'card' | 'inline' | 'compact';
}

export const Placeholder: React.FC<PlaceholderProps> = ({ icon, title, message, action, layout = 'card' }) => {
  if (layout === 'inline') {
    return (
      <div className="text-center py-8 px-4 text-text-muted">
        {icon && <div className="mx-auto h-10 w-10">{icon}</div>}
        {title && <h3 className="mt-2 text-md font-semibold text-text-default">{title}</h3>}
        <p className="mt-1 text-sm">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className="text-center py-4 px-2 text-sm text-text-muted italic">
        <p>{message}</p>
      </div>
    );
  }

  // 'card' layout
  return (
    <div className="text-center py-16 px-6 bg-card rounded-xl shadow-sm border border-border">
      {icon && <div className="mx-auto h-12 w-12 text-text-muted">{icon}</div>}
      {title && <h2 className="mt-4 text-xl font-semibold text-text-default">{title}</h2>}
      <p className="mt-2 text-text-muted">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
