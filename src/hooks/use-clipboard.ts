
import { useState, useCallback } from 'react';

export function useClipboard(timeout = 2000) {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setHasCopied(true);
          setTimeout(() => {
            setHasCopied(false);
          }, timeout);
        })
        .catch((error) => {
          console.error('Failed to copy:', error);
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setHasCopied(true);
        setTimeout(() => {
          setHasCopied(false);
        }, timeout);
      } catch (error) {
        console.error('Fallback copy failed:', error);
      }
    }
  }, [timeout]);

  return { copyToClipboard, hasCopied };
}
