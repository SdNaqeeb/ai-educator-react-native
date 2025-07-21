import React, { createContext, useState, useContext } from "react";

export const QuestContext = createContext();

export const useQuest = () => {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error("useQuest must be used within a QuestProvider");
  }
  return context;
};

export const QuestProvider = ({ children }) => {
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [availableQuests, setAvailableQuests] = useState([]);

  const completeQuest = (questId) => {
    const quest = activeQuests.find((q) => q.id === questId);
    if (quest) {
      setActiveQuests((prev) => prev.filter((q) => q.id !== questId));
      setCompletedQuests((prev) => [
        ...prev,
        { ...quest, completedAt: new Date() },
      ]);
    }
  };

  const startQuest = (questId) => {
    const quest = availableQuests.find((q) => q.id === questId);
    if (quest) {
      setAvailableQuests((prev) => prev.filter((q) => q.id !== questId));
      setActiveQuests((prev) => [...prev, { ...quest, startedAt: new Date() }]);
    }
  };

  const contextValue = {
    activeQuests,
    completedQuests,
    availableQuests,
    completeQuest,
    startQuest,
    setActiveQuests,
    setCompletedQuests,
    setAvailableQuests,
  };

  return (
    <QuestContext.Provider value={contextValue}>
      {children}
    </QuestContext.Provider>
  );
};
