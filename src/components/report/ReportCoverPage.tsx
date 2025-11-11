import socialLightLogo from "/socialDark.png";
import reportsBg from "@/assets/reportsBg.png";

interface ReportCoverPageProps {
  gradientTop: string;
  gradientBottom: string;
  organizationName: string;
  startDate?: string | Date;
  endDate?: string | Date;
  organizationLogoUrl?: string;
}

export const ReportCoverPage = ({
  gradientTop,
  gradientBottom,
  organizationName,
  startDate,
  endDate,
  organizationLogoUrl
}: ReportCoverPageProps) => {
  console.log("ReportCoverPage - startDate:", startDate, "endDate:", endDate);
  
  // Format the date range
  const formatDateRange = () => {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (!start && !end) return "-";
    
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const s = start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const e = end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      return `${s} - ${e}`;
    }
    
    if (start && !isNaN(start.getTime())) {
      return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
    
    if (end && !isNaN(end.getTime())) {
      return end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
    
    return "-";
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl min-h-[120vh] flex flex-col"
      style={{
        background: `linear-gradient(180deg, ${gradientTop} 0%, ${gradientBottom} 100%)`,
        color: "white",
      }}
    >
      <img
        src={reportsBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
      />
      <div className="relative z-10 pt-16 pb-8 flex justify-center">
        <img
          src={socialLightLogo}
          alt="Social Light"
          className="h-28 w-auto" // or h-32, h-36
        />
      </div>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 -mt-20">
        <h1 className="text-6xl font-bold mb-6 tracking-tight">
          Media Insights Report
        </h1>
        <p className="text-1xl font-regular opacity-90">
          Prepared for {organizationName}
        </p>
      </div>
      <div className="relative z-10 p-8 flex items-end justify-between">
        <span className="text-lg font-semibold opacity-95 pb-10">
          {formatDateRange()}
        </span>
        {organizationLogoUrl && (
          <div className="flex items-center justify-center">
            <img
              src={organizationLogoUrl}
              alt={organizationName}
              className="h-32 w-32 object-contain"
            />
          </div>
        )}
      </div>
      <div className="relative z-10 bg-black/20 font-light py-4 px-10 flex items-center justify-between text-xs">
        <span className="opacity-80">
          © Social Light Botswana | {new Date().getFullYear()}
        </span>
        <span className="opacity-80">
          Unauthorized Reproduction is Prohibited
        </span>
      </div>
    </div>
  );
};
