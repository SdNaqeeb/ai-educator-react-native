import React, { createContext, useState, useContext } from "react";

export const CurrentQuestionContext = createContext();

export const useCurrentQuestion = () => {
  const context = useContext(CurrentQuestionContext);
  if (!context) {
    throw new Error(
      "useCurrentQuestion must be used within a CurrentQuestionProvider",
    );
  }
  return context;
};

export const CurrentQuestionProvider = ({ children }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionList, setQuestionList] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionMetadata, setQuestionMetadata] = useState({});

  const setQuestion = (question, index = 0, list = [], metadata = {}) => {
    setCurrentQuestion(question);
    setCurrentQuestionIndex(index);
    setQuestionList(list);
    setQuestionMetadata(metadata);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questionList.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questionList[nextIndex]);
      return questionList[nextIndex];
    }
    return null;
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentQuestion(questionList[prevIndex]);
      return questionList[prevIndex];
    }
    return null;
  };

  const clearQuestion = () => {
    setCurrentQuestion(null);
    setQuestionList([]);
    setCurrentQuestionIndex(0);
    setSelectedQuestions([]);
    setQuestionMetadata({});
  };

  const contextValue = {
    currentQuestion,
    questionList,
    currentQuestionIndex,
    selectedQuestions,
    questionMetadata,
    setQuestion,
    nextQuestion,
    previousQuestion,
    clearQuestion,
    setSelectedQuestions,
  };

  return (
    <CurrentQuestionContext.Provider value={contextValue}>
      {children}
    </CurrentQuestionContext.Provider>
  );
};
