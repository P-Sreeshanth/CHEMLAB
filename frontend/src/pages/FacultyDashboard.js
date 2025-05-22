import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

const API_BASE_URL = 'http://localhost:5000/api';

const FacultyDashboard = () => {
  const [experiments, setExperiments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentExperiment, setCurrentExperiment] = useState({
    title: '',
    description: '',
    expectedReaction: '',
    evaluationCriteria: '',
  });
  const [selectedExperimentId, setSelectedExperimentId] = useState(null);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [openSubmissionDialog, setOpenSubmissionDialog] = useState(false);

  // Fetch experiments on component mount
  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      console.log('Attempting to fetch experiments...');
      const response = await fetch(`${API_BASE_URL}/experiments`);
      if (!response.ok) {
        console.error('Failed to fetch experiments:', response.status, response.statusText);
        throw new Error('Failed to fetch experiments');
      }
      const data = await response.json();
      console.log('Experiments fetched successfully:', data);
      setExperiments(data);
    } catch (err) {
      console.error('Error loading experiments:', err);
      setError('Error loading experiments: ' + err.message);
    }
  };

  const fetchSubmissions = async (experimentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}/submissions`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setStudentSubmissions(data);
    } catch (err) {
      setError('Error loading submissions: ' + err.message);
    }
  };

  const handleOpenDialog = (experiment = null) => {
    if (experiment) {
      setCurrentExperiment(experiment);
    } else {
      setCurrentExperiment({ title: '', description: '', expectedReaction: '', evaluationCriteria: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentExperiment({ title: '', description: '', expectedReaction: '', evaluationCriteria: '' });
  };

  const handleViewSubmissions = (experimentId) => {
    console.log('View Submissions clicked for experiment ID:', experimentId);
    setSelectedExperimentId(experimentId);
    fetchSubmissions(experimentId);
  };

  const handleOpenSubmissionDialog = (submission) => {
    setSelectedSubmission(submission);
    setOpenSubmissionDialog(true);
  };

  const handleCloseSubmissionDialog = () => {
    setOpenSubmissionDialog(false);
    setSelectedSubmission(null);
    if (selectedExperimentId) {
      fetchSubmissions(selectedExperimentId);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentExperiment({ ...currentExperiment, [name]: value });
  };

  const handleSaveExperiment = async () => {
    const method = currentExperiment.id ? 'PUT' : 'POST';
    const url = currentExperiment.id
      ? `${API_BASE_URL}/experiments/${currentExperiment.id}`
      : `${API_BASE_URL}/experiments`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentExperiment),
      });

      if (!response.ok) throw new Error('Failed to save experiment');
      setSuccess(`Experiment ${currentExperiment.id ? 'updated' : 'added'} successfully!`);
      handleCloseDialog();
      fetchExperiments();
    } catch (err) {
      setError('Error saving experiment: ' + err.message);
    }
  };

  const handleDeleteExperiment = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete experiment');
      setSuccess('Experiment deleted successfully!');
      fetchExperiments();
      if (selectedExperimentId === id) {
        setSelectedExperimentId(null);
        setStudentSubmissions([]);
      }
    } catch (err) {
      setError('Error deleting experiment: ' + err.message);
    }
  };

  const handleSubmissionInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'totalMarks') {
      setSelectedSubmission({
        ...selectedSubmission,
        [name]: value === '' ? null : parseInt(value, 10),
      });
    } else if (name.startsWith('evaluation.')) {
      const [_, criteria] = name.split('.');
      setSelectedSubmission({
        ...selectedSubmission,
        evaluation: {
          ...selectedSubmission.evaluation,
          [criteria]: {
            ...selectedSubmission.evaluation[criteria],
            feedback: value,
          },
        },
      });
    } else {
      setSelectedSubmission({ ...selectedSubmission, [name]: value });
    }
  };

  const handleSaveSubmission = async () => {
    if (!selectedSubmission || !selectedSubmission.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedSubmission.status,
          totalMarks: selectedSubmission.totalMarks,
          evaluation: selectedSubmission.evaluation,
          overallFeedback: selectedSubmission.overallFeedback,
        }),
      });

      if (!response.ok) throw new Error('Failed to save submission');
      setSuccess('Submission evaluated successfully!');
      handleCloseSubmissionDialog();
    } catch (err) {
      setError('Error saving submission: ' + err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Manage Experiments</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add New Experiment</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Existing Experiments</Typography>
            <List>
              {experiments.map((experiment) => {
                console.log('Rendering experiment:', experiment.id, experiment.title);
                return (
                  <ListItem key={experiment.id} divider>
                    <ListItemText primary={experiment.title} secondary={`Status: ${experiment.status}`} />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="edit" onClick={() => handleOpenDialog(experiment)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteExperiment(experiment.id)}>
                        <DeleteIcon />
                      </IconButton>
                      <Button variant="outlined" size="small" sx={{ ml: 1 }} onClick={() => handleViewSubmissions(experiment.id)}>
                        View Submissions
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {selectedExperimentId && (
          <Grid item xs={12} key={selectedExperimentId}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Submissions for Experiment {selectedExperimentId}</Typography>
              {studentSubmissions.length > 0 ? (
                <List>
                  {studentSubmissions.map((submission) => (
                    <ListItem key={submission.id} divider>
                      <ListItemText primary={submission.studentName} secondary={`Submitted On: ${submission.submissionDate}`} />
                      <ListItemSecondaryAction>
                        <Button variant="outlined" size="small" onClick={() => handleOpenSubmissionDialog(submission)}>
                          {submission.status === 'Pending Evaluation' ? 'Evaluate' : 'View Evaluation'}
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">No submissions for this experiment yet.</Typography>
              )}
            </Paper>
          </Grid>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>{currentExperiment.id ? 'Edit Experiment' : 'Add New Experiment'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              name="title"
              fullWidth
              value={currentExperiment.title}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={4}
              value={currentExperiment.description}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              label="Expected Reaction"
              name="expectedReaction"
              fullWidth
              value={currentExperiment.expectedReaction}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              label="Evaluation Criteria"
              name="evaluationCriteria"
              fullWidth
              multiline
              rows={2}
              value={currentExperiment.evaluationCriteria}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveExperiment}>{currentExperiment.id ? 'Update' : 'Add'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openSubmissionDialog} onClose={handleCloseSubmissionDialog} fullWidth maxWidth="md">
          <DialogTitle>{selectedSubmission?.status === 'Pending Evaluation' ? 'Evaluate Submission' : 'Submission Details'}</DialogTitle>
          <DialogContent dividers>
            {selectedSubmission && (
              <Box>
                <Typography variant="h6" gutterBottom>Student: {selectedSubmission.studentName}</Typography>
                <Typography variant="body2" color="textSecondary">Submitted On: {selectedSubmission.submissionDate}</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>Status: {selectedSubmission.status}</Typography>

                <Box sx={{ mt: 3, p: 2, border: '1px dashed grey' }}>
                  <Typography variant="h6">Simulated Results</Typography>
                  <Typography variant="body1">Chemicals Used: {selectedSubmission.simulatedResults?.chemicalsUsed?.join(', ')}</Typography>
                  <Typography variant="body1">Temperature: {selectedSubmission.simulatedResults?.temperature}°C</Typography>
                  <Typography variant="body1">Reaction Equation: {selectedSubmission.simulatedResults?.reactionEquation}</Typography>
                  <Typography variant="body1">Reaction Observation: {selectedSubmission.simulatedResults?.reactionObservation}</Typography>
                </Box>

                {selectedSubmission.status === 'Pending Evaluation' ? (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>Evaluation</Typography>
                    <TextField
                      margin="dense"
                      label="Total Marks Awarded"
                      name="totalMarks"
                      type="number"
                      fullWidth
                      value={selectedSubmission.totalMarks !== null ? selectedSubmission.totalMarks : ''}
                      onChange={handleSubmissionInputChange}
                      InputProps={{
                        inputProps: { min: 0, max: 100 }
                      }}
                    />
                    <TextField
                      margin="dense"
                      label="Overall Feedback"
                      name="overallFeedback"
                      fullWidth
                      multiline
                      rows={4}
                      value={selectedSubmission.overallFeedback}
                      onChange={handleSubmissionInputChange}
                    />
                  </Box>
                ) : (
                  selectedSubmission.totalMarks !== null && (
                    <Box sx={{ mt: 3, p: 2, border: '1px dashed grey' }}>
                      <Typography variant="h6">Evaluation Results</Typography>
                      <Typography variant="body1">Total Marks: {selectedSubmission.totalMarks}</Typography>
                      {selectedSubmission.evaluation && Object.keys(selectedSubmission.evaluation).length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Detailed Feedback:</Typography>
                          {Object.entries(selectedSubmission.evaluation).map(([criteria, detail]) => (
                            <Typography variant="body2" key={criteria}>- {criteria}: {detail.feedback}</Typography>
                          ))}
                        </Box>
                      )}
                      <Typography variant="body1" sx={{ mt: 1 }}>Overall Feedback: {selectedSubmission.overallFeedback}</Typography>
                    </Box>
                  )
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSubmissionDialog}>Close</Button>
            {selectedSubmission?.status === 'Pending Evaluation' && (
              <Button onClick={handleSaveSubmission} variant="contained">Save Evaluation</Button>
            )}
          </DialogActions>
        </Dialog>
      </Grid>
    </Container>
  );
};

export default FacultyDashboard; 