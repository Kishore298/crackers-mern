import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Printer, Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const GstBillPage = () => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
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
    // Explicitly not populating amount from DB as requested
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

  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grandTotal = subtotal + cgst + sgst;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("invoice-preview");
    const opt = {
      margin:       10,
      filename:     `V_Crackers_Bill_${Date.now()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveItemIndex(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1 space-y-6 no-print">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-800">Customer Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Enter address"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bill Preview / Form Items */}
        <div className="lg:col-span-2">
          {/* Editor for Items (No Print) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 no-print">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Bill Items</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-start relative">
                  <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleProductSearch(e.target.value, index)}
                      onClick={() => {
                        if (item.name) handleProductSearch(item.name, index);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Type custom name or search"
                    />
                    {/* Dropdown for suggestions */}
                    {activeItemIndex === index && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => selectProduct(product, index)}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          >
                            {product.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(index, "qty", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(e) => updateItem(index, "rate", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  
                  <div className="pt-6">
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Printable Invoice View */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 printable-invoice" id="invoice-preview">
            <div className="border-2 border-gray-800 p-6 relative bg-white">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-extrabold text-red-700 tracking-tight mb-1">V CRACKERS</h1>
                <p className="text-sm font-semibold">Dealers in: All kinds of Standard Fireworks</p>
                <p className="text-sm">Sivakasi, Tamil Nadu</p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800 font-bold text-sm">
                  <span>GSTIN: 33AKHPA7351F1ZK</span>
                  <span className="inline-flex items-center justify-center bg-gray-800 text-white px-4 py-1.5 rounded-full uppercase tracking-widest text-[10px] leading-none">Tax Invoice</span>
                  <span>State Code: 33</span>
                </div>
              </div>

              {/* Customer Details Row */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-y border-gray-800 py-4">
                <div>
                  <p><span className="font-semibold">M/S:</span> {customerName || "_______________________"}</p>
                  <p><span className="font-semibold">Address:</span> {customerAddress || "_______________________"}</p>
                  <p><span className="font-semibold">Mobile:</span> {customerPhone || "_______________________"}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-semibold">Invoice Date:</span> {new Date(invoiceDate).toLocaleDateString("en-IN")}</p>
                  <p><span className="font-semibold">Invoice No:</span> VCR-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              {/* Table */}
              <table className="w-full mb-4 text-sm border-collapse">
                <thead>
                  <tr className="border-y-2 border-gray-800 bg-gray-50">
                    <th className="py-2 px-2 text-left w-12 border-r border-gray-800">S.No</th>
                    <th className="py-2 px-2 text-left border-r border-gray-800">Product Name</th>
                    <th className="py-2 px-2 text-center w-20 border-r border-gray-800">Qty</th>
                    <th className="py-2 px-2 text-right w-28 border-r border-gray-800">Rate (₹)</th>
                    <th className="py-2 px-2 text-right w-32">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="border-b-2 border-gray-800">
                  {items.map((item, index) => {
                    const qty = parseFloat(item.qty) || 0;
                    const rate = parseFloat(item.rate) || 0;
                    const amount = qty * rate;
                    return (
                      <tr key={item.id} className="border-b border-gray-300">
                        <td className="py-2 px-2 text-left border-r border-gray-800">{index + 1}</td>
                        <td className="py-2 px-2 text-left font-medium border-r border-gray-800">{item.name}</td>
                        <td className="py-2 px-2 text-center border-r border-gray-800">{item.qty}</td>
                        <td className="py-2 px-2 text-right border-r border-gray-800">{rate.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right">{amount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  
                  {/* Empty rows for spacing if needed */}
                  {items.length < 5 && [...Array(5 - items.length)].map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="py-4 px-2 border-r border-gray-800"></td>
                      <td className="py-4 px-2 border-r border-gray-800"></td>
                      <td className="py-4 px-2 border-r border-gray-800"></td>
                      <td className="py-4 px-2 border-r border-gray-800"></td>
                      <td className="py-4 px-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end text-sm mb-4">
                <div className="w-64">
                  <div className="flex justify-between py-1">
                    <span className="font-semibold">Sub Total:</span>
                    <span>₹ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-gray-600">CGST (9%):</span>
                    <span>₹ {cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="font-medium text-gray-600">SGST (9%):</span>
                    <span>₹ {sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-bold text-gray-900">
                    <span>Grand Total:</span>
                    <span>₹ {Math.round(grandTotal).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
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
            width: 100%;
            height: 100vh;
            margin: 0;
            padding: 20px;
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
