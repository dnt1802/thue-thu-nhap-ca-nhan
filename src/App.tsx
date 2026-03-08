import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Download, 
  FileText, 
  Settings, 
  AlertTriangle, 
  ChevronRight,
  Info,
  RefreshCw,
  Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { SalaryParams, CalculationResult } from './types';
import { DEFAULT_PARAMS } from './constants';
import { calculateGrossToNet, calculateNetToGross } from './services/salaryService';
import { cn, formatCurrency } from './utils';

// Extend jsPDF with autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function App() {
  const [salary, setSalary] = useState<number>(20000000);
  const [dependents, setDependents] = useState<number>(0);
  const [calcType, setCalcType] = useState<'GROSS_TO_NET' | 'NET_TO_GROSS'>('GROSS_TO_NET');
  const [params, setParams] = useState<SalaryParams>(DEFAULT_PARAMS);
  const [showSettings, setShowSettings] = useState(false);

  const result = useMemo(() => {
    if (calcType === 'GROSS_TO_NET') {
      return calculateGrossToNet(salary, dependents, params);
    } else {
      return calculateNetToGross(salary, dependents, params);
    }
  }, [salary, dependents, calcType, params]);

  const handleExportExcel = () => {
    const data = [
      ['Hạng mục', 'Giá trị (VND)'],
      ['Lương Gross', result.gross],
      ['Bảo hiểm xã hội (8%)', result.insurance.social],
      ['Bảo hiểm y tế (1.5%)', result.insurance.health],
      ['Bảo hiểm thất nghiệp (1%)', result.insurance.unemployment],
      ['Tổng bảo hiểm', result.insurance.total],
      ['Thu nhập trước giảm trừ', result.taxableIncome.beforeDeduction],
      ['Giảm trừ gia cảnh bản thân', result.deductions.personal],
      ['Giảm trừ người phụ thuộc', result.deductions.dependents],
      ['Tổng giảm trừ', result.deductions.total],
      ['Thu nhập tính thuế', result.taxableIncome.afterDeduction],
      ['Thuế thu nhập cá nhân (PIT)', result.pit],
      ['Lương Net (Thực nhận)', result.net],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GiaiTrinhLuong');
    XLSX.writeFile(wb, `Giai_Trinh_Luong_${new Date().getTime()}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title (Note: default fonts don't support Vietnamese well, but we'll try standard)
    doc.setFontSize(18);
    doc.text('BANG GIAI TRINH LUONG', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Ngay tinh: ${new Date().toLocaleDateString('vi-VN')}`, 20, 30);
    doc.text(`Kieu tinh: ${calcType === 'GROSS_TO_NET' ? 'Gross sang Net' : 'Net sang Gross'}`, 20, 37);

    const tableData = [
      ['Luong Gross', formatCurrency(result.gross)],
      ['BHXH (8%)', formatCurrency(result.insurance.social)],
      ['BHYT (1.5%)', formatCurrency(result.insurance.health)],
      ['BHTN (1%)', formatCurrency(result.insurance.unemployment)],
      ['Tong bao hiem', formatCurrency(result.insurance.total)],
      ['Thu nhap truoc giam tru', formatCurrency(result.taxableIncome.beforeDeduction)],
      ['Giam tru ban than', formatCurrency(result.deductions.personal)],
      ['Giam tru nguoi phu thuoc', formatCurrency(result.deductions.dependents)],
      ['Tong giam tru', formatCurrency(result.deductions.total)],
      ['Thu nhap tinh thue', formatCurrency(result.taxableIncome.afterDeduction)],
      ['Thue TNCN (PIT)', formatCurrency(result.pit)],
      ['Luong Net (Thuc nhan)', formatCurrency(result.net)],
    ];

    doc.autoTable({
      startY: 45,
      head: [['Hang muc', 'Gia tri']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`Giai_Trinh_Luong_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
              <Calculator className="w-8 h-8 text-indigo-600" />
              Salary Calculator
            </h1>
            <p className="text-sm text-gray-500 mt-1">Máy tính lương NET-GROSS chuyên nghiệp (Vietnam)</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              Tham số hệ thống
            </button>
          </div>
        </header>

        {/* Warning Alert */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Lưu ý quan trọng</p>
            <p className="opacity-90">Thông số bảo hiểm và biểu thuế có thể thay đổi theo quy định của Nhà nước tại từng thời điểm. Vui lòng kiểm tra lại bảng tham số trước khi tính toán.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-500" />
                Thông tin đầu vào
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Kiểu tính toán
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      onClick={() => setCalcType('GROSS_TO_NET')}
                      className={cn(
                        "py-2 px-4 rounded-lg text-sm font-medium transition-all",
                        calcType === 'GROSS_TO_NET' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      GROSS → NET
                    </button>
                    <button
                      onClick={() => setCalcType('NET_TO_GROSS')}
                      className={cn(
                        "py-2 px-4 rounded-lg text-sm font-medium transition-all",
                        calcType === 'NET_TO_GROSS' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      NET → GROSS
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Mức lương ({calcType === 'GROSS_TO_NET' ? 'Gross' : 'Net'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(Number(e.target.value))}
                      className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">VND</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Số người phụ thuộc
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dependents}
                    onChange={(e) => setDependents(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-600 p-6 rounded-3xl shadow-lg text-white"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Thực nhận (NET)</span>
                <RefreshCw className="w-5 h-5 text-indigo-200 opacity-50" />
              </div>
              <div className="text-4xl font-bold tracking-tight mb-2">
                {formatCurrency(result.net)}
              </div>
              <div className="flex items-center gap-2 text-indigo-100 text-sm">
                <span className="opacity-70">Gross:</span>
                <span className="font-semibold">{formatCurrency(result.gross)}</span>
              </div>
            </motion.div>
          </div>

          {/* Detailed Breakdown Section */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-bottom border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-indigo-500" />
                  Bảng giải trình chi tiết
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportExcel}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Xuất Excel"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Xuất PDF"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-gray-400">Hạng mục</th>
                      <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Số tiền (VND)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-medium">Lương GROSS</td>
                      <td className="py-4 px-6 text-right font-semibold">{formatCurrency(result.gross)}</td>
                    </tr>
                    
                    {/* Insurance Group */}
                    <tr className="bg-gray-50/50">
                      <td colSpan={2} className="py-2 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bảo hiểm bắt buộc</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 text-sm text-gray-600 pl-8">BH Xã hội (8%)</td>
                      <td className="py-3 px-6 text-right text-sm text-rose-500">-{formatCurrency(result.insurance.social)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 text-sm text-gray-600 pl-8">BH Y tế (1.5%)</td>
                      <td className="py-3 px-6 text-right text-sm text-rose-500">-{formatCurrency(result.insurance.health)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 text-sm text-gray-600 pl-8">BH Thất nghiệp (1%)</td>
                      <td className="py-3 px-6 text-right text-sm text-rose-500">-{formatCurrency(result.insurance.unemployment)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors border-b-2 border-gray-100">
                      <td className="py-3 px-6 font-medium">Thu nhập trước giảm trừ</td>
                      <td className="py-3 px-6 text-right font-semibold">{formatCurrency(result.taxableIncome.beforeDeduction)}</td>
                    </tr>

                    {/* Deductions Group */}
                    <tr className="bg-gray-50/50">
                      <td colSpan={2} className="py-2 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giảm trừ gia cảnh</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 text-sm text-gray-600 pl-8">Giảm trừ bản thân</td>
                      <td className="py-3 px-6 text-right text-sm text-gray-500">{formatCurrency(result.deductions.personal)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 text-sm text-gray-600 pl-8">Người phụ thuộc ({dependents})</td>
                      <td className="py-3 px-6 text-right text-sm text-gray-500">{formatCurrency(result.deductions.dependents)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors border-b-2 border-gray-100">
                      <td className="py-3 px-6 font-medium">Thu nhập tính thuế</td>
                      <td className="py-3 px-6 text-right font-semibold text-indigo-600">{formatCurrency(result.taxableIncome.afterDeduction)}</td>
                    </tr>

                    {/* Tax Group */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-medium">Thuế TNCN (PIT)</td>
                      <td className="py-4 px-6 text-right font-semibold text-rose-500">-{formatCurrency(result.pit)}</td>
                    </tr>

                    {/* Final Net */}
                    <tr className="bg-indigo-50/30">
                      <td className="py-5 px-6 font-bold text-indigo-900">Lương NET (Thực nhận)</td>
                      <td className="py-5 px-6 text-right font-bold text-indigo-600 text-xl">{formatCurrency(result.net)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-6 h-6 text-indigo-600" />
                  Cấu hình tham số hệ thống
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 rotate-90" />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                {/* Insurance Rates */}
                <section>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Tỷ lệ đóng bảo hiểm (%)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">BH Xã hội</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={params.insuranceRates.social * 100}
                        onChange={(e) => setParams({
                          ...params, 
                          insuranceRates: { ...params.insuranceRates, social: Number(e.target.value) / 100 }
                        })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">BH Y tế</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={params.insuranceRates.health * 100}
                        onChange={(e) => setParams({
                          ...params, 
                          insuranceRates: { ...params.insuranceRates, health: Number(e.target.value) / 100 }
                        })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">BH Thất nghiệp</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={params.insuranceRates.unemployment * 100}
                        onChange={(e) => setParams({
                          ...params, 
                          insuranceRates: { ...params.insuranceRates, unemployment: Number(e.target.value) / 100 }
                        })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Deductions */}
                <section>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Mức giảm trừ (VND)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Giảm trừ bản thân</label>
                      <input 
                        type="number" 
                        value={params.personalDeduction}
                        onChange={(e) => setParams({ ...params, personalDeduction: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Giảm trừ người phụ thuộc</label>
                      <input 
                        type="number" 
                        value={params.dependentDeduction}
                        onChange={(e) => setParams({ ...params, dependentDeduction: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Caps */}
                <section>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Mức trần đóng bảo hiểm (VND)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Lương cơ sở (x20 cho BHXH/BHYT)</label>
                      <input 
                        type="number" 
                        value={params.baseSalary}
                        onChange={(e) => setParams({ ...params, baseSalary: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Trần BHTN (Vùng 1: 4.96tr x 20)</label>
                      <input 
                        type="number" 
                        value={params.maxUnemploymentSalary}
                        onChange={(e) => setParams({ ...params, maxUnemploymentSalary: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setParams(DEFAULT_PARAMS)}
                  className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Khôi phục mặc định
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                >
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
