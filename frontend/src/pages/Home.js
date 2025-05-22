import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import SchoolIcon from '@mui/icons-material/School';
import BiotechIcon from '@mui/icons-material/Biotech';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Chemistry Lab Simulator
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Experience interactive chemistry experiments in a virtual environment
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          Get Started
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
            <ScienceIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Interactive Experiments
            </Typography>
            <Typography color="text.secondary">
              Perform virtual chemistry experiments with realistic 3D models and real-time data visualization
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Learn by Doing
            </Typography>
            <Typography color="text.secondary">
              Understand chemical reactions through hands-on virtual experiments and detailed analysis
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
            <BiotechIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Advanced Features
            </Typography>
            <Typography color="text.secondary">
              Access AR/VR capabilities, real-time data plotting, and collaborative learning tools
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 