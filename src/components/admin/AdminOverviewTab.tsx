
import CrowdfundingManagerWithCurrency from "./CrowdfundingManagerWithCurrency";
import CrowdfundingAnalytics from "./CrowdfundingAnalytics";

const AdminCrowdfundingTab = () => {
  return (
    <div className="space-y-8">
      <CrowdfundingAnalytics />
      <CrowdfundingManagerWithCurrency />
    </div>
  );
};

export default AdminCrowdfundingTab;
