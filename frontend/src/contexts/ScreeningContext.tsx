import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { FundusCase, SAMPLE_CASES } from "@/lib/mockData";
import { toast } from "sonner";

interface ServerStatus {
  online: boolean;
  modelLoaded: boolean;
  device: string;
  architecture?: string;
  checkpoint?: string;
  threshold?: number;
}

interface PatientMetadata {
  patientId?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  phcLocation?: string;
  cameraModel?: string;
}

interface ScreeningContextType {
  currentCase: FundusCase;
  setCurrentCase: (c: FundusCase) => void;
  isAnalyzing: boolean;
  analysisStep: string;
  analysisHistory: FundusCase[];
  serverStatus: ServerStatus;
  checkHealth: () => Promise<void>;
  analyzeImage: (file: File, metadata?: PatientMetadata) => Promise<FundusCase | null>;
  loadPresetCase: (c: FundusCase) => void;
}

const ScreeningContext = createContext<ScreeningContextType | undefined>(undefined);

import { mapApiResponseToFundusCase } from "@/lib/caseMapper";

export function ScreeningProvider({ children }: { children: React.ReactNode }) {
  const [currentCase, setCurrentCase] = useState<FundusCase>(SAMPLE_CASES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [analysisHistory, setAnalysisHistory] = useState<FundusCase[]>(SAMPLE_CASES);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    online: false,
    modelLoaded: false,
    device: "checking...",
  });

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        const dev = data.model?.device || data.device || "CUDA";
        const arch = data.model?.name || data.architecture || "EfficientNet-B0";
        const chk = data.model?.checkpoint || data.checkpoint || "checkpoints/finetuned_best_model.pth";
        const th = data.model?.referable_decision_rule?.frozen_threshold ?? data.referable_threshold ?? 0.24;
        setServerStatus({
          online: true,
          modelLoaded: true,
          device: String(dev),
          architecture: String(arch),
          checkpoint: String(chk),
          threshold: Number(th),
        });
      } else {
        setServerStatus(prev => ({ ...prev, online: false }));
      }
    } catch {
      setServerStatus(prev => ({ ...prev, online: false, device: "unavailable" }));
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const loadPresetCase = useCallback((c: FundusCase) => {
    setCurrentCase(c);
    toast.info(`Loaded profile: ${c.name} (${c.id})`);
  }, []);

  const analyzeImage = useCallback(
    async (file: File, metadata?: PatientMetadata): Promise<FundusCase | null> => {
      setIsAnalyzing(true);
      setAnalysisStep("1/4: Uploading & Pre-Inference Quality Gate...");

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (metadata?.patientId) formData.append("patient_id", metadata.patientId);
        if (metadata?.patientName) formData.append("patient_name", metadata.patientName);
        if (metadata?.patientAge) formData.append("patient_age", String(metadata.patientAge));
        if (metadata?.patientGender) formData.append("patient_gender", metadata.patientGender);
        if (metadata?.phcLocation) formData.append("phc_location", metadata.phcLocation);
        if (metadata?.cameraModel) formData.append("camera_model", metadata.cameraModel);

        setAnalysisStep("2/4: CLAHE Contrast Normalization & Quality Scoring...");
        const responsePromise = fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        // Small step animation while server responds
        const timer1 = setTimeout(() => {
          setAnalysisStep("3/4: EfficientNet-B0 Logit Computation...");
        }, 600);
        const timer2 = setTimeout(() => {
          setAnalysisStep("4/4: Generating Grad-CAM & PDF Report...");
        }, 1200);

        const res = await responsePromise;
        clearTimeout(timer1);
        clearTimeout(timer2);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server returned ${res.status}`);
        }

        const data = await res.json();
        const localPreviewUrl = URL.createObjectURL(file);
        const newCase = mapApiResponseToFundusCase(data, localPreviewUrl);

        setCurrentCase(newCase);
        setAnalysisHistory(prev => [newCase, ...prev.filter(c => c.id !== newCase.id)]);

        if (newCase.isGradeable) {
          toast.success(`Inference Complete: Grade ${newCase.grading.predictedGrade} (${newCase.grading.isReferable ? "Referable" : "Non-Referable"})`);
        } else {
          toast.warning("Quality Gate Warning: Image failed sharpness or illumination criteria.");
        }

        return newCase;
      } catch (err: any) {
        console.error("Inference request failed:", err);
        toast.error(`Inference failed: ${err.message || "Could not connect to Python AI engine"}`);
        return null;
      } finally {
        setIsAnalyzing(false);
        setAnalysisStep("");
      }
    },
    []
  );

  return (
    <ScreeningContext.Provider
      value={{
        currentCase,
        setCurrentCase,
        isAnalyzing,
        analysisStep,
        analysisHistory,
        serverStatus,
        checkHealth,
        analyzeImage,
        loadPresetCase,
      }}
    >
      {children}
    </ScreeningContext.Provider>
  );
}

export function useScreening() {
  const context = useContext(ScreeningContext);
  if (!context) {
    throw new Error("useScreening must be used within a ScreeningProvider");
  }
  return context;
}
