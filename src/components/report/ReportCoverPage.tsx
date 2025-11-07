import socialLightLogo from "/socialDark.png";
import reportsBg from "@/assets/reportsBg.png";

interface ReportCoverPageProps {
  gradientTop: string;
  gradientBottom: string;
  organizationName: string;
  reportCreatedAt: string;
  organizationLogoUrl?: string;
}

export const ReportCoverPage = ({
  gradientTop,
  gradientBottom,
  organizationName,
  reportCreatedAt,
  organizationLogoUrl
}: ReportCoverPageProps) => {
  // Parse and validate the date
  const formatReportDate = () => {
    if (!reportCreatedAt) return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    
    const date = new Date(reportCreatedAt);
    if (isNaN(date.getTime())) {
      // Invalid date, return current date
      return new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl min-h-[100vh] flex flex-col"
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
        <img src={socialLightLogo} alt="Social Light" className="h-24 w-auto" />
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
        <div className="space-y-1">
          <p className="text-lg font-semibold opacity-95">
            {formatReportDate()}
          </p>
        </div>
        {organizationLogoUrl && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <img
              src={organizationLogoUrl}
              alt={organizationName}
              className="h-20 w-20 object-contain"
            />
          </div>
        )}
      </div>
      <div className="relative z-10 bg-black/20 py-3 px-8 flex items-center justify-between text-sm">
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
