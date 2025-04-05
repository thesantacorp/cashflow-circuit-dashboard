
import CrowdfundingManagerWithCurrency from "./CrowdfundingManagerWithCurrency";
import ProductIdeasOverview from "./ProductIdeasOverview";

const AdminOverviewTab = () => {
  return (
    <div className="space-y-8">
      <ProductIdeasOverview />
      <CrowdfundingManagerWithCurrency />
    </div>
  );
};

export default AdminOverviewTab;
