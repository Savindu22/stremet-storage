import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import InboxIcon from '@mui/icons-material/InboxOutlined';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Paper variant="outlined" sx={{ py: 5, px: 3, textAlign: 'center' }}>
      <Stack alignItems="center" spacing={1}>
        <InboxIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
        <Typography variant="subtitle1" color="text.primary">
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" maxWidth={480}>
            {description}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
