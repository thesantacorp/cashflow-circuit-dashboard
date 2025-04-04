
import CrowdfundingManagerWithCurrency from "./CrowdfundingManagerWithCurrency";
import CrowdfundingAnalytics from "./CrowdfundingAnalytics";

const AdminOverviewTab = () => {
  return (
    <div className="space-y-8">
      <CrowdfundingAnalytics />
      <CrowdfundingManagerWithCurrency />
    </div>
  );
};

export default AdminOverviewTab;
