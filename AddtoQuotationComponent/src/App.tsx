import { useState } from "react";
import SingleSearch from "./imports/SingleSearch";
import { AddToQuotationDialog } from "./components/AddToQuotationDialog";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    name: string;
    orderingNo: string;
  } | null>(null);

  const handleAddToQuotation = (productName: string, orderingNo: string) => {
    setSelectedProduct({ name: productName, orderingNo });
    setDialogOpen(true);
  };

  const handleSelectQuotation = (quotationId: string) => {
    toast.success(`Product added to ${quotationId}`);
  };

  const handleCreateNew = () => {
    toast.success("Creating new quotation...");
  };

  return (
    <div className="size-full">
      <SingleSearch />
      
      {/* Demo button to trigger the dialog */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={() => handleAddToQuotation("Advanced Industrial Motor", "SS-109-12345")}
          className="bg-[#1c87c9] text-white px-6 py-3 rounded-[8px] shadow-lg hover:bg-[#156ba8] transition-colors"
        >
          Demo: Add to Quotation
        </button>
      </div>

      <AddToQuotationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productName={selectedProduct?.name}
        orderingNo={selectedProduct?.orderingNo}
        onSelectQuotation={handleSelectQuotation}
        onCreateNew={handleCreateNew}
      />
      
      <Toaster />
    </div>
  );
}
