import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [experiments] = useState([
    {
      id: 1,
      title: 'Effect of Temperature on Reaction Rate',
      description: 'Study the relationship between temperature and reaction rate using Na₂S₂O₃ and HCl',
      status: 'active',
      difficulty: 'Intermediate',
      duration: '45 minutes',
    },
    {
      id: 2,
      title: 'Acid-Base Titration',
      description: 'Perform titration between HCl and NaOH to determine concentration',
      status: 'upcoming',
      difficulty: 'Advanced',
      duration: '60 minutes',
    },
  ]);

  const handleStartExperiment = (experimentId) => {
    navigate(`/experiment/${experimentId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Available Experiments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select an experiment to begin your virtual lab session
            </Typography>
          </Paper>
        </Grid>

        {experiments.map((experiment) => (
          <Grid item xs={12} md={6} key={experiment.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScienceIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">{experiment.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {experiment.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={experiment.difficulty}
                    color={experiment.difficulty === 'Advanced' ? 'error' : 'primary'}
                    size="small"
                  />
                  <Chip
                    label={experiment.duration}
                    color="default"
                    size="small"
                  />
                  <Chip
                    label={experiment.status}
                    color={experiment.status === 'active' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handleStartExperiment(experiment.id)}
                  disabled={experiment.status !== 'active'}
                  fullWidth
                >
                  Start Experiment
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default StudentDashboard; 