import React, { useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import CustomPicker from '../components/CustomPicker'; // Import the CustomPicker component
import { AuthContext } from '../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const chartWidth = screenWidth ;

const AnalyticsScreen = ({
  selectedClass: propsSelectedClass,
  selectedStudent: propsSelectedStudent,
  onStudentSelect,
  classesData,
  onClassChange,
}) => {
  // Use internal state if props are not provided
  const [internalSelectedClass, setInternalSelectedClass] = useState('Class 12th');
  const [internalSelectedStudent, setInternalSelectedStudent] = useState('10HPS01');
  
  // Use props if provided, otherwise use internal state
  const selectedClass = propsSelectedClass?.name || internalSelectedClass;
  const selectedStudent = propsSelectedStudent?.rollNo || internalSelectedStudent;

  const { username, logout } = useContext(AuthContext);
  
  // Main tab state
  const [studentAnalysisMainTab, setStudentAnalysisMainTab] = useState('progression');
  
  // Sub-tab states for Score Progression
  const [scoreProgressionSubTab, setScoreProgressionSubTab] = useState('datewise');
  const [scoreProgressionView, setScoreProgressionView] = useState('combined');
  
  // Sub-tab states for Topic Analysis
  const [topicAnalysisSubTab, setTopicAnalysisSubTab] = useState('datewise');
  const [topicAnalysisView, setTopicAnalysisView] = useState('combined');
  
  // Mistake Analysis states
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('All Chapters');
  const [selectedPerformanceFilter, setSelectedPerformanceFilter] = useState('All Percentages');
  
  // Animation states
  const [isTransitioning, setIsTransitioning] = useState(false);

  // All students data
  const allStudents = [
    { id: 1,  rollNo: '12HPS01', class: 'Class 12th', efficiency: 78 },
    { id: 2,  rollNo: '12HPS02', class: 'Class 12th', efficiency: 73 },
    { id: 3,  rollNo: '12HPS03', class: 'Class 12th', efficiency: 85 },
    { id: 4,  rollNo: '12HPS04', class: 'Class 12th', efficiency: 58 },
    { id: 5,  rollNo: '11HPS01', class: 'Class 11th', efficiency: 92 },
    { id: 6,  rollNo: '11HPS02', class: 'Class 11th', efficiency: 67 },
    { id: 7,  rollNo: '10HPS01', class: 'Class 10th', efficiency: 89 },
    { id: 8,  rollNo: '10HPS02', class: 'Class 10th', efficiency: 74 },
    { id: 9,   rollNo: '09HPS01', class: 'Class 9th', efficiency: 81 },
    { id: 10,  rollNo: '09HPS02', class: 'Class 9th', efficiency: 76 },
    { id: 11,  rollNo: '08HPS01', class: 'Class 8th', efficiency: 70 },
    { id: 12,  rollNo: '08HPS02', class: 'Class 8th', efficiency: 85 },
    { id: 13,  rollNo: '07HPS01', class: 'Class 7th', efficiency: 78 },
    { id: 14,  rollNo: '07HPS02', class: 'Class 7th', efficiency: 82 },
    { id: 15,  rollNo: '06HPS01', class: 'Class 6th', efficiency: 75 },
    { id: 16,  rollNo: '06HPS02', class: 'Class 6th', efficiency: 88 }
  ];

  // Filter students based on selected class
  const availableStudents = allStudents.filter(student => student.class === selectedClass);
  
  // Get the full student object
  const selectedStudentObj = allStudents.find(student => student.rollNo === selectedStudent);

  // Data arrays (same as in your original component)
  const studentHomeworkProgressionData = [
    { date: 'Jun 23', performance: 18, trend: 28, classRanking: 'Top 60%' },
    { date: 'Jun 25', performance: 35, trend: 42, classRanking: 'Top 60%' },
    { date: 'Jun 27', performance: 78, trend: 58, classRanking: 'Top 60%' },
    { date: 'Jun 29', performance: 80, trend: 68, classRanking: 'Top 60%' },
    { date: 'Jul 01', performance: 85, trend: 78, classRanking: 'Top 60%' },
    { date: 'Jul 03', performance: 92, trend: 88, classRanking: 'Top 60%' }
  ];

  const studentClassworkProgressionData = [
    { date: 'Jun 23', performance: 38, trend: 35, classRanking: 'Bottom 50%' },
    { date: 'Jun 25', performance: 20, trend: 32, classRanking: 'Bottom 50%' },
    { date: 'Jun 27', performance: 47, trend: 38, classRanking: 'Bottom 50%' },
    { date: 'Jun 29', performance: 28, trend: 35, classRanking: 'Bottom 50%' },
    { date: 'Jul 01', performance: 25, trend: 38, classRanking: 'Bottom 50%' },
    { date: 'Jul 03', performance: 44, trend: 42, classRanking: 'Bottom 50%' }
  ];

  const studentDateWiseComparisonData = [
    { date: 'Jun 23', homework: 6, classwork: 12 },
    { date: 'Jun 25', homework: 14, classwork: 7 },
    { date: 'Jun 27', homework: 27, classwork: 14 },
    { date: 'Jun 29', homework: 31, classwork: 10 },
    { date: 'Jul 01', homework: 31, classwork: 10 },
    { date: 'Jul 03', homework: 38, classwork: 16 }
  ];

  const topicWisePerformanceData = [
    { topic: 'Integration', homework: 100, classwork: 12 },
    { topic: 'Linear Equations', homework: 75, classwork: 15 },
    { topic: 'Statistics', homework: 78, classwork: 20 },
    { topic: 'Rational Functions', homework: 80, classwork: 32 },
    { topic: 'Probability', homework: 72, classwork: 35 },
    { topic: 'Trigonometry', homework: 79, classwork: 49 },
    { topic: 'Quadratic Applications', homework: 68, classwork: 40 },
    { topic: 'Derivatives', homework: 59, classwork: 32 },
    { topic: 'Functions and Graphs', homework: 51, classwork: 58 },
    { topic: 'Coordinate Geometry', homework: 66, classwork: 93 }
  ];

  const answerDistributionData = [
    { name: 'Correct', value: 13, percentage: 43.3, color: '#10b981' },
    { name: 'Partially-Correct', value: 3, percentage: 10, color: '#f59e0b' },
    { name: 'Numerical Error', value: 4, percentage: 13.3, color: '#ef4444' },
    { name: 'Irrelevant', value: 7, percentage: 23.3, color: '#8b5cf6' },
    { name: 'Unattempted', value: 3, percentage: 10, color: '#6b7280' }
  ];

  const chapterExplorerData = [
    { chapter: 'Algebra - Linear Equations', percentage: 75 },
    { chapter: 'Algebra - Rational Functions', percentage: 80 },
    { chapter: 'Calculus - Derivatives', percentage: 61 },
    { chapter: 'Calculus - Integration', percentage: 100 },
    { chapter: 'Coordinate Geometry', percentage: 64 },
    { chapter: 'Functions and Graphs', percentage: 43 },
    { chapter: 'Probability', percentage: 72 },
    { chapter: 'Quadratic Applications', percentage: 67 },
    { chapter: 'Statistics', percentage: 78 },
    { chapter: 'Trigonometry', percentage: 81 }
  ];

  // Handle class change
  const handleClassChange = (value) => {
    console.log('Class changed to:', value);
    
    if (onClassChange) {
      onClassChange({ name: value });
    } else {
      setInternalSelectedClass(value);
    }
    
    // Clear student selection
    if (onStudentSelect) {
      onStudentSelect(null);
    } else {
      setInternalSelectedStudent('');
    }
  };

  // Handle student change
  const handleStudentChange = (value) => {
    console.log('Student selected:', value);
    
    const student = allStudents.find(s => s.rollNo === value);
    
    if (onStudentSelect) {
      onStudentSelect(student || null);
    } else {
      setInternalSelectedStudent(value);
    }
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeWidth: 0
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3b82f6',
    },
  };

  // Render metric card
  const renderMetricCard = (value, label, color) => (
    <View style={[styles.metricCard, { backgroundColor: color }]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  // Render small metric card
  const renderSmallMetricCard = (value, label, bgColor, textColor) => (
    <View style={[styles.smallMetricCard, { backgroundColor: bgColor }]}>
      <Text style={[styles.smallMetricValue, { color: textColor }]}>{value}</Text>
      <Text style={styles.smallMetricLabel}>{label}</Text>
    </View>
  );

  // Render main tabs
  const renderMainTabs = () => {
    const tabs = [
      { key: 'progression', icon: 'trending-up', label: 'Progress', color: '#3b82f6' },
      { key: 'topics', icon: 'time', label: 'Chapter Analysis', color: '#8b5cf6' },
      { key: 'mistakes', icon: 'search', label: 'Mistake Analysis', color: '#ef4444' },
      { key: 'summary', icon: 'clipboard', label: 'Summary', color: '#22c55e' }
    ];

    return (
      <View style={styles.mainTabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.mainTabButton,
              studentAnalysisMainTab === tab.key && [
                styles.mainTabButtonActive,
                { backgroundColor: tab.color }
              ]
            ]}
            onPress={() => setStudentAnalysisMainTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={studentAnalysisMainTab === tab.key ? '#fff' : '#64748b'} 
            />
            <Text style={[
              styles.mainTabText,
              studentAnalysisMainTab === tab.key && styles.mainTabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render sub tabs
  const renderSubTabs = (tabs, activeTab, onTabChange) => (
    <View style={styles.subNavContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.subTabButton,
            activeTab === tab.key && styles.subTabButtonActive
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text style={styles.subTabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.subTabText,
            activeTab === tab.key && styles.subTabTextActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render Score Progression Tab
  const renderScoreProgressionTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Summary Cards */}
        {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryCardsScroll}>
          <View style={styles.summaryCardsGrid}>
            {renderMetricCard('66.8%', 'Homework Average', '#3b82f6')}
            {renderMetricCard('33.8%', 'Classwork Average', '#ef4444')}
            {renderMetricCard('15.07%', 'HW Improvement Rate', '#22c55e')}
            {renderMetricCard('-33.0%', 'Performance Gap', '#f59e0b')}
          </View>
        </ScrollView> */}

        {/* Sub Navigation */}
        {renderSubTabs(
          [
            // { key: 'datewise', icon: '', label: 'Date-wise' },
            // { key: 'chapterwise', icon: '', label: 'Chapter-wise' },
            // { key: 'summary', icon: '', label: 'Summary' }
          ],
          scoreProgressionSubTab,
          setScoreProgressionSubTab
        )}

        {/* Date-wise Comparison Content */}
        {scoreProgressionSubTab === 'datewise' && (
          <View>
            <Text style={styles.sectionTitle}>Homework vs Classwork: Date-wise</Text>
            <Text style={styles.sectionSubtitle}>Score Comparison Over Time</Text>

            {/* Small Metric Cards */}
            {/* <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.smallMetricCardsContainer}>
                {renderSmallMetricCard('6', 'Total Dates', '#dbeafe', '#3b82f6')}
                {renderSmallMetricCard('532%', 'HW Growth Rate', '#dcfce7', '#22c55e')}
                {renderSmallMetricCard('33%', 'CW Growth Rate', '#fef3c7', '#f59e0b')}
                {renderSmallMetricCard('26 pts', 'Max Gap', '#fce7f3', '#ec4899')}
              </View>
            </ScrollView> */}

            {/* Line Chart */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartContainer}>
            <View style={{ position: 'absolute', top: '40%', left: -1 , transform: [{ rotate: '-90deg' }],zIndex: 10 }}>
    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Score</Text>
  </View>
              <LineChart
                data={{
                  labels: studentDateWiseComparisonData.map(d => d.date),
                  datasets: [
                    {
                      data: studentDateWiseComparisonData.map(d => d.homework),
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      strokeWidth: 3
                    },
                    {
                      data: studentDateWiseComparisonData.map(d => d.classwork),
                      color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                      strokeWidth: 3
                    }
                  ],
                  legend: ['Homework', 'Classwork']
                }}
                width={chartWidth}
                height={250}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
              
              <Text style={{ textAlign: 'center',bottom:10 , marginTop: 0, fontSize: 14, fontWeight: 'bold' }}>
    Date
  </Text>
            </View>
            </ScrollView>
            
          </View>
        )}

        {/* Chapter-wise Comparison */}
        {scoreProgressionSubTab === 'chapterwise' && (
          <View>
            <Text style={styles.sectionTitle}> Chapter-wise Performance</Text>
            
            {/* Bar Chart */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              
              <BarChart
                data={{
                  labels: topicWisePerformanceData.slice(0, 5).map(d => d.topic.substring(0, 10) + '...'),
                  datasets: [
                    {
                      data: topicWisePerformanceData.slice(0, 5).map(d => d.homework)
                    }
                  ]
                }}
                width={chartWidth}
                
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                }}
                style={styles.chart}
              />
            </ScrollView>
          </View>
        )}

        {/* Summary */}
        {/* {scoreProgressionSubTab === 'summary' && (
          <View style={styles.summaryContainer}>
            <View style={styles.analysisCard}>
              <View style={styles.analysisCardHeader}>
                <View style={[styles.analysisCardIcon, { backgroundColor: '#3b82f6' }]}>
                  <Text></Text>
                </View>
                <Text style={styles.analysisCardTitle}>Overall Performance</Text>
              </View>
              <View style={styles.performanceMetrics}>
                <View style={styles.performanceMetric}>
                  <Text style={styles.performanceValue}>66.8%</Text>
                  <Text style={styles.performanceLabel}>Homework Avg</Text>
                </View>
                <View style={styles.performanceMetric}>
                  <Text style={[styles.performanceValue, { color: '#ef4444' }]}>33.8%</Text>
                  <Text style={styles.performanceLabel}>Classwork Avg</Text>
                </View>
                <View style={styles.performanceMetric}>
                  <Text style={[styles.performanceValue, { color: '#f59e0b' }]}>-33.0%</Text>
                  <Text style={styles.performanceLabel}>Gap</Text>
                </View>
              </View>
            </View>
          </View>
        )} */}
      </View>
    );
  };

  // Render Topic Analysis Tab
  const renderTopicAnalysisTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Summary Cards */}
        

        {/* Sub Navigation */}
        {renderSubTabs(
          [
            // { key: 'datewise', icon: '', label: 'Date-wise' },
            // // { key: 'chapterwise', icon: '', label: 'Chapter-wise' },
            // { key: 'summary', icon: '', label: 'Summary' }
          ],
          topicAnalysisSubTab,
          setTopicAnalysisSubTab
        )}

        

        {/* Content based on sub tab */}
        {topicAnalysisSubTab === 'summary' && (
          <View style={styles.summaryContainer}>
            <View style={styles.analysisCard}>
              <View style={styles.analysisCardHeader}>
                <View style={[styles.analysisCardIcon, { backgroundColor: '#22c55e' }]}>
                  <Text>🏆</Text>
                </View>
                <Text style={styles.analysisCardTitle}>Best Performing Topics</Text>
              </View>
              <View style={styles.topicsList}>
                <View style={styles.topicItem}>
                  <Text style={styles.topicName}>Calculus - Integration</Text>
                  <Text style={styles.topicPerformance}>100% (Homework)</Text>
                </View>
                <View style={styles.topicItem}>
                  <Text style={styles.topicName}>Coordinate Geometry</Text>
                  <Text style={styles.topicPerformance}>93% (Classwork)</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        {topicAnalysisSubTab === 'datewise' && (
          <View>
          <Text style={styles.sectionTitle}> Chapter-wise Performance</Text>
          
          {/* Bar Chart */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{
                labels: topicWisePerformanceData.slice(0, 5).map(d => d.topic.substring(0, 10) + '...'),
                datasets: [
                  {
                    data: topicWisePerformanceData.slice(0, 5).map(d => d.homework)
                  }
                ]
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              }}
              style={styles.chart}
            />
          </ScrollView>
        </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryCardsScroll}>
          <View style={styles.summaryCardsGrid}>
            {renderMetricCard('7', 'Topics Analyzed', '#8b5cf6')}
            {renderMetricCard('66.7%', 'Best Performance', '#22c55e')}
            {renderMetricCard('Quadratic', 'Most Active Topic', '#f59e0b')}
            {renderMetricCard('62.5%', 'Latest Average', '#ec4899')}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render Mistake Analysis Tab
  const renderMistakeAnalysisTab = () => {
    const pieData = answerDistributionData.map(item => ({
      name: item.name,
      population: item.value,
      color: item.color,
      legendFontColor: '#374151',
      legendFontSize: 12
    }));

    return (
      <View style={styles.tabContent}>
        {/* Chapter Explorer */}
        {/* <View style={styles.chapterExplorerHeader}>
          <Text style={styles.chapterExplorerTitle}> Quick Chapter Explorer</Text>
          <Text style={styles.chapterExplorerSubtitle}> Explore Questions by Chapter! 📊</Text>
        </View> */}

       

        {/* Answer Distribution */}
        <View style={styles.pieChartContainer}>
          <Text style={styles.chartTitle}> How Well Did I Do?</Text>
          <PieChart
            data={pieData}
            width={chartWidth-40}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="8"
            absolute
          />
        </View>

         {/* Chapter Grid */}
         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chapterGrid}>
            {chapterExplorerData.slice(0, 5).map((chapter, index) => (
              <TouchableOpacity
                key={index}
                style={styles.chapterButton}
                onPress={() => setSelectedChapterFilter(chapter.chapter)}
              >
                <Text style={styles.chapterName}> {chapter.chapter}</Text>
                <Text style={[
                  styles.chapterPercentage,
                  chapter.percentage >= 70 ? styles.percentageHigh :
                  chapter.percentage >= 40 ? styles.percentageMedium :
                  styles.percentageLow
                ]}>
                  ({chapter.percentage}%)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Filters */}
        {/* <View style={styles.filterSection}>
          <View style={styles.filterCard}>
            <Text style={styles.filterTitle}> Filter By Performance</Text>
            <CustomPicker
              selectedValue={selectedPerformanceFilter}
              onValueChange={(itemValue) => setSelectedPerformanceFilter(itemValue)}
              items={[
                { label: 'All Percentages', value: 'All Percentages' },
                { label: '0-19% (Needs Practice! 🔴)', value: '0-19%' },
                { label: '20-39% (Keep Trying! 💪)', value: '20-39%' },
                { label: '40-59% (Good Work! 😊)', value: '40-59%' },
                { label: '60-79% (Great Job! 👍)', value: '60-79%' },
                { label: '80-100% (Amazing! 🌟)', value: '80-100%' },
              ]}
              placeholder="Select Performance Range"
            />
          </View>
        </View> */}
      </View>
    );
  };

  // Render Summary Tab
  const renderSummaryTab = () => {
    return (
      <ScrollView style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>📋 Student Performance Summary</Text>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardHeader}>🎯 Overall Performance</Text>
          <Text style={styles.summaryCardContent}>
            The student shows strong performance in homework assignments but struggles with classwork. 
            This suggests good preparation and understanding when given time, but difficulties with 
            time-constrained assessments.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardHeader}>📊 Key Metrics</Text>
          <View style={styles.summaryList}>
            <Text style={styles.summaryListItem}>• Homework Average: 66.8% (Above class average)</Text>
            <Text style={styles.summaryListItem}>• Classwork Average: 33.8% (Below class average)</Text>
            <Text style={styles.summaryListItem}>• Performance Gap: -33.0%</Text>
            <Text style={styles.summaryListItem}>• Improvement Rate: 15.07% in homework</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardHeader}>💡 Recommendations</Text>
          <View style={styles.summaryList}>
            <Text style={styles.summaryListItem}>• Focus on time management skills</Text>
            <Text style={styles.summaryListItem}>• Practice more timed exercises</Text>
            <Text style={styles.summaryListItem}>• Reinforce conceptual understanding</Text>
            <Text style={styles.summaryListItem}>• Reduce careless errors through review</Text>
          </View>
        </View>
      </ScrollView>
    );
  };
  // Render No Student Selected
  const renderNoStudentSelected = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>👤</Text>
      <Text style={styles.emptyStateTitle}>Select a Student</Text>
      <Text style={styles.emptyStateText}>
        Choose a student from {selectedClass || 'the class'} using the dropdown above 
        to view their detailed analysis and performance metrics
      </Text>
      {availableStudents.length === 0 && (
        <Text style={styles.emptyStateSubtext}>
          No students found for {selectedClass || 'this class'}. 
          Try selecting a different class.
        </Text>
      )}
    </View>
  );

  // Main render
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerIcon}></Text>
          <View>
            <Text style={styles.headerTitle}>Student Analysis</Text>
            {/* {/* <Text style={styles.headerSubtitle}>
              {selectedStudentObj ? 
                `${selectedStudentObj.rollNo}` : 
                'Select a student to view analysis'
              }
            </Text> */}
            <Text style={styles.headerSubtitle}>
              {username}
            </Text>
          </View>
        </View>

        {/* Dropdowns */}
        {/* <View style={styles.dropdownContainer}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Class</Text>
            <CustomPicker
              selectedValue={selectedClass}
              onValueChange={handleClassChange}
              items={[
                { label: 'Class 6th 👥', value: 'Class 6th' },
                { label: 'Class 7th', value: 'Class 7th' },
                { label: 'Class 8th', value: 'Class 8th' },
                { label: 'Class 9th', value: 'Class 9th' },
                { label: 'Class 10th', value: 'Class 10th' },
                { label: 'Class 11th', value: 'Class 11th' },
                { label: 'Class 12th', value: 'Class 12th' },
              ]}
              placeholder="Select Class"
            />
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Student</Text>
            <CustomPicker
              selectedValue={selectedStudent}
              onValueChange={handleStudentChange}
              items={
                availableStudents.length > 0 
                  ? [
                      { label: 'Choose Student 👤', value: '' },
                      ...availableStudents.map((student) => ({
                        label: `${student.rollNo}`,
                        value: student.rollNo,
                      }))
                    ]
                  : [{ label: 'No students available', value: '' }]
              }
              placeholder="Choose Student 👤"
              disabled={availableStudents.length === 0}
            />
          </View>
        </View> */}
      </View> 

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {selectedStudentObj ? (
          <>
            {renderMainTabs()}
            
            {isTransitioning ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : (
              <>
                {studentAnalysisMainTab === 'progression' && renderScoreProgressionTab()}
                {studentAnalysisMainTab === 'topics' && renderTopicAnalysisTab()}
                {studentAnalysisMainTab === 'mistakes' && renderMistakeAnalysisTab()}
                {studentAnalysisMainTab === 'summary' && renderSummaryTab()}
              </>
            )}
          </>
        ) : (
          renderNoStudentSelected()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  headerTitle: {
    marginTop: 30,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  dropdownContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  mainContent: {
    flex: 1,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  mainTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  mainTabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  mainTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  mainTabTextActive: {
    color: '#fff',
  },
  tabContent: {
    padding: 16,
  },
  summaryCardsScroll: {
    marginBottom: 16,
  },
  summaryCardsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  subNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  subTabButtonActive: {
    backgroundColor: '#3b82f6',
  },
  subTabIcon: {
    fontSize: 16,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  subTabTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  smallMetricCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  smallMetricCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  smallMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  smallMetricLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  chartContainer: {
    marginVertical: 8,
    marginHorizontal:8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 5,
  },
  chart: {
    borderRadius: 16,
  },
  summaryContainer: {
    paddingTop: 8,
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  analysisCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  analysisCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  performanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceMetric: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  topicsList: {
    gap: 12,
  },
  topicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  topicName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  topicPerformance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  chapterExplorerHeader: {
    backgroundColor: '#fbbf24',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  chapterExplorerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  chapterExplorerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  chapterGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  chapterButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chapterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  chapterPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  percentageHigh: {
    color: '#22c55e',
  },
  percentageMedium: {
    color: '#f59e0b',
  },
  percentageLow: {
    color: '#ef4444',
  },
  pieChartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 5,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  filterSection: {
    marginTop: 20,
  },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  summaryContent: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryCardHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  summaryCardContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  summaryList: {
    marginTop: 8,
  },
  summaryListItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});

export default AnalyticsScreen;