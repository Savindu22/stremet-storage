'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MuiButton from '@mui/material/Button';

const STORAGE_KEY = 'stremet_worker_name';

interface WorkerSessionContextValue {
  workerName: string;
  setWorkerName: (name: string) => void;
  clearWorker: () => void;
  promptWorker: () => void;
}

const WorkerSessionContext = createContext<WorkerSessionContextValue>({
  workerName: '',
  setWorkerName: () => {},
  clearWorker: () => {},
  promptWorker: () => {},
});

export function useWorkerSession() {
  return useContext(WorkerSessionContext);
}

export function WorkerSessionProvider({ children }: { children: ReactNode }) {
  const [workerName, setWorkerNameState] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInput, setDialogInput] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setWorkerNameState(stored);
    setLoaded(true);
  }, []);

  // Show prompt if no worker is set after loading
  useEffect(() => {
    if (loaded && !workerName) {
      setDialogOpen(true);
    }
  }, [loaded, workerName]);

  const setWorkerName = (name: string) => {
    setWorkerNameState(name);
    localStorage.setItem(STORAGE_KEY, name);
  };

  const clearWorker = () => {
    setWorkerNameState('');
    localStorage.removeItem(STORAGE_KEY);
    setDialogOpen(true);
  };

  const promptWorker = () => {
    setDialogInput(workerName);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    const trimmed = dialogInput.trim();
    if (!trimmed) return;
    setWorkerName(trimmed);
    setDialogOpen(false);
  };

  return (
    <WorkerSessionContext.Provider value={{ workerName, setWorkerName, clearWorker, promptWorker }}>
      {children}

      <Dialog
        open={dialogOpen}
        onClose={workerName ? () => setDialogOpen(false) : undefined}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown={!workerName}
      >
        <DialogTitle sx={{ fontSize: 15 }}>
          {workerName ? 'Change worker' : 'Who\'s working?'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>
            Your name will be used for all check-ins, check-outs, and moves this session.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="e.g. Mikko, Jari, Sanna..."
            value={dialogInput}
            onChange={e => setDialogInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
            sx={{ '& .MuiInputBase-root': { fontSize: 16 } }}
          />
        </DialogContent>
        <DialogActions>
          {workerName && (
            <MuiButton onClick={() => setDialogOpen(false)}>Cancel</MuiButton>
          )}
          <MuiButton variant="contained" onClick={handleConfirm} disabled={!dialogInput.trim()}>
            {workerName ? 'Change' : 'Start working'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </WorkerSessionContext.Provider>
  );
}

/** Small chip for the header showing current worker with click-to-change */
export function WorkerBadge() {
  const { workerName, promptWorker } = useWorkerSession();

  if (!workerName) return null;

  return (
    <Chip
      label={workerName}
      size="small"
      onClick={promptWorker}
      sx={{
        bgcolor: 'rgba(255,255,255,0.12)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
