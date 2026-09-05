import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api/client";
import { formatDate, formatTime } from "../../utils/dateUtils";
import { getSocket } from "../../utils/socket";
import ConfirmDialog from "../ui/ConfirmDialog";
import faviconImg from "../../assets/favicon.jpeg";
import logoImg from "../../assets/logo..jpeg";
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Clock,
  WalletCards,
  Receipt,
  Sliders,
  Settings,
  Sun,
  Moon,
  Search,
  Bell,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  LogOut,
  FileSpreadsheet,
  Check,
  CheckCheck,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Shell({ activeTab, setActiveTab, children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAttendanceWidget, setShowAttendanceWidget] = useState(false);
  const [userAttendance, setUserAttendance] = useState(null);
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [nowTime, setNowTime] = useState(new Date());
  const notifRef = useRef(null);

  // Authoritative role from backend session
  const currentRole = user?.role || "admin";

  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const res = await api.getFetch("/attendance", { useCache: false });
      if (res?.data) {
        const empId = user?.employee_id;
        if (!empId) {
          setUserAttendance(null);
          return;
        }
        const todayFormatted = formatDate(new Date());
        const found = res.data.find((a) => {
          const isUserMatch = String(a.employee_id) === String(empId);
          const aDateFormatted = a.check_in
            ? formatDate(a.check_in)
            : formatDate(a.date);
          return isUserMatch && aDateFormatted === todayFormatted;
        });
        setUserAttendance(found || null);
        return found || null;
      }
    } catch (err) {
      // Quiet background fetch
    }
    return null;
  };

  useEffect(() => {
    fetchTodayAttendance();
    const interval = setInterval(fetchTodayAttendance, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Real-time socket listener for attendance updates
  useEffect(() => {
    const token = localStorage.getItem("pp360_token");
    const socket = getSocket(token);
    if (!socket) return;

    const handleAttendanceUpdate = () => {
      fetchTodayAttendance();
    };

    socket.on("ATTENDANCE_UPDATED", handleAttendanceUpdate);
    return () => {
      socket.off("ATTENDANCE_UPDATED", handleAttendanceUpdate);
    };
  }, []);

  const formatHoursToHMM = (hoursNum) => {
    if (!hoursNum || isNaN(hoursNum)) return "0h00";
    const totalMins = Math.round(hoursNum * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h${m < 10 ? "0" : ""}${m}`;
  };

  const getElapsedTimeStr = () => {
    if (!userAttendance?.check_in) return "0h00";
    if (userAttendance?.check_out) {
      return formatHoursToHMM(parseFloat(userAttendance.worked_hours || 0));
    }
    const checkInDate = new Date(userAttendance.check_in);
    if (isNaN(checkInDate.getTime())) return "0h00";
    const diffMs = Math.max(0, nowTime - checkInDate);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${mins < 10 ? "0" : ""}${mins}`;
  };

  const getCheckInTimeStr = () => {
    if (!userAttendance?.check_in) return "Not Checked In";
    return formatTime(userAttendance.check_in);
  };

  const getTodayWorkedHoursStr = () => {
    if (!userAttendance) return "0h00";
    if (userAttendance.check_out) {
      return formatHoursToHMM(parseFloat(userAttendance.worked_hours || 0));
    }
    if (userAttendance.check_in) {
      return getElapsedTimeStr();
    }
    return "0h00";
  };

  const handleWidgetCheckIn = async () => {
    if (widgetLoading) return;
    if (userAttendance?.check_in && !userAttendance?.check_out) {
      toast.warning("You are already checked in.");
      return;
    }
    if (userAttendance?.check_out) {
      toast.warning("You have already completed attendance for today.");
      return;
    }

    try {
      setWidgetLoading(true);
      const res = await api.post("/attendance/check-in", {
        employee_id: user?.employee_id,
      });
      if (res?.data) {
        setUserAttendance(res.data);
      }
      toast.success("Check In successful!");
      api.invalidate(["attendance", "dashboard"]);
      await fetchTodayAttendance();
    } catch (err) {
      toast.error(err.message || "Check In failed.");
    } finally {
      setWidgetLoading(false);
    }
  };

  const handleWidgetCheckOut = async () => {
    if (widgetLoading) return;
    if (!userAttendance?.check_in) {
      toast.error("You must Check In before Check Out.");
      return;
    }
    if (userAttendance?.check_out) {
      toast.warning("Already checked out for today.");
      return;
    }

    try {
      setWidgetLoading(true);
      const latestAttendance = await fetchTodayAttendance();
      if (!latestAttendance?.check_in || latestAttendance?.check_out) {
        toast.error(
          "No active Check In found for today. Please Check In first.",
        );
        return;
      }
      const res = await api.post("/attendance/check-out", {
        employee_id: user?.employee_id,
      });
      if (res?.data) {
        setUserAttendance(res.data);
      }
      toast.success("Check Out successful!");
      api.invalidate(["attendance", "dashboard"]);
      await fetchTodayAttendance();
    } catch (err) {
      toast.error(err.message || "Check Out failed.");
    } finally {
      setWidgetLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.getFetch("/notifications");
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      // Quiet background fetch
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, linkTab, e) => {
    if (e) e.stopPropagation();
    try {
      // Instant Optimistic UI Update (0ms delay)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
      if (linkTab && linkTab !== activeTab) {
        setActiveTab(linkTab);
        setShowNotifDropdown(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Instant Optimistic UI Update (0ms delay)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await api.put("/notifications/read-all");
      fetchNotifications();
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: [
        "employee",
        "hr_manager",
        "hr_payroll_user",
        "hr_payroll_manager",
        "admin",
      ],
    },
    {
      id: "employees",
      label: "Employees",
      icon: Users,
      roles: ["hr_manager", "hr_payroll_user", "hr_payroll_manager", "admin"],
    },
    {
      id: "contracts",
      label: "Contracts",
      icon: FileText,
      roles: ["hr_manager", "hr_payroll_user", "hr_payroll_manager", "admin"],
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: Clock,
      roles: [
        "employee",
        "hr_manager",
        "hr_payroll_user",
        "hr_payroll_manager",
        "admin",
      ],
    },
    {
      id: "time-off",
      label: "Time Off",
      icon: WalletCards,
      roles: [
        "employee",
        "hr_manager",
        "hr_payroll_user",
        "hr_payroll_manager",
        "admin",
      ],
    },
    {
      id: "payroll",
      label: "Payruns",
      icon: Receipt,
      roles: ["hr_payroll_user", "hr_payroll_manager", "admin"],
    },
    {
      id: "structures",
      label: "Salary Structures",
      icon: Sliders,
      roles: ["hr_payroll_user", "hr_payroll_manager", "admin"],
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileSpreadsheet,
      roles: ["hr_manager", "hr_payroll_user", "hr_payroll_manager", "admin"],
    },
    {
      id: "settings",
      label: "Settings & Users",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const visibleNav = navItems.filter(
    (item) => currentRole === "admin" || item.roles.includes(currentRole),
  );

  const handleConfirmLogout = () => {
    logout();
    toast.info("Logged out successfully.");
    setShowLogoutConfirm(false);
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "admin":
        return {
          bg: "rgba(179, 207, 229, 0.18)",
          text: "#B3CFE5",
          border: "rgba(179, 207, 229, 0.35)",
        };
      case "hr_payroll_manager":
        return {
          bg: "rgba(74, 127, 167, 0.2)",
          text: "#7EB0D5",
          border: "rgba(74, 127, 167, 0.4)",
        };
      case "hr_payroll_user":
        return {
          bg: "rgba(16, 185, 129, 0.18)",
          text: "#34D399",
          border: "rgba(16, 185, 129, 0.35)",
        };
      case "hr_manager":
        return {
          bg: "rgba(245, 158, 11, 0.18)",
          text: "#FBBF24",
          border: "rgba(245, 158, 11, 0.35)",
        };
      default:
        return {
          bg: "rgba(179, 207, 229, 0.15)",
          text: "#B3CFE5",
          border: "rgba(179, 207, 229, 0.3)",
        };
    }
  };

  const roleStyle = getRoleBadgeStyle(currentRole);

  // User Initials generator for sidebar avatar
  const firstName = String(user?.first_name || "").trim();
  const lastName = String(user?.last_name || "").trim();
  const userName = String(
    user?.name ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      "Authorized User",
  ).trim();
  const nameParts = userName.split(/\s+/).filter(Boolean);
  const userInitials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : (nameParts[0]?.slice(0, 2) || "AU").toUpperCase();

  const getNotifIcon = (type) => {
    switch (type) {
      case "leave":
        return <WalletCards size={15} color="#3B82F6" />;
      case "payroll":
        return <Receipt size={15} color="#10B981" />;
      case "attendance":
        return <Clock size={15} color="#F59E0B" />;
      case "contract":
        return <FileText size={15} color="#8B5CF6" />;
      default:
        return <Bell size={15} color="var(--primary)" />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Collapsible Sticky Sidebar */}
      <aside
        style={{
          width: isSidebarOpen ? "240px" : "68px",
          transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          backgroundColor: "#0A1931",
          color: "#F6FAFD",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Logo & Toggle Header */}
        <div
          style={{
            padding: isSidebarOpen ? "14px 16px" : "14px 8px",
            borderBottom: "1px solid rgba(179, 207, 229, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: isSidebarOpen ? "space-between" : "center",
            height: "60px",
          }}
        >
          {isSidebarOpen ? (
            <>
              <div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#B3CFE5",
                    letterSpacing: "0.5px",
                  }}
                >
                  PeoplePay360
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#4A7FA7",
                    fontWeight: "500",
                  }}
                >
                  HR & Payroll Operations
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#B3CFE5",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Collapse Sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          ) : (
            <img
              src={faviconImg}
              alt="Open Sidebar"
              style={{
                height: "36px",
                width: "36px",
                borderRadius: "6px",
                objectFit: "cover",
                cursor: "pointer",
              }}
              onClick={() => setIsSidebarOpen(true)}
              title="Click to Open Sidebar"
            />
          )}
        </div>

        {/* Navigation list */}
        <nav
          style={{
            padding: "16px 8px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isSidebarOpen ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isSidebarOpen ? "flex-start" : "center",
                  gap: "12px",
                  padding: isSidebarOpen ? "10px 14px" : "10px 0",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: isActive ? "600" : "400",
                  color: isActive ? "#0A1931" : "#B3CFE5",
                  backgroundColor: isActive ? "#B3CFE5" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 150ms ease",
                }}
              >
                <Icon size={18} color={isActive ? "#0A1931" : "#4A7FA7"} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Upgraded Sidebar User & Role UI Card */}
        <div
          style={{
            padding: isSidebarOpen ? "14px 16px" : "12px 6px",
            borderTop: "1px solid rgba(179, 207, 229, 0.12)",
            backgroundColor: "#0F2642",
            display: "flex",
            flexDirection: isSidebarOpen ? "row" : "column",
            alignItems: "center",
            justifyContent: isSidebarOpen ? "space-between" : "center",
            gap: isSidebarOpen ? "10px" : "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isSidebarOpen ? "row" : "column",
              alignItems: "center",
              gap: isSidebarOpen ? "10px" : "4px",
              minWidth: 0,
              width: isSidebarOpen ? "auto" : "100%",
            }}
          >
            {/* User Initials Avatar Circle */}
            <div
              title={
                !isSidebarOpen
                  ? `${userName} (${currentRole.replace(/_/g, " ")})`
                  : undefined
              }
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "rgba(179, 207, 229, 0.15)",
                border: "1px solid rgba(179, 207, 229, 0.3)",
                color: "#B3CFE5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              {userInitials}
            </div>

            {isSidebarOpen && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#F6FAFD",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {userName}
                </div>
                <div
                  style={{
                    display: "inline-block",
                    fontSize: "10px",
                    fontWeight: "600",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    backgroundColor: roleStyle.bg,
                    color: roleStyle.text,
                    border: `1px solid ${roleStyle.border}`,
                    textTransform: "capitalize",
                    marginTop: "2px",
                  }}
                >
                  {currentRole.replace(/_/g, " ")}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#FB7185",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 150ms ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "rgba(225, 29, 72, 0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            title="Log Out of Account"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Fixed Top Header */}
        <header
          style={{
            height: "60px",
            flexShrink: 0,
            backgroundColor: "var(--card-bg)",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "relative",
          }}
        >
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                fontWeight: "500",
              }}
            >
              PeoplePay360 /{" "}
              <span
                style={{
                  color: "var(--text-main)",
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {activeTab.replace("-", " ")}
              </span>
            </div>
          </div>

          {/* Header Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Attendance Quick Action Widget Header Button */}
            {user?.employee_id && (
              <button
                onClick={() => {
                  fetchTodayAttendance();
                  setShowAttendanceWidget(true);
                }}
                className="btn btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "20px",
                  border: "1px solid var(--border-color)",
                  cursor: "pointer",
                }}
                title="Attendance Quick Action Widget"
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor:
                      userAttendance?.check_in && !userAttendance?.check_out
                        ? "#10B981"
                        : "#E11D48",
                    boxShadow:
                      userAttendance?.check_in && !userAttendance?.check_out
                        ? "0 0 6px #10B981"
                        : "none",
                  }}
                />
                <Clock size={15} color="var(--secondary-blue)" />
                <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                  {userAttendance?.check_in && !userAttendance?.check_out
                    ? "Checked In"
                    : "Attendance"}
                </span>
              </button>
            )}

            {/* Notifications Bell Dropdown Container */}
            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`btn btn-secondary ${unreadCount > 0 ? "bell-pulse" : ""}`}
                style={{
                  position: "relative",
                  padding: "8px",
                  borderRadius: "50%",
                }}
                title="Notifications"
              >
                <Bell size={17} color="var(--text-main)" />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      backgroundColor: "#E11D48",
                      color: "#FFFFFF",
                      fontSize: "10px",
                      fontWeight: "700",
                      borderRadius: "10px",
                      minWidth: "16px",
                      height: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      boxShadow: "0 0 0 2px var(--card-bg)",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover List */}
              {showNotifDropdown && (
                <div
                  className="card shadow-lg dropdown-menu-enter"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "46px",
                    width: "350px",
                    maxHeight: "420px",
                    overflowY: "auto",
                    zIndex: 200,
                    padding: 0,
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--card-bg)",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "var(--surface)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Bell size={14} color="var(--secondary-blue)" /> System
                      Notifications ({unreadCount} unread)
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--secondary-blue)",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCheck size={13} /> Read All
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {notifications.length > 0 ? (
                      notifications.map((n, idx) => (
                        <div
                          key={`notif-${n.id || idx}-${idx}`}
                          onClick={(e) => handleMarkAsRead(n.id, n.link_tab, e)}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid var(--border-color)",
                            backgroundColor: n.is_read
                              ? "transparent"
                              : "rgba(179, 207, 229, 0.1)",
                            cursor: "pointer",
                            transition: "background 150ms ease",
                            display: "flex",
                            gap: "10px",
                            alignItems: "flex-start",
                          }}
                        >
                          <div style={{ marginTop: "2px" }}>
                            {getNotifIcon(n.type)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: n.is_read ? "600" : "700",
                                color: "var(--text-main)",
                              }}
                            >
                              {n.title}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                marginTop: "2px",
                                lineHeight: "1.4",
                              }}
                            >
                              {n.message}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--text-muted)",
                                marginTop: "4px",
                              }}
                            >
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          {!n.is_read && (
                            <span
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                backgroundColor: "#3B82F6",
                                marginTop: "6px",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: "24px",
                          textAlign: "center",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                        }}
                      >
                        No notifications found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Read-only Verified Backend Role Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "6px",
                backgroundColor: roleStyle.bg,
                border: `1px solid ${roleStyle.border}`,
                color: roleStyle.text,
                fontWeight: "600",
              }}
            >
              <ShieldCheck size={14} color={roleStyle.text} />
              <span style={{ textTransform: "capitalize" }}>
                {currentRole.replace(/_/g, " ")}
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              title="Toggle Light / Dark Mode"
            >
              {theme === "light" ? (
                <Moon size={15} color="#0A1931" />
              ) : (
                <Sun size={15} color="#F59E0B" />
              )}
              {theme === "light" ? "Dark" : "Light"}
            </button>

            {/* Log Out Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="btn btn-secondary"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--danger)",
                borderColor: "rgba(225, 29, 72, 0.3)",
              }}
              title="Log Out of System"
            >
              <LogOut size={15} color="var(--danger)" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content Body with NO horizontal scrollbar */}
        <main
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your PeoplePay360 session?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Attendance Quick Action Widget Popup Modal - Pixel-Perfect Matching Diagram Layout */}
      {showAttendanceWidget && (
        <div
          className="modal-overlay"
          onClick={() => setShowAttendanceWidget(false)}
          style={{
            backdropFilter: "blur(4px)",
            backgroundColor: "rgba(10, 25, 49, 0.4)",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "430px",
              width: "90%",
              backgroundColor: "var(--card-bg)",
              color: "var(--text-main)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              boxShadow: "0 20px 40px rgba(10, 25, 49, 0.15)",
              padding: "24px",
              position: "relative",
            }}
          >
            {/* Modal Header with Status Light Dot */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "var(--deep-navy)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: 0,
                }}
              >
                <Clock size={18} color="var(--secondary-blue)" /> Attendance
                Widget
              </h3>

              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {/* STATUS LIGHT DOT & EXPLICIT BADGE LABEL */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    backgroundColor:
                      userAttendance?.check_in && !userAttendance?.check_out
                        ? "rgba(16, 185, 129, 0.12)"
                        : "rgba(225, 29, 72, 0.12)",
                    border:
                      userAttendance?.check_in && !userAttendance?.check_out
                        ? "1px solid rgba(16, 185, 129, 0.3)"
                        : "1px solid rgba(225, 29, 72, 0.3)",
                  }}
                >
                  <div
                    title={
                      userAttendance?.check_in && !userAttendance?.check_out
                        ? "Active Session (Checked In)"
                        : userAttendance?.check_out
                          ? "Checked Out — Final"
                          : "Not Checked In"
                    }
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor:
                        userAttendance?.check_in && !userAttendance?.check_out
                          ? "#10B981"
                          : "#E11D48",
                      boxShadow:
                        userAttendance?.check_in && !userAttendance?.check_out
                          ? "0 0 8px #10B981"
                          : "0 0 6px rgba(225, 29, 72, 0.6)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color:
                        userAttendance?.check_in && !userAttendance?.check_out
                          ? "#10B981"
                          : "#E11D48",
                    }}
                  >
                    {userAttendance?.check_in && !userAttendance?.check_out
                      ? "Checked In"
                      : userAttendance?.check_out
                        ? "Checked Out"
                        : "Not Checked In"}
                  </span>
                </div>

                <button
                  onClick={() => setShowAttendanceWidget(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Welcome User Block */}
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    fontWeight: "500",
                  }}
                >
                  Welcome back
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "700",
                    color: "var(--deep-navy)",
                    marginTop: "2px",
                  }}
                >
                  {userName}!
                </div>
              </div>

              {/* Time Stat Rows (Matching Diagram Layout) */}
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Row 1: Session Check In - Now */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ color: "var(--secondary-navy)" }}>
                    {userAttendance?.check_in && !userAttendance?.check_out
                      ? `Checked In (${getCheckInTimeStr()}) — Now`
                      : userAttendance?.check_out
                        ? `Checked Out — Final`
                        : `Not Checked In — Now`}
                  </span>
                  <span
                    style={{
                      color:
                        userAttendance?.check_in && !userAttendance?.check_out
                          ? "#10B981"
                          : "var(--text-main)",
                      fontFamily: "monospace",
                      fontSize: "15px",
                    }}
                  >
                    {getElapsedTimeStr()}
                  </span>
                </div>

                <div
                  style={{
                    height: "1px",
                    backgroundColor: "var(--border-color)",
                  }}
                />

                {/* Row 2: Today Total */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Today</span>
                  <span
                    style={{
                      color: "var(--text-main)",
                      fontFamily: "monospace",
                      fontSize: "15px",
                    }}
                  >
                    {getTodayWorkedHoursStr()}
                  </span>
                </div>
              </div>

              {/* DYNAMIC CHECK IN / CHECK OUT ACTION BUTTON */}
              {userAttendance?.check_in && !userAttendance?.check_out ? (
                <button
                  onClick={handleWidgetCheckOut}
                  disabled={widgetLoading}
                  className="btn"
                  style={{
                    backgroundColor: "#4A7FA7",
                    color: "#FFFFFF",
                    padding: "13px",
                    fontSize: "15px",
                    fontWeight: "700",
                    borderRadius: "12px",
                    width: "100%",
                    cursor: widgetLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(74, 127, 167, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {widgetLoading ? "Checking Out..." : "Check Out"}
                </button>
              ) : (
                <button
                  onClick={handleWidgetCheckIn}
                  disabled={widgetLoading || Boolean(userAttendance?.check_out)}
                  className="btn btn-primary"
                  style={{
                    padding: "13px",
                    fontSize: "15px",
                    fontWeight: "700",
                    borderRadius: "12px",
                    width: "100%",
                    cursor:
                      widgetLoading || Boolean(userAttendance?.check_out)
                        ? "not-allowed"
                        : "pointer",
                    opacity: Boolean(userAttendance?.check_out) ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  {widgetLoading
                    ? "Checking In..."
                    : userAttendance?.check_out
                      ? "Attendance Completed Today"
                      : "Check In"}
                </button>
              )}

              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                Employees can mark attendance from the quick widget and review
                records from the Attendance module.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
