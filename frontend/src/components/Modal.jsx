import React, { useEffect } from 'react';
import { colors, typography, spacing, radii, shadows } from '../styles/tokens';
import Button from './Button';

export default function Modal({ title, isOpen = true, onClose, children, footer, maxWidth = '500px' }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing[4],
  };

  const modalStyle = {
    backgroundColor: colors.background.surface,
    borderRadius: radii.xl,
    boxShadow: shadows.xl,
    width: '100%',
    maxWidth,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: typography.fontFamily,
  };

  const headerStyle = {
    padding: `${spacing[4]} ${spacing[6]}`,
    borderBottom: `1px solid ${colors.border.light}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    margin: 0,
  };

  const bodyStyle = {
    padding: spacing[6],
    overflowY: 'auto',
    flex: 1,
  };

  const footerStyle = {
    padding: `${spacing[4]} ${spacing[6]}`,
    borderTop: `1px solid ${colors.border.light}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing[3],
    backgroundColor: colors.background.subtle,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title}</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
              ✕
            </Button>
          )}
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
}
