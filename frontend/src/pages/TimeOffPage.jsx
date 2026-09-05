import React, { useState, useEffect } from "react";
import api from "../api/client";
import { subscribeCache } from "../api/cache";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { CenteredSpinner } from "../components/ui/Loading";
import { formatDate } from "../utils/dateUtils";
import { useAuth } from "../context/AuthContext";
import {
  WalletCards,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";

export default function TimeOffPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState("requests"); // 'requests' | 'allocations' | 'types'
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Forms
  const [requestForm, setRequestForm] = useState({
    employee_id: "",
    time_off_type_id: "1",
    start_date: "2026-09-10",
    end_date: "2026-09-11",
    duration: 2,
    reason: "Personal work",
  });
  const [allocForm, setAllocForm] = useState({
    employee_id: "1",
    time_off_type_id: "1",
    allocated_days: 12,
    validity_start: "2026-01-01",
    validity_end: "2026-12-31",
  });
  const [typeForm, setTypeForm] = useState({
    name: "",
    unit: "days",
    requires_allocation: true,
    approval_workflow: "hr_manager",
  });

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [reqRes, allocRes, typeRes, empRes] = await Promise.all([
        api.getFetch("/time-off/requests"),
        api.getFetch("/time-off/allocations"),
        api.getFetch("/time-off/types"),
        api.getFetch("/employees"),
      ]);
      setRequests(reqRes.data || []);
      setAllocations(allocRes.data || []);
      setTypes(typeRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = subscribeCache(() => {
      fetchData(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.employee_id) {
      setRequestForm((prev) => ({
        ...prev,
        employee_id: String(user.employee_id),
      }));
    }
  }, [user?.employee_id]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (user?.role === "employee" && !user.employee_id) {
      toast.error(
        "Link Mr Robot to an employee profile before requesting time off.",
      );
      return;
    }
    const duration = Number(requestForm.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error("Enter a valid time off duration greater than zero.");
      return;
    }
    try {
      await api.post("/time-off/requests", { ...requestForm, duration });
      api.invalidate(["time-off", "dashboard"]);
      setShowRequestModal(false);
      toast.success("Time Off Request submitted successfully.");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to submit time off request.");
    }
  };

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    const allocatedDays = Number(allocForm.allocated_days);
    if (!Number.isFinite(allocatedDays) || allocatedDays <= 0) {
      toast.error("Enter a valid allocation greater than zero.");
      return;
    }
    try {
      await api.post("/time-off/allocations", {
        ...allocForm,
        allocated_days: allocatedDays,
      });
      api.invalidate(["time-off", "dashboard"]);
      setShowAllocModal(false);
      toast.success("Leave Allocation created successfully.");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to create allocation.");
    }
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    try {
      if (selectedType) {
        await api.put(`/time-off/types/${selectedType.id}`, typeForm);
        toast.success("Time Off Type updated.");
      } else {
        await api.post("/time-off/types", typeForm);
        toast.success("Time Off Type created.");
      }
      api.invalidate(["time-off"]);
      setShowTypeModal(false);
      setSelectedType(null);
      setTypeForm({
        name: "",
        unit: "days",
        requires_allocation: true,
        approval_workflow: "hr_manager",
      });
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to save time off type.");
    }
  };

  const handleDeleteType = (t) => {
    setConfirmConfig({
      title: "Delete Time Off Type",
      description: `Are you sure you want to delete "${t.name}"? This action cannot be undone.`,
      confirmText: "Delete Type",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/time-off/types/${t.id}`);
          api.invalidate(["time-off"]);
          toast.info("Time off type deleted.");
          fetchData();
        } catch (err) {
          toast.error(err.message || "Failed to delete type.");
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleApprove = (id) => {
    setConfirmConfig({
      title: "Approve Leave Request",
      description:
        "Are you sure you want to approve this leave request? This will deduct the days from the leave allocation balance.",
      confirmText: "Approve",
      onConfirm: async () => {
        try {
          await api.put(`/time-off/requests/${id}/approve`);
          api.invalidate(["time-off", "dashboard"]);
          toast.success("Request Approved! Leave allocation balance updated.");
          setSelectedRequest(null);
          fetchData();
        } catch (err) {
          toast.error(err.message || "Failed to approve request.");
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleDeleteRequest = (reqId, e) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Leave Request",
      message:
        "Are you sure you want to delete this leave request? This action cannot be undone.",
      confirmText: "Delete Request",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/time-off/requests/${reqId}`);
          api.invalidate(["time-off", "dashboard"]);
          toast.info("Leave request deleted.");
          if (selectedRequest?.id === reqId) setSelectedRequest(null);
          fetchData();
        } catch (err) {
          toast.error(err.message || "Failed to delete request.");
        } finally {
          setConfirmConfig(null);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const handleDeleteAllocation = (allocId, e) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Leave Allocation",
      message:
        "Are you sure you want to delete this leave allocation? This action cannot be undone.",
      confirmText: "Delete Allocation",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/time-off/allocations/${allocId}`);
          api.invalidate(["time-off", "dashboard"]);
          toast.info("Leave allocation deleted.");
          fetchData();
        } catch (err) {
          toast.error(err.message || "Failed to delete allocation.");
        } finally {
          setConfirmConfig(null);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const handleRefuse = (id) => {
    setConfirmConfig({
      title: "Reject Leave Request",
      description: "Are you sure you want to reject/refuse this leave request?",
      confirmText: "Reject",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/time-off/requests/${id}/refuse`);
          api.invalidate(["time-off", "dashboard"]);
          toast.info("Request Refused.");
          setSelectedRequest(null);
          fetchData();
        } catch (err) {
          toast.error(err.message || "Failed to refuse request.");
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const canApproveLeave = [
    "hr_manager",
    "hr_payroll_user",
    "hr_payroll_manager",
    "admin",
  ].includes(user?.role || "");
  const canManageLeave = [
    "hr_manager",
    "hr_payroll_user",
    "hr_payroll_manager",
    "admin",
  ].includes(user?.role || "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700" }}>
            Time Off & Leave Management
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Leave policies, allocations, & approval balance workflow
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {activeSubTab === "types" && canManageLeave && (
            <button
              onClick={() => {
                setSelectedType(null);
                setTypeForm({
                  name: "",
                  unit: "days",
                  requires_allocation: true,
                  approval_workflow: "hr_manager",
                });
                setShowTypeModal(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} /> New Leave Type
            </button>
          )}

          {activeSubTab === "allocations" && canManageLeave && (
            <button
              onClick={() => setShowAllocModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Grant Allocation
            </button>
          )}

          {activeSubTab === "requests" && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Request Time Off
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "8px",
        }}
      >
        <button
          onClick={() => setActiveSubTab("requests")}
          className={`btn ${activeSubTab === "requests" ? "btn-primary" : "btn-secondary"}`}
        >
          Time Off Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveSubTab("allocations")}
          className={`btn ${activeSubTab === "allocations" ? "btn-primary" : "btn-secondary"}`}
        >
          Leave Allocations ({allocations.length})
        </button>
        <button
          onClick={() => setActiveSubTab("types")}
          className={`btn ${activeSubTab === "types" ? "btn-primary" : "btn-secondary"}`}
        >
          Time Off Types ({types.length})
        </button>
      </div>

      {loading ? (
        <CenteredSpinner />
      ) : activeSubTab === "requests" ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, idx) => (
                <tr
                  key={`to-req-${r.id || idx}-${idx}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedRequest(r)}
                >
                  <td style={{ fontWeight: "600" }}>
                    {r.employee_name} ({r.emp_id})
                  </td>
                  <td>{r.type_name}</td>
                  <td>{formatDate(r.start_date)}</td>
                  <td>{formatDate(r.end_date)}</td>
                  <td style={{ fontWeight: "700" }}>
                    {r.duration} {r.unit || "days"}
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {r.reason || "N/A"}
                  </td>
                  <td>
                    <span
                      className={`badge ${r.status === "Approved" ? "badge-approved" : r.status === "Refused" ? "badge-danger" : "badge-pending"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    {r.status === "Pending" && canApproveLeave ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="btn btn-primary"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handleRefuse(r.id)}
                          className="btn btn-danger"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          <XCircle size={13} /> Refuse
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedRequest(r)}
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                      >
                        View Detail
                      </button>
                    )}
                    {(canManageLeave ||
                      (user?.employee_id &&
                        String(user.employee_id) === String(r.employee_id) &&
                        r.status === "Pending")) && (
                      <button
                        onClick={(e) => handleDeleteRequest(r.id, e)}
                        className="btn btn-secondary"
                        title="Delete Request"
                        style={{ padding: "4px 6px", color: "var(--danger)" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeSubTab === "allocations" ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Allocated</th>
                <th>Taken</th>
                <th>Remaining Balance</th>
                <th>Validity Range</th>
                <th>Status</th>
                {canManageLeave && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {allocations.map((a, idx) => (
                <tr key={`to-alloc-${a.id || idx}-${idx}`}>
                  <td style={{ fontWeight: "600" }}>
                    {a.employee_name} ({a.emp_id})
                  </td>
                  <td>{a.type_name}</td>
                  <td>
                    {a.allocated_days} {a.unit}
                  </td>
                  <td style={{ color: "var(--warning)", fontWeight: "600" }}>
                    {a.taken_days} {a.unit}
                  </td>
                  <td
                    style={{
                      color: "#10B981",
                      fontWeight: "700",
                      fontSize: "14px",
                    }}
                  >
                    {a.remaining_days} {a.unit}
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {formatDate(a.validity_start)} to{" "}
                    {formatDate(a.validity_end)}
                  </td>
                  <td>
                    <span className="badge badge-approved">{a.status}</span>
                  </td>
                  {canManageLeave && (
                    <td>
                      <button
                        onClick={(e) => handleDeleteAllocation(a.id, e)}
                        className="btn btn-secondary"
                        title="Delete Allocation"
                        style={{ padding: "4px 6px", color: "var(--danger)" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {types.map((t, idx) => (
            <div
              key={`to-type-${t.id || idx}-${idx}`}
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "700" }}>
                  {t.name}
                </h3>
                {canManageLeave && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => {
                        setSelectedType(t);
                        setTypeForm({
                          name: t.name,
                          unit: t.unit || "days",
                          requires_allocation: t.requires_allocation,
                          approval_workflow:
                            t.approval_workflow || "hr_manager",
                        });
                        setShowTypeModal(true);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: "4px 6px" }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteType(t)}
                      className="btn btn-danger"
                      style={{ padding: "4px 6px" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Unit: <strong>{t.unit}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Requires Allocation:{" "}
                <strong>{t.requires_allocation ? "Yes" : "No"}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Approval Workflow: <strong>{t.approval_workflow}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Time Off Detail Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Time Off Request Detail</h3>
              <button
                onClick={() => setSelectedRequest(null)}
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
                  <strong>Employee:</strong> {selectedRequest.employee_name} (
                  {selectedRequest.emp_id})
                </div>
                <div>
                  <strong>Leave Type:</strong> {selectedRequest.type_name}
                </div>
                <div>
                  <strong>Start Date:</strong>{" "}
                  {formatDate(selectedRequest.start_date)}
                </div>
                <div>
                  <strong>End Date:</strong>{" "}
                  {formatDate(selectedRequest.end_date)}
                </div>
                <div>
                  <strong>Duration:</strong> {selectedRequest.duration}{" "}
                  {selectedRequest.unit || "days"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`badge ${selectedRequest.status === "Approved" ? "badge-approved" : selectedRequest.status === "Refused" ? "badge-danger" : "badge-pending"}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <strong>Reason:</strong>{" "}
                  {selectedRequest.reason || "None specified"}
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <strong>Processed By:</strong>{" "}
                  {selectedRequest.approved_by || "Pending Manager Action"}
                </div>
              </div>

              {selectedRequest.status === "Pending" && canApproveLeave && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="btn btn-primary"
                  >
                    <CheckCircle size={15} /> Approve Request
                  </button>
                  <button
                    onClick={() => handleRefuse(selectedRequest.id)}
                    className="btn btn-danger"
                  >
                    <XCircle size={15} /> Refuse Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showRequestModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRequestModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Request Time Off</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="btn btn-secondary"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={requestForm.employee_id}
                  disabled={user?.role === "employee"}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      employee_id: e.target.value,
                    })
                  }
                >
                  {employees.map((emp, idx) => (
                    <option
                      key={`to-req-emp-${emp.id || idx}-${idx}`}
                      value={emp.id}
                    >
                      {emp.first_name} {emp.last_name} ({emp.emp_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Time Off Type</label>
                <select
                  className="form-select"
                  value={requestForm.time_off_type_id}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      time_off_type_id: e.target.value,
                    })
                  }
                >
                  {types.map((t, idx) => (
                    <option
                      key={`to-req-type-${t.id || idx}-${idx}`}
                      value={t.id}
                    >
                      {t.name} ({t.unit})
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
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={requestForm.start_date}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={requestForm.end_date}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        end_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Duration (Days / Hours)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  className="form-input"
                  value={requestForm.duration}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      duration:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={requestForm.reason}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, reason: e.target.value })
                  }
                />
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
                  onClick={() => setShowRequestModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Allocation Modal */}
      {showAllocModal && (
        <div className="modal-overlay" onClick={() => setShowAllocModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Grant Leave Allocation</h3>
              <button
                onClick={() => setShowAllocModal(false)}
                className="btn btn-secondary"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAllocation}>
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={allocForm.employee_id}
                  onChange={(e) =>
                    setAllocForm({ ...allocForm, employee_id: e.target.value })
                  }
                >
                  {employees.map((emp, idx) => (
                    <option
                      key={`to-alloc-emp-${emp.id || idx}-${idx}`}
                      value={emp.id}
                    >
                      {emp.first_name} {emp.last_name} ({emp.emp_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Time Off Type</label>
                <select
                  className="form-select"
                  value={allocForm.time_off_type_id}
                  onChange={(e) =>
                    setAllocForm({
                      ...allocForm,
                      time_off_type_id: e.target.value,
                    })
                  }
                >
                  {types.map((t, idx) => (
                    <option
                      key={`to-alloc-type-${t.id || idx}-${idx}`}
                      value={t.id}
                    >
                      {t.name} ({t.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Allocated Days / Hours</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  className="form-input"
                  value={allocForm.allocated_days}
                  onChange={(e) =>
                    setAllocForm({
                      ...allocForm,
                      allocated_days:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Validity Start Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={allocForm.validity_start}
                    onChange={(e) =>
                      setAllocForm({
                        ...allocForm,
                        validity_start: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Validity End Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={allocForm.validity_end}
                    onChange={(e) =>
                      setAllocForm({
                        ...allocForm,
                        validity_end: e.target.value,
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
                  onClick={() => setShowAllocModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Grant Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Time Off Type Modal */}
      {showTypeModal && (
        <div className="modal-overlay" onClick={() => setShowTypeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedType ? "Edit Time Off Type" : "New Time Off Type"}
              </h3>
              <button
                onClick={() => setShowTypeModal(false)}
                className="btn btn-secondary"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveType}>
              <div className="form-group">
                <label className="form-label">Type Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Vacation"
                  className="form-input"
                  value={typeForm.name}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, name: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit of Measure</label>
                <select
                  className="form-select"
                  value={typeForm.unit}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, unit: e.target.value })
                  }
                >
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                </select>
              </div>

              <div
                className="form-group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <input
                  type="checkbox"
                  id="req_alloc"
                  checked={typeForm.requires_allocation}
                  onChange={(e) =>
                    setTypeForm({
                      ...typeForm,
                      requires_allocation: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="req_alloc"
                  style={{ fontSize: "13px", cursor: "pointer" }}
                >
                  Requires Prior Allocation / Balance
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Approval Workflow</label>
                <select
                  className="form-select"
                  value={typeForm.approval_workflow}
                  onChange={(e) =>
                    setTypeForm({
                      ...typeForm,
                      approval_workflow: e.target.value,
                    })
                  }
                >
                  <option value="hr_manager">HR Manager Approval</option>
                  <option value="manager_then_hr">
                    Direct Manager then HR
                  </option>
                  <option value="auto_approved">Auto-Approved</option>
                </select>
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
                  onClick={() => setShowTypeModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedType ? "Save Changes" : "Create Type"}
                </button>
              </div>
            </form>
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
