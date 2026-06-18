import React from 'react';
import { Button, Box, Tooltip } from '@mui/material';
import { WhatsApp as WhatsAppIcon, Twitter as TwitterIcon } from '@mui/icons-material';

export default function SocialShare({ trackingNo, title, status }) {
  const shareText = `Check my Delhi CM Grievance Status! Tracking ID: ${trackingNo} - ${title}. Current Status: ${status.toUpperCase()}. Track here: ${window.location.origin}/track`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=DelhiGrievanceRedressal,NCTDelhi`;

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Share tracking info via WhatsApp" arrow>
        <Button
          variant="outlined"
          color="success"
          size="small"
          startIcon={<WhatsAppIcon />}
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '6px'
          }}
        >
          WhatsApp
        </Button>
      </Tooltip>

      <Tooltip title="Share tracking info on Twitter (X)" arrow>
        <Button
          variant="outlined"
          color="info"
          size="small"
          startIcon={<TwitterIcon />}
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '6px'
          }}
        >
          Twitter / X
        </Button>
      </Tooltip>
    </Box>
  );
}
