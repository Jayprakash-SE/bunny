import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import WFPlayer from "wfplayer";
import clamp from "lodash/clamp";

const WaveformTimeline = ({ videoRef, subtitles, onSubtitleAdd, onSubtitleDelete }) => {
  const waveformRef = useRef(null);
  const wfPlayerInstance = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);
  const [dragEndX, setDragEndX] = useState(null);
  const [currentScroll, setCurrentScroll] = useState(0);
  const scrollSpeed = 0.01;

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    if (!videoRef.current || !wfPlayerInstance.current) return;

    const videoDuration = videoRef.current.duration;
    const newScroll = clamp(
      currentScroll + (event.deltaY * scrollSpeed),
      0,
      videoDuration - 10
    );

    setCurrentScroll(newScroll);
    wfPlayerInstance.current.seek(newScroll);
  }, [currentScroll, videoRef]);

  const onMouseDown = useCallback((event) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    setIsDragging(true);
    setDragStartX(offsetX);
    setDragEndX(offsetX);
  }, []);

  const onMouseMove = useCallback((event) => {
    if (!isDragging || !waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    setDragEndX(offsetX);
  }, [isDragging]);

  const onMouseUp = useCallback(() => {
    if (!isDragging || !videoRef.current || !waveformRef.current) return;

    const waveformWidth = waveformRef.current.offsetWidth;
    const viewDuration = 10;

    const startTime = currentScroll + (Math.min(dragStartX, dragEndX) / waveformWidth * viewDuration);
    const endTime = currentScroll + (Math.max(dragStartX, dragEndX) / waveformWidth * viewDuration);

    const hasOverlap = subtitles.some(subtitle =>
      (startTime < subtitle.end && endTime > subtitle.start)
    );

    if (!hasOverlap && endTime - startTime > 0.1) {
      onSubtitleAdd({
        start: startTime,
        end: endTime,
        text: "New subtitle"
      });
    }

    setIsDragging(false);
    setDragStartX(null);
    setDragEndX(null);
  }, [isDragging, dragStartX, dragEndX, videoRef, subtitles, onSubtitleAdd, currentScroll]);

  useEffect(() => {
    [...WFPlayer.instances].forEach((item) => item.destroy());

    if (!waveformRef.current || !videoRef.current) return;

    wfPlayerInstance.current = new WFPlayer({
      container: waveformRef.current,
      mediaElement: videoRef.current,
      scrollable: true,
      useWorker: false,
      duration: 10,
      padding: 1,
      wave: true,
      pixelRatio: 2,
      backgroundColor: "rgba(0, 0, 0, 0)",
      waveColor: "rgba(255, 255, 255, 0.2)",
      progressColor: "rgba(255, 255, 255, 0.5)",
      gridColor: "rgba(255, 255, 255, 0.05)",
      rulerColor: "rgba(255, 255, 255, 0.5)",
      paddingColor: "rgba(0, 0, 0, 0)",
    });

    wfPlayerInstance.current.load(videoRef.current.src);

    return () => {
      wfPlayerInstance.current?.destroy();
    };
  }, [videoRef]);

  useEffect(() => {
    const waveformElement = waveformRef.current;
    if (!waveformElement) return;

    waveformElement.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      waveformElement.removeEventListener("wheel", handleWheel);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleWheel, onMouseMove, onMouseUp]);

  const renderSubtitlesAndOverlay = () => {
    if (!videoRef.current) return null;

    const viewDuration = 10;

    return (
      <>
        {subtitles.map((subtitle, index) => {
          if (subtitle.start > currentScroll + viewDuration || subtitle.end < currentScroll) {
            return null;
          }

          const startPercent = ((subtitle.start - currentScroll) / viewDuration) * 100;
          const widthPercent = ((subtitle.end - subtitle.start) / viewDuration) * 100;

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                height: "20px",
                top: "0",
                backgroundColor: "rgba(76, 175, 80, 0.5)",
                borderRadius: "4px",
                color: "white",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
                cursor: "pointer",
                zIndex: 2,
                overflow: "hidden",
                whiteSpace: "nowrap"
              }}
              onDoubleClick={() => onSubtitleDelete(index)}
            >
              {subtitle.text}
            </div>
          );
        })}

        {isDragging && dragStartX !== null && dragEndX !== null && (
          <div
            style={{
              position: "absolute",
              left: `${Math.min(dragStartX, dragEndX)}px`,
              width: `${Math.abs(dragEndX - dragStartX)}px`,
              height: "20px",
              top: "0",
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              borderRadius: "4px",
              pointerEvents: "none",
              zIndex: 1
            }}
          />
        )}
      </>
    );
  };

  return (
    <div
      ref={waveformRef}
      style={{
        width: "100%",
        height: "100px",
        position: "relative",
        cursor: isDragging ? "col-resize" : "default",
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        borderRadius: "8px",
        overflow: "hidden"
      }}
      onMouseDown={onMouseDown}
    >
      {renderSubtitlesAndOverlay()}
    </div>
  );
};

WaveformTimeline.propTypes = {
  videoRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  subtitles: PropTypes.array.isRequired,
  onSubtitleAdd: PropTypes.func.isRequired,
  onSubtitleDelete: PropTypes.func.isRequired
};

export default WaveformTimeline;