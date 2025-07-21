import React, { createContext, useState, useContext } from "react";

export const LeaderboardContext = createContext();

export const useLeaderboard = () => {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error("useLeaderboard must be used within a LeaderboardProvider");
  }
  return context;
};

export const LeaderboardProvider = ({ children }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateLeaderboard = (data) => {
    setLeaderboardData(data);
  };

  const updateUserRank = (rank) => {
    setUserRank(rank);
  };

  const contextValue = {
    leaderboardData,
    userRank,
    loading,
    error,
    updateLeaderboard,
    updateUserRank,
    setLoading,
    setError,
  };

  return (
    <LeaderboardContext.Provider value={contextValue}>
      {children}
    </LeaderboardContext.Provider>
  );
};
