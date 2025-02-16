import React from 'react';
import { EntityInfo, RiskScores } from '../../types/riskScoring';
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
  riskScores: RiskScores;
}

const EntityRiskDetails: React.FC<EntityRiskDetailsProps> = ({ riskScores }) => {
  const { entityInfo, riskComponents } = riskScores;
  if (!entityInfo) return null;

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
                  src={entityInfo.logo}
                  alt={entityInfo.proper_name}
                  sx={{ width: 100, height: 100, mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  {entityInfo.proper_name || entityInfo.entity_id}
                </Typography>
                <Typography color="textSecondary">
                  {entityInfo.entity_type}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom>Contact Information</Typography>
              <ContactItem icon={<WebIcon />} value={entityInfo.url} link={entityInfo.url} />
              <ContactItem icon={<EmailIcon />} value={entityInfo.contact_email} link={`mailto:${entityInfo.contact_email}`} />
              <ContactItem icon={<PhoneIcon />} value={entityInfo.contact_phone} />
              <ContactItem icon={<LocationIcon />} value={entityInfo.contact_address} />
              <ContactItem
                icon={<TwitterIcon />}
                value={entityInfo.contact_twitter}
                link={`https://twitter.com/${entityInfo.contact_twitter}`}
              />
              <ContactItem
                icon={<TelegramIcon />}
                value={entityInfo.contact_telegram}
                link={`https://t.me/${entityInfo.contact_telegram}`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Entity Details</Typography>
              <Box mb={2}>
                <Typography color="textSecondary" gutterBottom>Founded</Typography>
                <Typography>{entityInfo.year_founded || 'Unknown'}</Typography>
              </Box>
              <Box mb={2}>
                <Typography color="textSecondary" gutterBottom>Key Personnel</Typography>
                <Typography>{entityInfo.key_personnel || 'Not available'}</Typography>
              </Box>
              <Box mb={2}>
                <Typography color="textSecondary" gutterBottom>CEO</Typography>
                <Typography>{entityInfo.ceo || 'Not available'}</Typography>
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
                    {riskComponents.entityRiskDetails.riskModifiers.map((modifier, index) => (
                      <TableRow key={index}>
                        <TableCell>{modifier.type}</TableCell>
                        <TableCell align="right">
                          {typeof modifier.impact === 'number'
                            ? (modifier.impact > 0 ? '+' : '') + modifier.impact
                            : modifier.impact}
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
                  {entityInfo.entity_tags?.map((tag, index) => (
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
                  {entityInfo.associated_countries?.map((country, index) => (
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
                      label={entityInfo.centralized ? 'Centralized' : 'Decentralized'}
                      color={entityInfo.centralized ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </Grid>
                  <Grid item>
                    <Chip
                      label={entityInfo.kyc_req ? 'KYC Required' : 'No KYC'}
                      color={entityInfo.kyc_req ? 'success' : 'error'}
                      size="small"
                    />
                  </Grid>
                  {entityInfo.dead && (
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