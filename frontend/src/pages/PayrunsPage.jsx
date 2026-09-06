import React, { useState, useEffect } from "react";
import api from "../api/client";
import { subscribeCache } from "../api/cache";
import { getSocket } from "../utils/socket";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { CenteredSpinner } from "../components/ui/Loading";
import { formatDate } from "../utils/dateUtils";
import {
  Receipt,
  Plus,
  Calculator,
  CheckCircle2,
  DollarSign,
  Mail,
  AlertTriangle,
  FileText,
  ArrowRight,
  UserCheck,
  Download,
  Trash2,
  Search,
} from "lucide-react";

export default function PayrunsPage() {
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState("batches"); // 'batches' | 'payslips'
  const [payslipSearch, setPayslipSearch] = useState("");
  const [payruns, setPayruns] = useState([]);
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [payslipDetailData, setPayslipDetailData] = useState(null);
  const [loadingLines, setLoadingLines] = useState(false);
  const [empFilterSearch, setEmpFilterSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [batchStatusFilter, setBatchStatusFilter] = useState("All");

  // Confirm dialog state
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Flat list of all generated payslips across all batches for Dedicated Payslips Directory
  const allPayslips = payruns.flatMap((pr) =>
    (pr.payslips || []).map((ps) => ({
      ...ps,
      payrun_name: pr.name,
      payrun_status: pr.status,
    })),
  );

  const filteredAllPayslips = allPayslips.filter((ps) => {
    if (!payslipSearch) return true;
    const term = payslipSearch.toLowerCase();
    return (
      (ps.employee_name && ps.employee_name.toLowerCase().includes(term)) ||
      (ps.emp_id && ps.emp_id.toLowerCase().includes(term)) ||
      (ps.payrun_name && ps.payrun_name.toLowerCase().includes(term))
    );
  });

  const handleDeletePayrun = (prId, name, e) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Payroll Batch",
      message: `Are you sure you want to delete payrun "${name}"? This will delete all generated payslips and lines.`,
      confirmText: "Delete Payrun",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/payruns/${prId}`);
          api.invalidate(["payruns", "dashboard"]);
          toast.info(`Payrun "${name}" deleted.`);
          if (selectedPayrun?.id === prId) setSelectedPayrun(null);
          fetchPayruns();
        } catch (err) {
          toast.error(err.message || "Failed to delete payrun.");
        } finally {
          setConfirmConfig(null);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  // Wizard Step 1 & 2 state
  const [structures, setStructures] = useState([]);
  const [step1Data, setStep1Data] = useState({
    name: "September 2026 Payroll",
    salary_structure_id: "1",
    period_start: "2026-09-01",
    period_end: "2026-09-30",
  });
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);

  // Email report state
  const [emailReport, setEmailReport] = useState(null);

  const fetchPayruns = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getFetch("/payruns");
      const list = res.data || [];
      setPayruns(list);

      // If a payrun is currently open in detail view, sync its summary data
      if (selectedPayrun?.id) {
        const updatedSelected = list.find((p) => p.id === selectedPayrun.id);
        if (updatedSelected) {
          setSelectedPayrun((prev) =>
            prev ? { ...prev, ...updatedSelected } : null,
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
    api.getFetch("/salary/structures").then((r) => setStructures(r.data || []));

    const unsubscribe = subscribeCache(() => {
      fetchPayruns(true);
    });
    return () => unsubscribe();
  }, []);

  // Socket.IO real-time listener for Payrun & Payslip updates
  useEffect(() => {
    const token = localStorage.getItem("pp360_token");
    const socket = getSocket(token);
    if (!socket) return;

    const handlePayrunSocketUpdate = () => {
      fetchPayruns(true);
    };

    socket.on("PAYRUN_UPDATED", handlePayrunSocketUpdate);
    socket.on("PAYSLIP_UPDATED", handlePayrunSocketUpdate);

    return () => {
      socket.off("PAYRUN_UPDATED", handlePayrunSocketUpdate);
      socket.off("PAYSLIP_UPDATED", handlePayrunSocketUpdate);
    };
  }, []);

  const handleSelectPayrun = async (id, isBackground = false) => {
    try {
      const res = await api.getFetch(`/payruns/${id}`);
      setSelectedPayrun(res.data);
    } catch (err) {
      if (!isBackground) toast.error(err.message || "Failed to select payrun.");
    }
  };

  const handleOpenPayslipDetail = async (slip) => {
    setSelectedPayslip(slip);
    setPayslipDetailData(null);
    setLoadingLines(true);
    try {
      const res = await api.getFetch(`/payslips/${slip.id}`);
      setPayslipDetailData(res.data);
    } catch {
      setPayslipDetailData(slip);
    } finally {
      setLoadingLines(false);
    }
  };

  // Step 1 -> Step 2
  const handleWizardContinue = async (e) => {
    e.preventDefault();
    try {
      const res = await api.getFetch("/payruns/eligible-employees", {
        params: step1Data,
      });
      setEligibleEmployees(res.data || []);
      setSelectedEmpIds((res.data || []).map((emp) => emp.id));
      setEmpFilterSearch("");
      setWizardStep(2);
    } catch (err) {
      toast.error(err.message || "Failed to fetch eligible employees.");
    }
  };

  // Step 2 -> Create Payrun
  const handleFinalCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      toast.warning("Please select at least one employee for the Payrun.");
      return;
    }
    toast.info(
      `Creating payroll batch with ${selectedEmpIds.length} employees... Please wait.`,
    );
    try {
      const res = await api.post("/payruns", {
        ...step1Data,
        employee_ids: selectedEmpIds,
      });
      api.invalidate(["payruns", "dashboard", "employees"]);
      setShowWizard(false);
      setWizardStep(1);
      toast.success(
        `Payrun "${step1Data.name}" created successfully with ${selectedEmpIds.length} employees!`,
      );
      const createdPayrunId = res.data.id;
      const listRes = await api.getFetch("/payruns");
      setPayruns(listRes.data || []);
      if (createdPayrunId) {
        await handleSelectPayrun(createdPayrunId);
      }
    } catch (err) {
      toast.error(err.message || "Failed to create payrun.");
    }
  };

  // Payrun State Machine Actions
  const handleCompute = () => {
    if (actionLoading || !selectedPayrun) return;
    setConfirmConfig({
      open: true,
      title: "Compute Payrun Batch",
      description: `Are you sure you want to compute salary rules for ${selectedPayrun.name}? This will calculate earnings, deductions, gross and net pay for all included employees.`,
      confirmText: "Compute Now",
      variant: "primary",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await api.post(`/payruns/${selectedPayrun.id}/compute`);
          api.invalidate(["payruns", "dashboard"]);
          toast.success("Payrun computed successfully!");
          setSelectedPayrun(null);
          setActiveSubTab("batches");
          await fetchPayruns();
        } catch (err) {
          toast.error(err.message || "Failed to compute payrun.");
        } finally {
          setActionLoading(false);
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleValidate = () => {
    if (actionLoading || !selectedPayrun) return;
    setConfirmConfig({
      open: true,
      title: "Validate Payrun",
      description: `Are you sure you want to mark ${selectedPayrun.name} as Validated?`,
      confirmText: "Validate",
      variant: "primary",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await api.put(`/payruns/${selectedPayrun.id}/status`, {
            status: "Validated",
          });
          api.invalidate(["payruns", "dashboard"]);
          toast.success("Payrun validated successfully!");
          setSelectedPayrun(null);
          setActiveSubTab("batches");
          await fetchPayruns();
        } catch (err) {
          toast.error(err.message || "Failed to validate payrun.");
        } finally {
          setActionLoading(false);
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleMarkPaid = () => {
    if (actionLoading || !selectedPayrun) return;
    setConfirmConfig({
      open: true,
      title: "Mark Payrun as Paid",
      description: `Are you sure you want to mark ${selectedPayrun.name} as Paid? This will finalize the payroll batch.`,
      confirmText: "Mark Paid",
      variant: "primary",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await api.put(`/payruns/${selectedPayrun.id}/status`, {
            status: "Paid",
          });
          api.invalidate(["payruns", "dashboard"]);
          toast.success("Payrun marked as paid!");
          setSelectedPayrun(null);
          setActiveSubTab("batches");
          await fetchPayruns();
        } catch (err) {
          toast.error(err.message || "Failed to mark payrun as paid.");
        } finally {
          setActionLoading(false);
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleSendBulkEmail = () => {
    if (actionLoading || !selectedPayrun) return;
    setConfirmConfig({
      open: true,
      title: "Send Payslips via Email",
      description: `Are you sure you want to send payslips via email to all employees in ${selectedPayrun.name}?`,
      confirmText: "Send Bulk Email",
      variant: "primary",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const res = await api.post(
            `/payruns/${selectedPayrun.id}/send-payslips`,
          );
          setEmailReport(res.data);
          api.invalidate(["payruns", "dashboard"]);
          toast.success(
            res.data?.message ||
              `Payslips emailed successfully! (Sent: ${res.data?.sentCount || 0})`,
          );
          setSelectedPayrun(null);
          setActiveSubTab("batches");
          await fetchPayruns();
        } catch (err) {
          toast.error(err.message || "Failed to send payslips.");
        } finally {
          setActionLoading(false);
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleDownloadPDF = async (slipId, empName, e) => {
    if (e) e.stopPropagation();
    try {
      toast.info("Downloading PDF payslip...");
      const token = localStorage.getItem("pp360_token");
      const baseUrl = api.getActiveBaseURL();
      const pdfEndpoint = `${baseUrl.replace(/\/$/, "")}/payslips/${slipId}/pdf?token=${token}`;
      const response = await fetch(pdfEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payslip_${empName ? String(empName).replace(/\s+/g, "_") : slipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF Payslip downloaded!");
    } catch (err) {
      console.error("PDF download error:", err);
      const token = localStorage.getItem("pp360_token");
      const baseUrl = api.getActiveBaseURL();
      window.open(
        `${baseUrl.replace(/\/$/, "")}/payslips/${slipId}/pdf?token=${token}`,
        "_blank",
      );
    }
  };

  const handleSendSinglePayslipEmail = async (slipId, empName, e) => {
    if (e) e.stopPropagation();
    try {
      toast.info(`Sending email with PDF attachment to ${empName || "employee"}...`);
      const res = await api.post(`/payslips/${slipId}/send-email`);
      if (res && res.data?.email) {
        toast.success(`Payslip PDF email successfully sent to ${res.data.email}!`);
      } else {
        toast.success(`Payslip PDF email sent successfully!`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to send payslip email.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Subtab Navigation Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "12px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setActiveSubTab("batches")}
            className={`btn ${activeSubTab === "batches" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "13px", fontWeight: "600" }}
          >
            <Receipt size={16} /> Payrun Batches ({payruns.length})
          </button>
          <button
            onClick={() => setActiveSubTab("payslips")}
            className={`btn ${activeSubTab === "payslips" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "13px", fontWeight: "600" }}
          >
            <FileText size={16} /> Dedicated Payslips Directory (
            {allPayslips.length})
          </button>
        </div>

        {activeSubTab === "batches" && (
          <button
            onClick={() => {
              setWizardStep(1);
              setShowWizard(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} /> New Payrun (Wizard)
          </button>
        )}
      </div>

      {loading ? (
        <CenteredSpinner />
      ) : activeSubTab === "payslips" ? (
        /* DEDICATED PAYSLIPS LIST DIRECTORY VIEW (PDF Required) */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            className="card"
            style={{
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FileText size={20} color="var(--secondary-blue)" />
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0 }}>
                  Dedicated Payslips Directory
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Itemized list of all generated payslips across all payroll
                  batches
                </p>
              </div>
            </div>
            <div style={{ position: "relative", width: "280px" }}>
              <Search
                size={15}
                color="var(--text-muted)"
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="text"
                placeholder="Search employee, ID, or batch..."
                className="form-input"
                value={payslipSearch}
                onChange={(e) => setPayslipSearch(e.target.value)}
                style={{ paddingLeft: "32px", fontSize: "12px" }}
              />
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Payroll Batch</th>
                  <th>Period</th>
                  <th>Worked Days</th>
                  <th>Gross Earnings</th>
                  <th>Deductions</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllPayslips.length > 0 ? (
                  filteredAllPayslips.map((s, idx) => (
                    <tr key={`ded-payslip-${s.id || idx}-${idx}`}>
                      <td style={{ fontWeight: "600" }}>{s.employee_name}</td>
                      <td>
                        <code>{s.emp_id}</code>
                      </td>
                      <td
                        style={{
                          color: "var(--secondary-blue)",
                          fontWeight: "500",
                        }}
                      >
                        {s.payrun_name}
                      </td>
                      <td>
                        {formatDate(s.period_start)} –{" "}
                        {formatDate(s.period_end)}
                      </td>
                      <td>{s.worked_days} days</td>
                      <td>
                        ₹ {parseFloat(s.gross_amount).toLocaleString("en-IN")}
                      </td>
                      <td style={{ color: "#E11D48" }}>
                        - ₹{" "}
                        {parseFloat(s.deduction_amount).toLocaleString("en-IN")}
                      </td>
                      <td style={{ fontWeight: "700", color: "#10B981" }}>
                        ₹ {parseFloat(s.net_amount).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span
                          className={`badge ${s.status === "Paid" ? "badge-paid" : "badge-active"}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "6px",
                          }}
                        >
                          <button
                            onClick={() => handleOpenPayslipDetail(s)}
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            View Detail
                          </button>
                          <button
                            onClick={(e) =>
                              handleDownloadPDF(s.id, s.employee_name, e)
                            }
                            className="btn btn-primary"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            <Download size={12} /> PDF
                          </button>
                          <button
                            onClick={(e) =>
                              handleSendSinglePayslipEmail(s.id, s.employee_name, e)
                            }
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <Mail size={12} /> Email
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "var(--text-muted)",
                      }}
                    >
                      No payslips found in the directory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: "24px",
          }}
        >
          {/* Payruns List Left */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "700", margin: 0 }}>
                Payroll Batches
              </h3>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {payruns.length} Total
              </span>
            </div>

            {/* Batch Search & Status Filter Controls */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  color="var(--text-muted)"
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search batch name..."
                  className="form-input"
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  style={{ paddingLeft: "30px", fontSize: "12px" }}
                />
              </div>

              <select
                className="form-select"
                value={batchStatusFilter}
                onChange={(e) => setBatchStatusFilter(e.target.value)}
                style={{ fontSize: "12px", padding: "6px 10px" }}
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Computed">Computed</option>
                <option value="Validated">Validated</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxHeight: "520px",
                overflowY: "auto",
              }}
            >
              {payruns
                .filter((pr) => {
                  if (
                    batchStatusFilter !== "All" &&
                    pr.status !== batchStatusFilter
                  )
                    return false;
                  if (!batchSearch) return true;
                  const term = batchSearch.toLowerCase();
                  return (
                    (pr.name && pr.name.toLowerCase().includes(term)) ||
                    (pr.salary_structure_name &&
                      pr.salary_structure_name.toLowerCase().includes(term))
                  );
                })
                .map((pr, idx) => (
                  <div
                    key={`pr-card-${pr.id || idx}-${idx}`}
                    onClick={() => handleSelectPayrun(pr.id)}
                    className="card"
                    style={{
                      cursor: "pointer",
                      borderColor:
                        selectedPayrun?.id === pr.id
                          ? "var(--secondary-blue)"
                          : "var(--border-color)",
                      backgroundColor:
                        selectedPayrun?.id === pr.id
                          ? "rgba(179, 207, 229, 0.15)"
                          : "var(--card-bg)",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "14px",
                          color: "var(--deep-navy)",
                        }}
                      >
                        {pr.name}
                      </div>
                      <button
                        onClick={(e) => handleDeletePayrun(pr.id, pr.name, e)}
                        className="btn btn-secondary"
                        title="Delete Payrun"
                        style={{ padding: "3px 6px", color: "var(--danger)" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      {formatDate(pr.period_start)} to{" "}
                      {formatDate(pr.period_end)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#10B981",
                        }}
                      >
                        ₹{" "}
                        {parseFloat(pr.total_net || 0).toLocaleString("en-IN")}
                      </span>
                      <span
                        className={`badge ${pr.status === "Paid" ? "badge-paid" : pr.status === "Validated" ? "badge-validated" : pr.status === "Computed" ? "badge-computed" : pr.status === "Failed" ? "badge-failed" : "badge-warning"}`}
                      >
                        {pr.status}
                      </span>
                    </div>
                  </div>
                ))}

              {payruns.length === 0 && (
                <div
                  style={{
                    padding: "24px 12px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  No payroll batches created yet. Click "+ New Payrun (Wizard)"
                  to create your first batch.
                </div>
              )}
            </div>
          </div>

          {/* Payrun Processing Workspace */}
          {selectedPayrun ? (
            <div
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Header & State Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={() => setSelectedPayrun(null)}
                      className="btn btn-secondary"
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Return to Payruns List"
                    >
                      ← Back to List
                    </button>
                    <h2
                      style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}
                    >
                      {selectedPayrun.name}
                    </h2>
                    <span
                      className={`badge ${selectedPayrun.status === "Paid" ? "badge-paid" : selectedPayrun.status === "Validated" ? "badge-validated" : selectedPayrun.status === "Computed" ? "badge-computed" : selectedPayrun.status === "Failed" ? "badge-failed" : "badge-warning"}`}
                    >
                      {selectedPayrun.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    Structure:{" "}
                    <strong>{selectedPayrun.salary_structure_name}</strong> |
                    Period: {formatDate(selectedPayrun.period_start)} –{" "}
                    {formatDate(selectedPayrun.period_end)} (
                    {selectedPayrun.payslips?.length || 0} Employees)
                  </div>
                </div>

                {/* Pipeline Status Indicator (Draft -> Computed -> Validated -> Paid) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "var(--surface)",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {["Draft", "Computed", "Validated", "Paid"].map((st, idx) => {
                    const statusOrder = {
                      Draft: 1,
                      Computing: 2,
                      Computed: 2,
                      Validated: 3,
                      Paid: 4,
                    };
                    const currentOrder =
                      statusOrder[selectedPayrun.status] || 1;
                    const thisOrder = statusOrder[st] || 1;
                    const isActive = currentOrder >= thisOrder;
                    const isCurrent = selectedPayrun.status === st;

                    return (
                      <React.Fragment key={st}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "14px",
                            fontSize: "11px",
                            fontWeight: "700",
                            backgroundColor: isCurrent
                              ? "var(--primary)"
                              : isActive
                                ? "rgba(179, 207, 229, 0.25)"
                                : "transparent",
                            color: isCurrent
                              ? "#0A1931"
                              : isActive
                                ? "var(--secondary-navy)"
                                : "var(--text-muted)",
                          }}
                        >
                          <span
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              backgroundColor: isCurrent
                                ? "#0A1931"
                                : isActive
                                  ? "var(--secondary-blue)"
                                  : "var(--border-color)",
                              color: "#FFFFFF",
                              fontSize: "9px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {idx + 1}
                          </span>
                          {st}
                        </div>
                        {idx < 3 && (
                          <div
                            style={{
                              width: "12px",
                              height: "2px",
                              backgroundColor: isActive
                                ? "var(--secondary-blue)"
                                : "var(--border-color)",
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* State Machine Action Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={handleCompute}
                    disabled={actionLoading || selectedPayrun.status === "Paid"}
                    className={`btn ${selectedPayrun.status === "Draft" || selectedPayrun.status === "Failed" ? "btn-primary" : "btn-navy"}`}
                    title={selectedPayrun.status === "Paid" ? "Payrun is already finalized and paid" : "Compute salary rules"}
                  >
                    <Calculator size={15} /> {selectedPayrun.status === "Computed" || selectedPayrun.status === "Validated" ? "Re-Compute" : "Compute"}
                  </button>
                  <button
                    onClick={handleValidate}
                    disabled={actionLoading || selectedPayrun.status === "Draft" || selectedPayrun.status === "Failed" || selectedPayrun.status === "Paid"}
                    className={`btn ${selectedPayrun.status === "Computed" ? "btn-primary" : "btn-secondary"}`}
                    title={selectedPayrun.status === "Draft" || selectedPayrun.status === "Failed" ? "Please compute payroll first before validating" : "Validate payrun"}
                  >
                    <CheckCircle2 size={15} /> Validate
                  </button>
                  <button
                    onClick={handleMarkPaid}
                    disabled={actionLoading || selectedPayrun.status === "Draft" || selectedPayrun.status === "Failed" || selectedPayrun.status === "Paid"}
                    className={`btn ${selectedPayrun.status === "Validated" ? "btn-primary" : "btn-secondary"}`}
                    title={selectedPayrun.status === "Draft" || selectedPayrun.status === "Failed" ? "Please compute & validate payroll first" : "Mark as Paid"}
                  >
                    <DollarSign size={15} /> Mark Paid
                  </button>
                  <button
                    onClick={handleSendBulkEmail}
                    disabled={actionLoading || selectedPayrun.status === "Draft" || selectedPayrun.status === "Failed"}
                    className={`btn ${selectedPayrun.status === "Paid" ? "btn-primary" : "btn-secondary"}`}
                    title={selectedPayrun.status === "Draft" || selectedPayrun.status === "Failed" ? "Please compute payroll before sending payslips" : "Send payslips via email"}
                  >
                    <Mail size={15} /> Send Payslips
                  </button>
                </div>
              </div>

              {/* Payrun Failure Banner */}
              {selectedPayrun.status === "Failed" && (
                <div
                  style={{
                    padding: "16px 20px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(225, 29, 72, 0.1)",
                    border: "1px solid rgba(225, 29, 72, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <AlertTriangle size={22} color="var(--danger)" />
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "14px",
                          color: "var(--danger)",
                        }}
                      >
                        PAYRUN COMPUTATION FAILED
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "2px",
                          color: "var(--text-main)",
                        }}
                      >
                        {selectedPayrun.failure_reason ||
                          "An error occurred during payroll rule computation. Please fix the structure or employee data and retry."}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCompute}
                    disabled={actionLoading}
                    className="btn btn-navy"
                    style={{ padding: "8px 16px", fontSize: "12px", fontWeight: "600" }}
                  >
                    <Calculator size={15} /> Retry Computation
                  </button>
                </div>
              )}

              {/* Payroll Warnings Section */}
              {selectedPayrun.warnings?.length > 0 && (
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(74, 127, 167, 0.08)",
                    border: "1px solid rgba(74, 127, 167, 0.25)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "var(--text-main)",
                    }}
                  >
                    <AlertTriangle size={16} color="var(--secondary-blue)" />{" "}
                    PAYROLL VALIDATION WARNINGS (
                    {selectedPayrun.warnings.length})
                  </div>
                  <ul
                    style={{
                      margin: "8px 0 0 24px",
                      fontSize: "12px",
                      color: "var(--text-main)",
                      lineHeight: "1.6",
                    }}
                  >
                    {selectedPayrun.warnings.map((w, idx) => (
                      <li key={idx}>{w.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary Numbers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  backgroundColor: "var(--surface)",
                  padding: "12px",
                  borderRadius: "6px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    TOTAL GROSS EXPENDITURE
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "700" }}>
                    ₹{" "}
                    {parseFloat(selectedPayrun.total_gross || 0).toLocaleString(
                      "en-IN",
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    TOTAL NET SALARY PAYABLE
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#10B981",
                    }}
                  >
                    ₹{" "}
                    {parseFloat(selectedPayrun.total_net || 0).toLocaleString(
                      "en-IN",
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    SELECTED EMPLOYEES
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "700" }}>
                    {selectedPayrun.payslips?.length || 0}
                  </div>
                </div>
              </div>

              {/* Payslips Table */}
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    marginBottom: "12px",
                  }}
                >
                  Generated Payslips Breakdown
                </h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Worked Days</th>
                        <th>Gross Earnings</th>
                        <th>Deductions</th>
                        <th>Net Pay</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayrun.payslips?.map((s, idx) => (
                        <tr
                          key={`pr-payslip-${s.id || idx}-${idx}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleOpenPayslipDetail(s)}
                        >
                          <td style={{ fontWeight: "600" }}>
                            {s.employee_name} ({s.emp_id})
                          </td>
                          <td>{s.worked_days} days</td>
                          <td>
                            ₹{" "}
                            {parseFloat(s.gross_amount).toLocaleString("en-IN")}
                          </td>
                          <td style={{ color: "var(--danger)" }}>
                            - ₹{" "}
                            {parseFloat(s.deduction_amount).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td style={{ fontWeight: "700", color: "#10B981" }}>
                            ₹ {parseFloat(s.net_amount).toLocaleString("en-IN")}
                          </td>
                          <td>
                            <span className="badge badge-active">
                              {s.status}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) =>
                                handleDownloadPDF(s.id, s.employee_name, e)
                              }
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              title="Download PDF Payslip"
                            >
                              <Download size={12} /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <Receipt size={44} color="var(--secondary-blue)" />
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "var(--text-main)",
                }}
              >
                No Payroll Batch Selected
              </h3>
              <p style={{ fontSize: "13px", maxWidth: "400px" }}>
                Select an existing batch from the left list or create a new
                batch using the Payrun Wizard.
              </p>
              <button
                onClick={() => {
                  setWizardStep(1);
                  setShowWizard(true);
                }}
                className="btn btn-primary"
                style={{ marginTop: "8px" }}
              >
                <Plus size={16} /> New Payrun (Wizard)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payslip Detail Modal with Itemized Salary Computation Table */}
      {selectedPayslip && (
        <div className="modal-overlay" onClick={() => setSelectedPayslip(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "680px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                Payslip Detail ({selectedPayslip.employee_name})
              </h3>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="btn btn-secondary"
              >
                ✕
              </button>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  backgroundColor: "var(--surface)",
                  padding: "16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              >
                <div>
                  <strong>Employee:</strong> {selectedPayslip.employee_name} (
                  {selectedPayslip.emp_id})
                </div>
                <div>
                  <strong>Period:</strong>{" "}
                  {formatDate(selectedPayslip.period_start)} –{" "}
                  {formatDate(selectedPayslip.period_end)}
                </div>
                <div>
                  <strong>Worked Days:</strong> {selectedPayslip.worked_days}{" "}
                  days
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span className="badge badge-active">
                    {selectedPayslip.status}
                  </span>
                </div>
                <div>
                  <strong>Gross Earnings:</strong> ₹{" "}
                  {parseFloat(selectedPayslip.gross_amount || 0).toLocaleString(
                    "en-IN",
                  )}
                </div>
                <div>
                  <strong>Total Deductions:</strong> - ₹{" "}
                  {parseFloat(
                    selectedPayslip.deduction_amount || 0,
                  ).toLocaleString("en-IN")}
                </div>
                <div
                  style={{
                    gridColumn: "span 2",
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#10B981",
                  }}
                >
                  Net Salary Payable: ₹{" "}
                  {parseFloat(selectedPayslip.net_amount || 0).toLocaleString(
                    "en-IN",
                  )}
                </div>
              </div>

              {/* Itemized Salary Computation Table */}
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    marginBottom: "8px",
                    color: "var(--deep-navy)",
                  }}
                >
                  Salary Computation Breakdown (Ordered Rules)
                </h4>
                {loadingLines ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Loading computation breakdown...
                  </div>
                ) : payslipDetailData?.lines?.length > 0 ? (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rule Name</th>
                          <th>Code</th>
                          <th>Category</th>
                          <th style={{ textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(payslipDetailData.lines || []).map((line, idx) => (
                          <tr key={`line-${line.id || idx}-${idx}`}>
                            <td style={{ fontWeight: "600" }}>
                              {line.rule_name}
                            </td>
                            <td>
                              <code>{line.rule_code}</code>
                            </td>
                            <td>
                              <span
                                className={`badge ${line.category === "gross" || line.category === "basic" || line.category === "allowance" ? "badge-active" : line.category === "deduction" ? "badge-warning" : "badge-paid"}`}
                              >
                                {line.category}
                              </span>
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                fontWeight: "700",
                                color:
                                  line.category === "deduction"
                                    ? "#E11D48"
                                    : line.category === "net"
                                      ? "#10B981"
                                      : "var(--text-main)",
                              }}
                            >
                              {line.category === "deduction"
                                ? `- ₹ ${parseFloat(line.amount).toLocaleString("en-IN")}`
                                : `₹ ${parseFloat(line.amount).toLocaleString("en-IN")}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--surface)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    Click "Compute" on the payrun batch to calculate itemized
                    salary rule breakdown.
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  onClick={(e) =>
                    handleDownloadPDF(
                      selectedPayslip.id,
                      selectedPayslip.employee_name,
                      e,
                    )
                  }
                  className="btn btn-primary"
                >
                  <Download size={15} /> Download PDF Payslip
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TWO-STEP PAYRUN WIZARD MODAL */}
      {showWizard && (
        <div className="modal-overlay" onClick={() => setShowWizard(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "650px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                Payrun Wizard — Step {wizardStep} of 2 (
                {wizardStep === 1 ? "Scope & Period" : "Employee Selection"})
              </h3>
              <button
                onClick={() => setShowWizard(false)}
                className="btn btn-secondary"
              >
                ✕
              </button>
            </div>

            <div key={wizardStep} className="wizard-step-enter">
              {wizardStep === 1 ? (
                <form onSubmit={handleWizardContinue}>
                  <div className="form-group">
                    <label className="form-label">Payrun Name</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={step1Data.name}
                      onChange={(e) =>
                        setStep1Data({ ...step1Data, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Salary Structure</label>
                    <select
                      className="form-select"
                      value={step1Data.salary_structure_id}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          salary_structure_id: e.target.value,
                        })
                      }
                    >
                      {structures.map((s, idx) => (
                        <option
                          key={`pr-struct-${s.id || idx}-${idx}`}
                          value={s.id}
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label">Period Start</label>
                      <input
                        type="date"
                        required
                        className="form-input"
                        value={step1Data.period_start}
                        onChange={(e) =>
                          setStep1Data({
                            ...step1Data,
                            period_start: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Period End</label>
                      <input
                        type="date"
                        required
                        className="form-input"
                        value={step1Data.period_end}
                        onChange={(e) =>
                          setStep1Data({
                            ...step1Data,
                            period_end: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "12px",
                      marginTop: "20px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowWizard(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Continue to Step 2 <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      Select eligible employees to include in this payroll batch
                      ({step1Data.name}):
                    </p>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--secondary-blue)",
                      }}
                    >
                      {selectedEmpIds.length} / {eligibleEmployees.length}{" "}
                      Selected
                    </span>
                  </div>

                  {/* Search and Select All header */}
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search employee by name, ID, position..."
                      value={empFilterSearch}
                      onChange={(e) => setEmpFilterSearch(e.target.value)}
                      style={{ fontSize: "12px", flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      onClick={() => {
                        if (
                          selectedEmpIds.length === eligibleEmployees.length
                        ) {
                          setSelectedEmpIds([]);
                        } else {
                          setSelectedEmpIds(eligibleEmployees.map((e) => e.id));
                        }
                      }}
                    >
                      {selectedEmpIds.length === eligibleEmployees.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>

                  <div
                    style={{
                      maxHeight: "250px",
                      overflowY: "auto",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                    }}
                  >
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: "40px" }}>
                            <input
                              type="checkbox"
                              checked={
                                selectedEmpIds.length > 0 &&
                                selectedEmpIds.length ===
                                  eligibleEmployees.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmpIds(
                                    eligibleEmployees.map((emp) => emp.id),
                                  );
                                } else {
                                  setSelectedEmpIds([]);
                                }
                              }}
                            />
                          </th>
                          <th>Employee</th>
                          <th>Job Position</th>
                          <th>Contract</th>
                          <th style={{ textAlign: "right" }}>Wage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eligibleEmployees
                          .filter((emp) => {
                            if (!empFilterSearch) return true;
                            const term = empFilterSearch.toLowerCase();
                            const fullName =
                              `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
                            return (
                              fullName.includes(term) ||
                              (emp.emp_id &&
                                emp.emp_id.toLowerCase().includes(term)) ||
                              (emp.job_position &&
                                emp.job_position.toLowerCase().includes(term))
                            );
                          })
                          .map((emp, idx) => {
                            const isChecked = selectedEmpIds.includes(emp.id);
                            return (
                              <tr
                                key={`pr-el-emp-${emp.id || idx}-${idx}`}
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedEmpIds(
                                      selectedEmpIds.filter(
                                        (id) => id !== emp.id,
                                      ),
                                    );
                                  } else {
                                    setSelectedEmpIds([
                                      ...selectedEmpIds,
                                      emp.id,
                                    ]);
                                  }
                                }}
                                style={{ cursor: "pointer" }}
                              >
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (e.target.checked) {
                                        setSelectedEmpIds([
                                          ...selectedEmpIds,
                                          emp.id,
                                        ]);
                                      } else {
                                        setSelectedEmpIds(
                                          selectedEmpIds.filter(
                                            (id) => id !== emp.id,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                </td>
                                <td style={{ fontWeight: "600" }}>
                                  {emp.first_name} {emp.last_name}{" "}
                                  <code>({emp.emp_id})</code>
                                </td>
                                <td>{emp.job_position || "Employee"}</td>
                                <td>
                                  {emp.contract_id ? (
                                    <span className="badge badge-approved">
                                      Applicable
                                    </span>
                                  ) : (
                                    <span className="badge badge-warning">
                                      Missing contract
                                    </span>
                                  )}
                                </td>
                                <td
                                  style={{
                                    textAlign: "right",
                                    fontWeight: "700",
                                    color: "var(--text-main)",
                                  }}
                                >
                                  ₹{" "}
                                  {parseFloat(emp.wage || 0).toLocaleString(
                                    "en-IN",
                                  )}
                                  /mo
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "20px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="btn btn-secondary"
                    >
                      Back to Step 1
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalCreatePayrun}
                      className="btn btn-primary"
                    >
                      <UserCheck size={16} /> Create Payrun Batch (
                      {selectedEmpIds.length} Selected)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmConfig && (
        <ConfirmDialog
          open={Boolean(confirmConfig)}
          onClose={() => setConfirmConfig(null)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmText={confirmConfig.confirmText}
          variant={confirmConfig.variant || "primary"}
        />
      )}
    </div>
  );
}
