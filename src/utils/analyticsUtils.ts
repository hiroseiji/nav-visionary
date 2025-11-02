// Utility functions for analytics chart data generation

export const generateOverYearsBarData = (
  contentType: string,
  facebookPosts: any[],
  articles: any[],
  broadcastArticles: any[],
  broadcastOverTimeData: any[],
  printArticles: any[],
  printOverTimeData: any[]
) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];
  
  // Helper to count items by year
  const countByYear = (items: any[], dateField: string) => {
    return years.map(year => {
      return items.filter(item => {
        const date = new Date(item[dateField]);
        return date.getFullYear() === year;
      }).length;
    });
  };

  const datasets = [];

  if (contentType === "posts") {
    const data = countByYear(facebookPosts, "date");
    datasets.push({
      label: `Posts in ${currentYear - 2}`,
      data: [data[0], 0, 0],
      backgroundColor: "rgb(12, 217, 94)",
      borderRadius: 5,
    });
    datasets.push({
      label: `Posts in ${currentYear - 1}`,
      data: [0, data[1], 0],
      backgroundColor: "rgb(255, 182, 55)",
      borderRadius: 5,
    });
    datasets.push({
      label: `Posts in ${currentYear}`,
      data: [0, 0, data[2]],
      backgroundColor: "rgb(47, 162, 250)",
      borderRadius: 5,
    });
  } else if (contentType === "articles") {
    const data = countByYear(articles, "publication_date");
    datasets.push({
      label: `Articles in ${currentYear - 2}`,
      data: [data[0], 0, 0],
      backgroundColor: "rgb(12, 217, 94)",
      borderRadius: 5,
    });
    datasets.push({
      label: `Articles in ${currentYear - 1}`,
      data: [0, data[1], 0],
      backgroundColor: "rgb(255, 182, 55)",
      borderRadius: 5,
    });
    datasets.push({
      label: `Articles in ${currentYear}`,
      data: [0, 0, data[2]],
      backgroundColor: "rgb(47, 162, 250)",
      borderRadius: 5,
    });
  } else if (contentType === "broadcast") {
    const data = countByYear(broadcastArticles, "airDate");
    datasets.push({
      label: `Broadcasts in ${currentYear - 2}`,
      data: [data[0], 0, 0],
      backgroundColor: "rgb(12, 217, 94)",
      borderRadius: 5,
    });
    datasets.push({
      label: `Broadcasts in ${currentYear - 1}`,
      data: [0, data[1], 0],
      backgroundColor: "rgb(255, 182, 55)",
      borderRadius: 5,
    });
    datasets.push({
      label: `Broadcasts in ${currentYear}`,
      data: [0, 0, data[2]],
      backgroundColor: "rgb(47, 162, 250)",
      borderRadius: 5,
    });
  } else if (contentType === "print") {
    const data = countByYear(printArticles, "publication_date");
    datasets.push({
      label: `Print in ${currentYear - 2}`,
      data: [data[0], 0, 0],
      backgroundColor: "rgb(12, 217, 94)",
      borderRadius: 5,
    });
    datasets.push({
      label: `Print in ${currentYear - 1}`,
      data: [0, data[1], 0],
      backgroundColor: "rgb(255, 182, 55)",
      borderRadius: 5,
    });
    datasets.push({
      label: `Print in ${currentYear}`,
      data: [0, 0, data[2]],
      backgroundColor: "rgb(47, 162, 250)",
      borderRadius: 5,
    });
  }

  return datasets;
};

export const generateCountOverTimeChartData = (
  countOverTimeData: any[],
  contentType: string,
  granularity: string
) => {
  const labels = countOverTimeData.map(item => {
    const date = new Date(item.date || item._id);
    if (granularity === "month") {
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } else if (granularity === "year") {
      return date.getFullYear().toString();
    }
    return date.toLocaleDateString();
  });

  const volumeData = countOverTimeData.map(item => item.count || 0);
  const reachData = countOverTimeData.map(item => item.reach || 0);
  const aveData = countOverTimeData.map(item => item.ave || 0);

  return {
    labels,
    datasets: [
      {
        label: "Volume",
        data: volumeData,
        backgroundColor: "rgb(47, 162, 250)",
        borderColor: "rgb(47, 162, 250)",
        borderRadius: 5,
        yAxisID: "y1",
      },
      {
        label: "Reach",
        data: reachData,
        backgroundColor: "rgb(12, 217, 94)",
        borderColor: "rgb(12, 217, 94)",
        borderWidth: 2,
        yAxisID: "y2",
        tension: 0.4,
        fill: false,
      },
      {
        label: "AVE",
        data: aveData,
        backgroundColor: "rgb(255, 182, 55)",
        borderColor: "rgb(255, 182, 55)",
        borderWidth: 2,
        yAxisID: "y2",
        tension: 0.4,
        fill: false,
      },
    ],
  };
};

export const generateTopJournalistChartData = (data: any[]) => {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  const sentimentTypes = ["Positive", "Neutral", "Negative", "Mixed"];
  const colors = {
    Positive: "rgb(12, 217, 94)",
    Neutral: "rgb(255, 182, 55)",
    Negative: "rgb(255, 88, 76)",
    Mixed: "rgb(47, 162, 250)",
  };

  const labels = data.map(item => item.journalist || "Unknown");
  
  const datasets = sentimentTypes.map(type => ({
    label: type,
    data: data.map(item => item.sentimentCounts?.[type] || 0),
    backgroundColor: colors[type as keyof typeof colors],
    borderRadius: 3,
  }));

  return { labels, datasets };
};
