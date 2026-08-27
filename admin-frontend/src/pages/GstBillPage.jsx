import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Printer, Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const GstBillPage = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerStateCode, setCustomerStateCode] = useState("33");
  const [customerAadhar, setCustomerAadhar] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNo, setInvoiceNo] = useState("");

  useEffect(() => {
    // Generate an initial invoice number based on current time
    setInvoiceNo(Date.now().toString().slice(-6));
  }, []);

  const [items, setItems] = useState([
    { id: Date.now(), name: "", qty: 1, rate: 0 },
  ]);

  const [searchResults, setSearchResults] = useState([]);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const searchTimeout = useRef(null);

  const handleProductSearch = async (query, index) => {
    const updatedItems = [...items];
    updatedItems[index].name = query;
    setItems(updatedItems);
    setActiveItemIndex(index);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/products?search=${query}&limit=5`);
        setSearchResults(data.products || []);
      } catch (error) {
        console.error("Error searching products:", error);
      }
    }, 300);
  };

  const selectProduct = (product, index) => {
    const updatedItems = [...items];
    updatedItems[index].name = product.name;
    setItems(updatedItems);
    setSearchResults([]);
    setActiveItemIndex(null);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: "", qty: 1, rate: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      toast.error("At least one item is required");
    }
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0),
    0
  );

  const isOutsideState = customerStateCode !== "33";
  const igst = isOutsideState ? subtotal * 0.18 : 0;
  const grandTotal = subtotal + igst;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("invoice-preview");
    const opt = {
      margin: 5,
      filename: `V_Crackers_Bill_${invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveItemIndex(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Format date as DD/MM/YYYY for display
  const displayDate = new Date(invoiceDate).toLocaleDateString("en-IN", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold text-gray-900">Custom GST Bill Generator</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print Bill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
        {/* Form Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-800 border-b pb-2">Invoice Details</h2>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice No</label>
              <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 outline-none" />
            </div>

            <h2 className="font-semibold text-gray-800 border-b pb-2 pt-2">Customer Details</h2>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Address</label>
              <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 outline-none" rows="2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State Code</label>
                <input type="text" value={customerStateCode} onChange={(e) => setCustomerStateCode(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Aadhar Number</label>
                <input type="text" value={customerAadhar} onChange={(e) => setCustomerAadhar(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 outline-none" placeholder={isOutsideState ? "Required" : "Optional"} />
              </div>
            </div>
          </div>
        </div>

        {/* Bill Items Section */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h2 className="font-semibold text-gray-800">Bill Items</h2>
              <button onClick={addItem} className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"><Plus className="w-4 h-4" /> Add Item</button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description of Goods</label>
                    <input type="text" value={item.name} onChange={(e) => handleProductSearch(e.target.value, index)} onClick={() => { if (item.name) handleProductSearch(item.name, index); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Type custom name or search" />
                    {activeItemIndex === index && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((product) => (
                          <div key={product._id} onClick={() => selectProduct(product, index)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">{product.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty (Cs)</label>
                    <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Rate (₹)</label>
                    <input type="number" min="0" value={item.rate} onChange={(e) => updateItem(index, "rate", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div className="pt-6">
                    <button onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Printable Invoice View */}
          <div className="flex justify-center w-full pt-4">
            <div id="invoice-preview" className="printable-invoice bg-white text-black font-sans flex flex-col relative w-[210mm] min-h-[297mm] shadow-lg border border-gray-200 p-[10mm]">
              <div className="text-right text-[11px] font-bold mb-1">Duplicate for Transporter</div>
              <div className="border-2 border-black flex flex-col flex-1 h-full">

            {/* Header row 1 */}
            <div className="text-center border-b-2 border-black py-2">
              <h1 className="text-[26px] font-extrabold uppercase leading-tight tracking-wide">V CRACKERS</h1>
              <p className="text-xs font-bold leading-none tracking-wide mt-1">Dealers in: All kinds of Standard Fireworks, Sivakasi</p>
            </div>

            {/* Header row 2 */}
            <div className="flex border-b-2 border-black text-[13px]">
              <div className="w-[45%] border-r-2 border-black p-1.5 font-bold flex items-center">
                GSTIN : 33AKHPA7351F1ZK
              </div>
              <div className="w-[15%] border-r-2 border-black p-1 flex flex-col items-center justify-center font-bold text-xs leading-tight">
                <div>State</div>
                <div>Code 33</div>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="border-b-2 border-black p-1.5 font-bold">
                  Invoice No : {invoiceNo}
                </div>
                <div className="flex flex-1">
                  <div className="w-[45%] p-1.5 font-bold border-r-2 border-black flex items-center">
                    Date : {displayDate}
                  </div>
                  <div className="flex-1 p-1.5 font-bold flex items-center">
                    HSN Code &nbsp;&nbsp;&nbsp; 3604
                  </div>
                </div>
              </div>
            </div>

            {/* Header row 3 */}
            <div className="flex border-b-2 border-black text-[13px] min-h-[40px]">
              <div className="w-1/2 border-r-2 border-black p-1.5 leading-tight">
                Name: {customerName} {customerPhone ? `, ${customerPhone}` : ""}
              </div>
              <div className="w-1/2 p-1.5 leading-tight">
                Delivery : {customerAddress}
              </div>
            </div>

            {/* Header row 4 (Conditional) */}
            {isOutsideState ? (
              <div className="flex border-b-2 border-black text-[13px] min-h-[30px]">
                <div className="w-1/2 border-r-2 border-black p-1.5">
                  State Code : {customerStateCode}
                </div>
                <div className="w-1/2 p-1.5">
                  Aadhar no. {customerAadhar}
                </div>
              </div>
            ) : (
              <div className="border-b-2 border-black text-[13px] p-1.5 min-h-[30px]">
                GSTIN no. Own Use
              </div>
            )}

            {/* Table Header */}
            <div className="flex border-b-2 border-black text-[13px] font-bold text-center">
              <div className="w-10 border-r-2 border-black p-1.5 flex items-center justify-center">No</div>
              <div className="flex-1 border-r-2 border-black p-1.5 flex items-center justify-center">Description of Goods</div>
              <div className="w-16 border-r-2 border-black p-1.5 flex items-center justify-center">Qty</div>
              <div className="w-24 border-r-2 border-black p-1.5 flex items-center justify-center">Rate</div>
              <div className="w-28 p-1 flex items-center justify-center leading-tight">Taxable<br />value</div>
            </div>

            {/* Table Body - Flex 1 to take remaining space */}
            <div className="flex flex-1 relative min-h-[400px]">
              {/* Background borders for columns */}
              <div className="absolute inset-0 flex pointer-events-none">
                <div className="w-10 border-r-2 border-black h-full"></div>
                <div className="flex-1 border-r-2 border-black h-full"></div>
                <div className="w-16 border-r-2 border-black h-full"></div>
                <div className="w-24 border-r-2 border-black h-full"></div>
                <div className="w-28 h-full"></div>
              </div>

              {/* Foreground content */}
              <div className="w-full z-10 flex flex-col">
                <div className="flex-1">
                  {items.map((item, index) => {
                    const qty = parseFloat(item.qty) || 0;
                    const rate = parseFloat(item.rate) || 0;
                    const amount = qty * rate;
                    return (
                      <div key={item.id} className="flex text-[13px]">
                        <div className="w-10 p-1.5 text-center">{index + 1}</div>
                        <div className="flex-1 p-1.5 pl-2">{item.name}</div>
                        <div className="w-16 p-1.5 text-center">{item.qty} {item.qty ? 'Cs' : ''}</div>
                        <div className="w-24 p-1.5 text-right pr-2">{rate > 0 ? rate.toFixed(2) : ''}</div>
                        <div className="w-28 p-1.5 text-right pr-2">{amount > 0 ? amount.toFixed(2) : ''}</div>
                      </div>
                    );
                  })}

                  {/* Stamp for inside state */}
                  {!isOutsideState && (
                    <div className="flex mt-24 ml-12">
                      <div className="border-[3px] border-black px-6 py-2 text-center font-extrabold text-[13px] leading-tight w-64 uppercase">
                        Composition Tax Payer<br />Tax Not Collected
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Totals & Footer Grid */}
            <div className="flex border-t-2 border-black text-[13px]">
              <div className="flex-1 flex flex-col justify-between p-2">
                <div className="font-bold">For V CRACKERS</div>
                <div className="font-bold mt-16">Authorised Signature</div>
              </div>
              <div className="w-[200px] border-l-2 border-black flex flex-col font-bold">
                <div className="flex border-b-2 border-black">
                  <div className="flex-1 p-1.5 text-right border-r-2 border-black">Gross Amount</div>
                  <div className="w-[110px] p-1.5 text-right">{subtotal.toFixed(2)}</div>
                </div>
                {isOutsideState && (
                  <div className="flex border-b-2 border-black">
                    <div className="flex-1 p-1.5 text-right border-r-2 border-black">IGST 18%</div>
                    <div className="w-[110px] p-1.5 text-right">{igst.toFixed(2)}</div>
                  </div>
                )}
                <div className="flex flex-1 items-end">
                  <div className="flex-1 p-1.5 text-right border-r-2 border-black h-full flex justify-end items-end">Net Amount</div>
                  <div className="w-[110px] p-1.5 text-right h-full flex justify-end items-end">{grandTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
      

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-invoice, .printable-invoice * {
            visibility: visible;
          }
          .printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0;
            padding: 10mm;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default GstBillPage;
