import { Card, CardContent, Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  trend?: number;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color,
  bgColor,
  trend,
  subtitle,
}: StatCardProps) {
  const theme = useTheme();
  const isPositive = trend && trend > 0;

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.06)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.disabled, fontWeight: 500, mb: 0.5 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 700,
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {isPositive ? (
                  <TrendingUp sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: isPositive
                      ? theme.palette.secondary.main
                      : theme.palette.primary.main,
                  }}
                >
                  {Math.abs(trend)}%
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                  vs mes anterior
                </Typography>
              </Box>
            )}
            {subtitle && (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.disabled, mt: 0.5, display: 'block' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 3,
              width: 48,
              height: 48,
              backgroundColor: bgColor,
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
