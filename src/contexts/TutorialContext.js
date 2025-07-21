import React, { createContext, useState, useContext } from "react";

export const TutorialContext = createContext();

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};

export const TutorialProvider = ({ children }) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorialSteps, setTutorialSteps] = useState([]);

  const startTutorial = (steps) => {
    setTutorialSteps(steps);
    setCurrentStep(0);
    setIsTutorialActive(true);
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const endTutorial = () => {
    setIsTutorialActive(false);
    setCurrentStep(0);
    setTutorialSteps([]);
  };

  const contextValue = {
    isTutorialActive,
    currentStep,
    tutorialSteps,
    startTutorial,
    nextStep,
    previousStep,
    endTutorial,
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
};
