import { useRef,useEffect, useState } from "react";
import {
  Grid,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Modal,
  Typography,
  IconButton,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import WaveformTimeline from "../components/WaveformTimeline";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { backendApi } from "../utils/api";
import { useNavigate } from "react-router-dom";
import SRTParser2 from "srt-parser-2";

const Editor = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const variable = useSelector((state) => state.myVariable.value);
  const [finalUrl,setFinalUrl] = useState(variable)
  const location = useLocation();

  const getVideoDetails= async()=>{
    const id = getLastEditorId();
    try {
      const response = await backendApi.get(`/api/project/${id}`);
      const { video_url } = response.data;
      console.log("Video URL:", video_url);
      const response2 = await getUrl(video_url);
      if (response2!=false){
        setFinalUrl(response2)
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  }

  const getLastEditorId = () => {
    const segments = location.pathname.split("/");
    return segments[segments.length - 1];
  };

  const getUrl = async (url) => {
    try {
      if (!url.includes('commons.wikimedia.org')) {
        return false; 
      }
      const match = url.match(
        /^https:\/\/commons\.wikimedia\.org\/wiki\/(.+)$/
      );
      if (!match) {
        return false;
      }

      const pageTitle = decodeURI(match[1]); // Ensure the title is decoded properly
      console.log("Page Title:", pageTitle);

      const params = {
        action: "query",
        format: "json",
        prop: "videoinfo", // Include 'videoinfo' to get video details
        titles: pageTitle,
        viprop: "user|url|canonicaltitle|comment|url", // Fetch specific video properties
        origin: "*",
      };

      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?${new URLSearchParams(params)}`
      );

      const response = await res.json();
      const { pages } = response.query;

      if (Object.keys(pages)[0] !== '-1') {
        const { url } = pages[Object.keys(pages)[0]].videoinfo[0];
        if (url.length>0){
          return url
        }
      }
    } catch (error) {
    console.error("Error:", error);
    return false;
    }
  };

  useEffect(() => {
    getVideoDetails();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Define the subtitles with their timestamps
  const [subtitles, setSubtitles] = useState([
    { start: 5, end: 10, text: "Subtitle line 1" },
    { start: 11, end: 15, text: "Subtitle line 2" },
    { start: 16, end: 20, text: "Subtitle line 3" },
  ]);

  // Handle subtitle click, seek the video to the specific time
  const handleSubtitleClick = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  // Handle adding new subtitle
  const handleSubtitleAdd = (newSubtitle) => {
    setSubtitles((prev) => [...prev, newSubtitle].sort((a, b) => a.start - b.start));
  };

  // Handle deleting subtitle
  const handleSubtitleDelete = (index) => {
    setSubtitles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle editing subtitle
  const handleEditClick = (subtitle, index) => {
    setEditingSubtitle({ ...subtitle, index });
    setIsEditModalOpen(true);
  };

  // Handle save edited subtitle
  const handleSaveEdit = () => {
    if (editingSubtitle) {
      setSubtitles((prev) =>
        prev.map((sub, index) =>
          index === editingSubtitle.index ? editingSubtitle : sub
        )
      );
      setIsEditModalOpen(false);
      setEditingSubtitle(null);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parser = new SRTParser2();
        let parsedSubtitles = parser.fromSrt(content, true);
        // Convert time format
        parsedSubtitles = parsedSubtitles.map((subtitle) => ({
          start: timeToSeconds(subtitle.startTime),
          end: timeToSeconds(subtitle.endTime),
          text: subtitle.text,
        }));

        setSubtitles(parsedSubtitles);
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error parsing SRT file:", error);
        alert("Failed to parse SRT file. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Grid container sx={{ height: "100vh", backgroundColor: "#121212" }}>
      {/* Video and subtitle list section */}
      <Grid container item xs={12} sx={{ padding: 2, height: "calc(100% - 200px)" }}>
        {/* Video section */}
        <Grid item xs={6} sx={{ padding: 1 }}>
          <Box sx={{ width: "100%", aspectRatio: "16 / 9" }}>
            <video
              ref={videoRef}
              controls
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "8px",
                boxShadow: "0px 0px 30px rgba(255, 255, 255, 0.3)",
              }}
              src={finalUrl}
            ></video>
          </Box>
        </Grid>

        {/* Subtitles list */}
        <Grid item xs={3} sx={{ padding: 1 }}>
          <Box
            sx={{
              backgroundColor: "#202020",
              borderRadius: "8px",
              maxHeight: "600px",
              overflowY: "auto",
              padding: 1,
            }}
          >
            <List dense>
              {subtitles.map((subtitle, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditClick(subtitle, index)}
                        sx={{ color: "white" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleSubtitleDelete(index)}
                        sx={{ color: "white" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    sx={{ color: "#808080", cursor: "pointer" }}
                    primary={`${formatTime(subtitle.start)} - ${formatTime(subtitle.end)}`}
                    secondary={subtitle.text}
                    onClick={() => handleSubtitleClick(subtitle.start)}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>

        {/* Buttons section */}
        <Grid item xs={3} sx={{ padding: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              backgroundColor: "#202020",
              borderRadius: "8px",
              padding: 2,
            }}
          >
            <Button onClick={() => navigate("/projects")} variant="contained" color="primary" fullWidth>
              Back to Project
            </Button>
            <Button variant="contained" color="secondary" fullWidth onClick={() => setIsModalOpen(true)}>
              Upload Subtitles
            </Button>
            <Button variant="contained" color="secondary" fullWidth>
              Download Subtitles
            </Button>
            <Button variant="contained" color="secondary" fullWidth>
              Upload to Commons
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Waveform timeline section */}
      <Grid
        item
        xs={12}
        sx={{
          height: "200px",
          backgroundColor: "#181818",
          padding: 1,
          borderTop: "1px solid #333",
        }}
      >
        <WaveformTimeline
          videoRef={videoRef}
          subtitles={subtitles}
          onSubtitleAdd={handleSubtitleAdd}
          onSubtitleDelete={handleSubtitleDelete}
        />
      </Grid>

      {/* Upload Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: "8px",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Upload Subtitles
          </Typography>
          <Button variant="contained" component="label" fullWidth>
            Select SRT File
            <input type="file" accept=".srt" hidden onChange={handleFileUpload} />
          </Button>
        </Box>
      </Modal>

      {/* Edit Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: "8px",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Edit Subtitle
          </Typography>
          {editingSubtitle && (
            <>
              <TextField
                fullWidth
                label="Start Time (seconds)"
                type="number"
                value={editingSubtitle.start}
                onChange={(e) =>
                  setEditingSubtitle((prev) => ({
                    ...prev,
                    start: Number(e.target.value),
                  }))
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="End Time (seconds)"
                type="number"
                value={editingSubtitle.end}
                onChange={(e) =>
                  setEditingSubtitle((prev) => ({
                    ...prev,
                    end: Number(e.target.value),
                  }))
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Subtitle Text"
                multiline
                rows={3}
                value={editingSubtitle.text}
                onChange={(e) =>
                  setEditingSubtitle((prev) => ({
                    ...prev,
                    text: e.target.value,
                  }))
                }
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveEdit}
                  disabled={
                    editingSubtitle.start >= editingSubtitle.end ||
                    !editingSubtitle.text.trim()
                  }
                >
                  Save Changes
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Grid>
  );
};

// Helper function to format time in minutes:seconds format
const timeToSeconds = (time) => {
  const [hours, minutes, seconds] = time.split(":");
  const [sec, ms] = seconds.split(",");
  return (
    parseInt(hours, 10) * 3600 +
    parseInt(minutes, 10) * 60 +
    parseInt(sec, 10) +
    parseInt(ms, 10) / 1000
  );
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

export default Editor;