import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Search, Plus } from "lucide-react";

interface Quotation {
  id: string;
  name: string;
  createdDate: string;
  itemCount: number;
  status: "open" | "draft" | "pending";
}

interface AddToQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  orderingNo?: string;
  onSelectQuotation?: (quotationId: string) => void;
  onCreateNew?: () => void;
}

// Mock data for quotations
const mockQuotations: Quotation[] = [
  { id: "Q-2024-001", name: "Industrial Valve Project", createdDate: "2024-10-20", itemCount: 15, status: "open" },
  { id: "Q-2024-002", name: "High Pressure Systems", createdDate: "2024-10-22", itemCount: 8, status: "open" },
  { id: "Q-2024-003", name: "NPT Valve Assembly", createdDate: "2024-10-23", itemCount: 12, status: "open" },
  { id: "Q-2024-004", name: "Swaglok Components Q4", createdDate: "2024-10-25", itemCount: 23, status: "open" },
  { id: "Q-2024-005", name: "Motor and Valve Package", createdDate: "2024-10-26", itemCount: 6, status: "draft" },
  { id: "Q-2024-006", name: "SS360 Materials Order", createdDate: "2024-10-27", itemCount: 18, status: "open" },
];

export function AddToQuotationDialog({
  open,
  onOpenChange,
  productName,
  orderingNo,
  onSelectQuotation,
  onCreateNew,
}: AddToQuotationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQuotations = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockQuotations;
    }
    
    const query = searchQuery.toLowerCase();
    return mockQuotations.filter(
      (q) =>
        q.name.toLowerCase().includes(query) ||
        q.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectQuotation = (quotationId: string) => {
    onSelectQuotation?.(quotationId);
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleCreateNew = () => {
    onCreateNew?.();
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Quotation</DialogTitle>
          {(productName || orderingNo) && (
            <p className="text-[#4f7a94]">
              {productName && <span>{productName}</span>}
              {productName && orderingNo && <span> • </span>}
              {orderingNo && <span>{orderingNo}</span>}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#4f7a94]" />
            <Input
              placeholder="Search quotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#e8edf2] border-0"
            />
          </div>

          {/* Quotation List */}
          <ScrollArea className="h-[400px] rounded-[8px] border border-[#d1dee5]">
            <div className="flex flex-col">
              {filteredQuotations.map((quotation, index) => (
                <button
                  key={quotation.id}
                  onClick={() => handleSelectQuotation(quotation.id)}
                  className={`flex flex-col gap-1 px-4 py-3 text-left hover:bg-[#f0f2f5] transition-colors ${
                    index !== 0 ? "border-t border-[#e5e8eb]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#0d171c]">{quotation.name}</span>
                    <span className="bg-[#1c87c9] text-white px-2 py-0.5 rounded text-[12px]">
                      {quotation.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[#4f7a94]">
                    <span>{quotation.id}</span>
                    <span>•</span>
                    <span>{quotation.itemCount} items</span>
                    <span>•</span>
                    <span>{quotation.createdDate}</span>
                  </div>
                </button>
              ))}

              {/* No Results Message */}
              {filteredQuotations.length === 0 && searchQuery && (
                <div className="px-4 py-8 text-center text-[#4f7a94]">
                  No quotations found matching "{searchQuery}"
                </div>
              )}

              {/* New Quotation Option */}
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f0f2f5] transition-colors border-t-2 border-[#d1dee5] bg-[#f7fafa]"
              >
                <div className="flex items-center justify-center size-8 rounded-full bg-[#1c87c9]">
                  <Plus className="size-5 text-white" />
                </div>
                <span className="text-[#1c87c9]">Create New Quotation</span>
              </button>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
