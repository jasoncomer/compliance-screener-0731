import React from 'react';
import { RiskScores } from '../../types/newRiskScoring';
import { RiskDetail } from '../../types/riskScoring';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Grid,
  Divider,
} from '@mui/material';

interface RiskScoreDisplayProps {
  riskScores: RiskScores;
  loading?: boolean;
}

const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
  switch (severity) {
    case 'high':
      return '#ff4444';
    case 'medium':
      return '#ffbb33';
    case 'low':
      return '#00C851';
    default:
      return '#757575';
  }
};

const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({ riskScores, loading }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const getRiskSeverity = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const RiskSection = ({ title, risk, details }: { title: string; risk: number; details: RiskDetail[] }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box display="flex" alignItems="center" mb={2}>
          <CircularProgress
            variant="determinate"
            value={risk}
            sx={{
              color: getSeverityColor(getRiskSeverity(risk)),
              mr: 2
            }}
          />
          <Typography variant="h4">{Math.round(risk)}</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={1}>
          {details.map((detail, index) => (
            <Grid item key={index}>
              <Chip
                label={`${detail.factor}: ${Math.round(detail.score)}`}
                sx={{
                  bgcolor: getSeverityColor(detail.severity),
                  color: 'white'
                }}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Overall Risk Score
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center" my={3}>
            <CircularProgress
              variant="determinate"
              value={riskScores.overallRisk || 0}
              size={100}
              thickness={5}
              sx={{
                color: getSeverityColor(getRiskSeverity(riskScores.overallRisk || 0)),
              }}
            />
            <Typography variant="h2" sx={{ position: 'absolute' }}>
              {Math.round(riskScores.overallRisk || 0)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <RiskSection
            title="Entity Risk"
            risk={riskScores.entityRisk}
            details={riskScores.details.entity}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <RiskSection
            title="Jurisdiction Risk"
            risk={riskScores.jurisdictionRisk || 0}
            details={riskScores.details.jurisdiction}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <RiskSection
            title="Transaction Risk"
            risk={riskScores.transactionRisk}
            details={riskScores.details.transaction}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiskScoreDisplay; 