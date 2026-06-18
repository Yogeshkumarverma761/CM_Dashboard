import React from 'react';
import { Chip, Box } from '@mui/material';

export default function StatusBadge({ status }) {
  const getStatusStyles = (st) => {
    switch (st) {
      case 'pending':
        return { label: 'Pending Routing', color: '#64748B', bgColor: '#F1F5F9' };
      case 'assigned':
        return { label: 'Assigned', color: '#1E40AF', bgColor: '#DBEAFE' };
      case 'in_progress':
        return { label: 'In Progress', color: '#D97706', bgColor: '#FEF3C7' };
      case 'resolved':
        return { label: 'Resolved', color: '#047857', bgColor: '#D1FAE5' };
      case 'reopened':
        return { label: 'Reopened', color: '#B91C1C', bgColor: '#FEE2E2' };
      case 'escalated':
        return { label: 'Escalated to CM', color: '#7F1D1D', bgColor: '#FFE4E6' };
      default:
        return { label: st, color: '#334155', bgColor: '#E2E8F0' };
    }
  };

  const { label, color, bgColor } = getStatusStyles(status);

  return (
    <Chip
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          {status === 'escalated' && (
            <Box sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#B91C1C',
              animation: 'blink 1.2s infinite ease-in-out',
              '@keyframes blink': {
                '0%, 100%': { opacity: 0.2 },
                '50%': { opacity: 1 }
              }
            }} />
          )}
          {label}
        </Box>
      }
      sx={{
        fontWeight: 700,
        fontSize: '0.75rem',
        color: color,
        backgroundColor: bgColor,
        fontFamily: '"Inter", sans-serif',
        height: 24,
        borderRadius: '6px',
        border: `1px solid ${color}30`
      }}
    />
  );
}
