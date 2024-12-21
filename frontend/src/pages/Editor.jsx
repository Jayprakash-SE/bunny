import { useRef } from "react";
import {
  Grid,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import WaveformTimeline from "../components/WaveformTimeline";
import { useSelector } from "react-redux";

const Editor = () => {
  const videoRef = useRef(null);
  const variable = useSelector((state) => state.myVariable.value);
  return (
    <Grid container sx={{ height: "100vh", backgroundColor: "#121212" }}>
      <Grid
        container
        item
        xs={12}
        sx={{ padding: 2, height: "calc(100% - 200px)" }}
      >
        <Grid
          item
          xs={6}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 1,
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "120%",
              height: "120%",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.5), transparent 20%)",
              filter: "blur(40px)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          ></Box>
          <Box
            sx={{
              width: "100%",
              maxWidth: "100%",
              aspectRatio: "16 / 9",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 2,
              borderRadius: "8px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <video
              ref={videoRef}
              controls
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0px 0px 30px rgba(255, 255, 255, 0.3)",
              }}
              src={variable}
            ></video>
          </Box>
        </Grid>

        <Grid item xs={3} sx={{ padding: 1 }}>
          <Box
            sx={{
              backgroundColor: "#202020",
              borderRadius: "8px",
              overflowY: "auto",
              height: "100%",
              padding: 1,
            }}
          >
            <List dense>
              <ListItem>
                <ListItemText
                  primary="00:00:05 - 00:00:10"
                  secondary="Subtitle line 1"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="00:00:11 - 00:00:15"
                  secondary="Subtitle line 2"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="00:00:16 - 00:00:20"
                  secondary="Subtitle line 3"
                />
              </ListItem>
            </List>
          </Box>
        </Grid>

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
            <Button variant="contained" color="primary" fullWidth>
              Back to Project
            </Button>
            <Button variant="contained" color="secondary" fullWidth>
              Upload Subtitles
            </Button>
          </Box>
        </Grid>
      </Grid>
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
        <WaveformTimeline videoRef={videoRef} />
      </Grid>
    </Grid>
  );
};

export default Editor;
