// analyticsUtils.js

export const generateOverYearsBarData = (
    contentType,
    facebookPosts,
    articles,
    broadcastArticles,
    broadcastOverTimeData,
    printArticles,
    printOverTimeData
) => {
    const gradientBlues = [
        "rgba(173, 216, 230, 0.8)",
        "rgba(100, 149, 237, 0.8)",
        "rgba(70, 130, 180, 0.8)",
        "rgba(0, 105, 148, 0.8)",
        "rgba(0, 75, 115, 0.8)",
    ];
    const borderColors = [
        "rgb(173, 216, 230)",
        "rgb(100, 149, 237)",
        "rgb(70, 130, 180)",
        "rgb(0, 105, 148)",
        "rgb(0, 75, 115)",
    ];

    let sourceData = [];

    if (contentType === "broadcast") {
        const yearMap = {};

        if (!broadcastOverTimeData || broadcastOverTimeData.length === 0) {
            return [];
        }

        broadcastOverTimeData.forEach((item) => {
            if (!item.date && !item._id) return;
            
            const dateStr = item.date || `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
            const date = new Date(dateStr);
            
            if (isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const month = date.getMonth();
            const count = Number(item.count) || 0;

            if (!yearMap[year]) yearMap[year] = new Array(12).fill(0);
            yearMap[year][month] += count;
        });

        return Object.entries(yearMap).map(([year, monthlyCounts], index) => ({
            label: `Broadcast in ${year}`,
            data: monthlyCounts,
            backgroundColor: gradientBlues[index % gradientBlues.length],
            borderColor: borderColors[index % borderColors.length],
            borderRadius: 5,
        }));
    }

    if (contentType === "printMedia" || contentType === "print") {
        const yearMap = {};

        if (!printOverTimeData || printOverTimeData.length === 0) {
            return [];
        }

        printOverTimeData.forEach((item) => {
            if (!item.date && !item._id) return;
            
            const dateStr = item.date || `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
            const date = new Date(dateStr);
            
            if (isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const month = date.getMonth();
            const count = Number(item.count) || 0;

            if (!yearMap[year]) yearMap[year] = new Array(12).fill(0);
            yearMap[year][month] += count;
        });

        return Object.entries(yearMap).map(([year, monthlyCounts], index) => ({
            label: `Print Media in ${year}`,
            data: monthlyCounts,
            backgroundColor: gradientBlues[index % gradientBlues.length],
            borderColor: borderColors[index % borderColors.length],
            borderRadius: 5,
        }));
    }

    // Default for posts and articles
    if (contentType === "posts") {
        sourceData = facebookPosts || [];
    } else if (contentType === "articles") {
        sourceData = articles || [];
    }

    if (sourceData.length === 0) {
        return [];
    }

    const yearData = sourceData.reduce((acc, item) => {
        const rawDate =
            item.createdTime ||
            item.publication_date ||
            item.publicationDate ||
            item.mentionDT ||
            item.date ||
            item.createdAt;

        if (!rawDate) return acc;

        const date = new Date(rawDate);
        if (isNaN(date.getTime())) return acc;

        const year = date.getFullYear();
        const month = date.getMonth();

        if (!acc[year]) acc[year] = new Array(12).fill(0);
        acc[year][month] += 1;

        return acc;
    }, {});

    return Object.entries(yearData).map(([year, monthlyCounts], index) => ({
        label: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} in ${year}`,
        data: monthlyCounts,
        backgroundColor: gradientBlues[index % gradientBlues.length],
        borderColor: borderColors[index % borderColors.length],
        borderRadius: 5,
    }));
};


export const generateCountOverTimeChartData = (countOverTimeData, contentType, granularity) => {
    if (!countOverTimeData || countOverTimeData.length === 0) {
        return {
            labels: [],
            datasets: [
                {
                    label: `${contentType} Count`,
                    data: [],
                    backgroundColor: "rgb(66, 162, 241)",
                    borderWidth: 1,
                    borderRadius: 5,
                    yAxisID: "y1",
                },
                {
                    label: "Total AVE",
                    data: [],
                    backgroundColor: "rgb(17, 221, 81)",
                    borderWidth: 1,
                    borderRadius: 5,
                    yAxisID: "y2",
                },
                {
                    label: "Total Reach",
                    data: [],
                    backgroundColor: "rgb(147, 79, 255)",
                    borderWidth: 1,
                    borderRadius: 5,
                    yAxisID: "y2",
                },
            ],
        };
    }

    return {
        labels: countOverTimeData.map((item) => {
            const fallbackDate =
                item.date ||
                `${item._id?.year}-${String(item._id?.month || 1).padStart(2, "0")}`;

            if (granularity === "week") {
                return fallbackDate.includes("W")
                    ? fallbackDate
                    : `${fallbackDate.split("-")[0]}-WXX`;
            } else if (granularity === "day") {
                const dateObj = new Date(fallbackDate);
                return isNaN(dateObj.getTime()) 
                    ? fallbackDate 
                    : dateObj.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    });
            } else if (granularity === "month") {
                return fallbackDate;
            } else {
                return String(fallbackDate).split("-")[0]; // year only
            }
        }),

        datasets: [
            {
                label: `${contentType} Count`,
                data: countOverTimeData.map((item) => Number(item.count) || 0),
                backgroundColor: "rgb(66, 162, 241)",
                borderWidth: 1,
                borderRadius: 5,
                yAxisID: "y1",
            },
            {
                label: "Total AVE",
                data: countOverTimeData.map((item) => Number(item.totalAVE) || 0),
                backgroundColor: "rgb(17, 221, 81)",
                borderWidth: 1,
                borderRadius: 5,
                yAxisID: "y2",
            },
            {
                label: "Total Reach",
                data: countOverTimeData.map((item) => Number(item.totalReach) || 0),
                backgroundColor: "rgb(147, 79, 255)",
                borderWidth: 1,
                borderRadius: 5,
                yAxisID: "y2",
            },
        ],
    };
};


export const generateTopJournalistChartData = (journalistStats) => {
    if (!journalistStats || journalistStats.length === 0) {
        return { labels: [], datasets: [] };
    }

    const backgroundColors = {
        Positive: "rgb(12, 217, 94)",
        Neutral: "rgb(255, 182, 55)",
        Negative: "rgb(255, 88, 76)",
        Mixed: "rgb(47, 162, 250)",
    };

    // List of top journalists
    const labels = journalistStats.map((j) => {
        const journalist = j.journalist || "Unknown";
        return journalist.length > 30
            ? `${journalist.substring(0, 30)}...`
            : journalist;
    });

    // Prepare sentiment datasets for clustered bars
    const sentimentTypes = ["Positive", "Neutral", "Negative", "Mixed"];

    const datasets = sentimentTypes.map((sentiment) => ({
        label: sentiment,
        data: journalistStats.map((j) => Number(j.sentimentCounts?.[sentiment]) || 0),
        backgroundColor: backgroundColors[sentiment],
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
    }));

    return { labels, datasets };
};

