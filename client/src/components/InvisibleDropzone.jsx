
import React, { useEffect } from "react";

const InvisibleDropzone = ({ onDropFiles, setIsDragging, onDropItemToRoot }) => {
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging?.(true);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging?.(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging?.(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onDropFiles(files);
        return;
      }

      const raw = e.dataTransfer.getData("application/json");
      if (raw && onDropItemToRoot) {
        try {
          const draggedItem = JSON.parse(raw);
          onDropItemToRoot(draggedItem);
        } catch (err) {
          console.error("Invalid drag data:", err);
        }
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onDropFiles, setIsDragging, onDropItemToRoot]);

  return null;
};

export default InvisibleDropzone;
