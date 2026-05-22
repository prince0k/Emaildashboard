"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCampaignWizard } from "@/hooks/useCampaignWizard";

import Step1DeploymentSetup from "@/components/campaign-wizard/Step1DeploymentSetup";
import Step2CreativeAssets from "@/components/campaign-wizard/Step2CreativeAssets";
import CreativeForgeEditor from "@/components/campaign-wizard/CreativeForgeEditor";
import Step3Suppression from "@/components/campaign-wizard/Step3Suppression";
import Step4FinalDispatch from "@/components/campaign-wizard/Step4FinalDispatch";

function CreateCampaignContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("id");

  const wizardProps = useCampaignWizard(campaignId);

  return (
    <div className={`flex flex-col gap-8 p-8 max-w-[1800px] mx-auto min-h-screen animate-in fade-in duration-700 font-sans ${wizardProps.isFullscreen ? "overflow-hidden" : ""}`}>
      
      {!wizardProps.isFullscreen && (
        <div className="flex flex-col md:flex-row md:items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-xl shadow-inner">
            {[1, 2, 3, 4].map(i => (
              <button
                key={i}
                onClick={() => wizardProps.setStep(i)}
                className={`h-11 px-8 rounded-xl text-[12px] font-bold transition-all duration-300 tracking-widest uppercase ${wizardProps.step === i
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                  : "text-muted-foreground hover:bg-secondary/50"
                  }`}
              >
                Step {i}
              </button>
            ))}
          </div>
        </div>
      )}

      {wizardProps.error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-6 py-4 rounded-2xl animate-in slide-in-from-top-4">
          {wizardProps.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          <div className="space-y-10 font-sans">
            <Step1DeploymentSetup {...wizardProps} />
            <Step2CreativeAssets {...wizardProps} />
            <CreativeForgeEditor {...wizardProps} />
            <Step3Suppression {...wizardProps} />
            <Step4FinalDispatch {...wizardProps} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateCampaignContent />
    </Suspense>
  );
}
