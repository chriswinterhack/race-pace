"use client";

import { useState, useCallback } from "react";

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface UploadResult {
  path: string;
  url: string;
}

export function useGpxUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const upload = useCallback(
    async (
      file: File,
      raceSlug: string,
      year: number,
      distanceId?: string
    ): Promise<UploadResult | null> => {
      setState({ isUploading: true, progress: 0, error: null });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("raceSlug", raceSlug);
        formData.append("year", year.toString());
        if (distanceId) {
          formData.append("distanceId", distanceId);
        }

        // Simulate progress since fetch doesn't support progress
        const progressInterval = setInterval(() => {
          setState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }));
        }, 200);

        const response = await fetch("/api/upload/gpx", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        const result = await response.json();

        if (!response.ok || result.error) {
          setState({
            isUploading: false,
            progress: 0,
            error: result.error || "Upload failed",
          });
          return null;
        }

        setState({ isUploading: false, progress: 100, error: null });
        return result.data;
      } catch (error) {
        setState({
          isUploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : "Upload failed",
        });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null });
  }, []);

  return {
    ...state,
    upload,
    reset,
  };
}
