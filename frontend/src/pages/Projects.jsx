import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Modal,
  TextField,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Select,
  MenuItem,
} from "@mui/material";
import { Link } from "react-router-dom";
import ISO6391 from "iso-639-1";
import { backendApi } from "../utils/api";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    title: "",
    commons_url: "",
    language: "en",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState({});

  const supportedLanguages = [
    "as",
    "bn",
    "en",
    "gu",
    "hi",
    "kn",
    "kok",
    "ml",
    "mr",
    "ne",
    "or",
    "pa",
    "sa",
    "sd",
    "ta",
    "te",
    "ur",
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await backendApi.get("/api/project");
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!(await validateFields())) return;

    setIsCreating(true);
    try {
      await backendApi.post("/api/project", newProject);
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateFields = async () => {
    const newErrors = {};
    const commonsRegex = /^https:\/\/commons\.wikimedia\.org\/wiki\/.+$/;

    if (!newProject.title.trim()) {
      newErrors.title = "Title is required.";
    }

    if (!newProject.commons_url.trim()) {
      newErrors.commons_url = "Commons File Page URL is required.";
    } else if (!commonsRegex.test(newProject.commons_url)) {
      newErrors.commons_url = "Must be a valid Wikimedia Commons page URL.";
    } else if (!(await isValidCommonsPage(newProject.commons_url))) {
      newErrors.commons_url = "The Wikimedia Commons page does not exist.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidCommonsPage = async (url) => {
    try {
      const match = url.match(
        /^https:\/\/commons\.wikimedia\.org\/wiki\/(.+)$/
      );
      if (!match) {
        return false;
      }

      const pageTitle = match[1];
      const params = {
        action: "query",
        format: "json",
        titles: encodeURIComponent(pageTitle),
        origin: "*",
      };

      const response = await backendApi.get(
        "https://commons.wikimedia.org/w/api.php",
        { params }
      );
      const data = response.data;
      if (data.query && data.query.pages) {
        const page = Object.values(data.query.pages)[0];
        return !Object.hasOwn(page, "missing");
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <Container>
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
          }}
        >
          <CircularProgress size={40} />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Typography variant="h5">Your Projects</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsModalOpen(true)}
            >
              Create Project
            </Button>
          </Box>

          {/* Projects List */}
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Box
                component={Link}
                to={`/editor/${project.id}`}
                sx={{
                  textDecoration: "none",
                  display: "block",
                }}
              >
                <Card
                  sx={{
                    color: "inherit",
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    boxShadow:
                      "0px 4px 8px rgba(0, 0, 0, 0.15), 0px -4px 8px rgba(0, 0, 0, 0.15)",
                    transition: "box-shadow 0.3s ease, transform 0.3s ease",
                    "&:hover": {
                      boxShadow:
                        "0px 8px 16px rgba(0, 0, 0, 0.2), 0px -8px 16px rgba(0, 0, 0, 0.2)",
                      transform: "scale(1.02)",
                    },
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6">{project.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Language: {ISO6391.getNativeName(project.language) || project.language}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Create Project Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" marginBottom={2}>
            Create New Project
          </Typography>
          <TextField
            label="Title"
            name="title"
            fullWidth
            margin="normal"
            value={newProject.title}
            onChange={handleInputChange}
            error={!!errors.title}
            helperText={errors.title}
          />
          <TextField
            label="Commons File Page URL"
            name="commons_url"
            fullWidth
            margin="normal"
            value={newProject.commons_url}
            onChange={handleInputChange}
            error={!!errors.commons_url}
            helperText={errors.commons_url}
          />
          <Select
            name="language"
            value={newProject.language}
            onChange={handleInputChange}
            fullWidth
            sx={{ marginTop: 2 }}
          >
            {supportedLanguages.map((lng) => (
              <MenuItem key={lng} value={lng}>
                {ISO6391.getNativeName(lng) || lng}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="error">
            {errors.language}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateProject}
              disabled={isCreating}
            >
              {isCreating ? <CircularProgress size={20} /> : "Create"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
};

export default Projects;
