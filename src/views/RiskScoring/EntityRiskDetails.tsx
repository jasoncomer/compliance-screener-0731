import React from 'react';
import { RiskScoringResponse } from '../../types/riskScoring';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Language as WebIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Twitter as TwitterIcon,
  Telegram as TelegramIcon,
} from '@mui/icons-material';

interface EntityRiskDetailsProps {
  riskScores: RiskScoringResponse;
}

const EntityRiskDetails: React.FC<EntityRiskDetailsProps> = ({ riskScores }) => {
  const { sot } = riskScores;
  if (!sot) return null;

  const ContactItem = ({ icon, value, link }: { icon: React.ReactNode; value?: string; link?: string }) => {
    if (!value) return null;
    const content = (
      <Box display="flex" alignItems="center" mb={1}>
        <Box mr={1}>{icon}</Box>
        <Typography>{value}</Typography>
      </Box>
    );
    return link ? <Link href={link} target="_blank" rel="noopener noreferrer">{content}</Link> : content;
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={sot.logo}
                  alt={sot.proper_name}
                  sx={{ width: 100, height: 100, mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  {sot.proper_name || sot.entity_id}
                </Typography>
                <Typography color="textSecondary">
                  {sot.entity_type}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom>Contact Information</Typography>
              <ContactItem icon={<WebIcon />} value={sot.url} link={sot.url} />
              <ContactItem icon={<EmailIcon />} value={sot.contact_email} link={`mailto:${sot.contact_email}`} />
              <ContactItem icon={<PhoneIcon />} value={sot.contact_phone} />
              <ContactItem icon={<LocationIcon />} value={sot.contact_address} />
              <ContactItem
                icon={<TwitterIcon />}
                value={sot.contact_twitter}
                link={`https://twitter.com/${sot.contact_twitter}`}
              />
              <ContactItem
                icon={<TelegramIcon />}
                value={sot.contact_telegram}
                link={`https://t.me/${sot.contact_telegram}`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Entity Details</Typography>
              <Box mb={2}>
                <Typography color="textSecondary" gutterBottom>Founded</Typography>
                <Typography>{sot.year_founded || 'Unknown'}</Typography>
              </Box>
              <Box mb={2}>
                <Typography color="textSecondary" gutterBottom>Key Personnel</Typography>
                <Typography>{sot.key_personnel || 'Not available'}</Typography>
              </Box>
              <Box mb={2}>
                <Typography color="textSecondary" gutterBottom>CEO</Typography>
                <Typography>{sot.ceo || 'Not available'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Risk Modifiers</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Factor</TableCell>
                      <TableCell align="right">Impact</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {riskScores.entityRisk.factors.map((modifier, index) => (
                      <TableRow key={index}>
                        <TableCell>{modifier.id}</TableCell>
                        <TableCell align="right">
                          {typeof modifier.score === 'number' ? (modifier.score * 100) + '%' : modifier.score}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Tags and Classifications</Typography>
              <Box mb={2}>
                <Typography color="textSecondary" gutterBottom>Entity Tags</Typography>
                <Grid container spacing={1}>
                  {sot.entity_tags?.map((tag, index) => (
                    <Grid item key={index}>
                      <Chip
                        label={tag}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
              <Box mb={2}>
                <Typography color="textSecondary" gutterBottom>Associated Countries</Typography>
                <Grid container spacing={1}>
                  {sot.associated_countries?.map((country, index) => (
                    <Grid item key={index}>
                      <Chip
                        label={country}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>Status</Typography>
                <Grid container spacing={1}>
                  <Grid item>
                    <Chip
                      label={sot.centralized ? 'Centralized' : 'Decentralized'}
                      color={sot.centralized ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </Grid>
                  <Grid item>
                    <Chip
                      label={sot.no_kyc_req ? 'No KYC' : 'KYC Required'}
                      color={sot.no_kyc_req ? 'error' : 'success'}
                      size="small"
                    />
                  </Grid>
                  {sot.dead && (
                    <Grid item>
                      <Chip
                        label="Inactive/Dead"
                        color="error"
                        size="small"
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EntityRiskDetails; 