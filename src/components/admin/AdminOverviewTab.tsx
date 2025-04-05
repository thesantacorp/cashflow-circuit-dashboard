
import CrowdfundingManagerWithCurrency from "./CrowdfundingManagerWithCurrency";
import ProductIdeasOverview from "./ProductIdeasOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminOverviewTab = () => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Product Ideas Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8">
            <ProductIdeasOverview />
            <CrowdfundingManagerWithCurrency />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverviewTab;
