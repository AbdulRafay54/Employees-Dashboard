"use client";
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
} from "recharts";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import {
  GaugeContainer,
  GaugeReferenceArc,
  GaugeValueArc,
  useGaugeState,
} from "@mui/x-charts/Gauge";
import { PieChart as MUIPieChart } from "@mui/x-charts/PieChart";

const adminPin = "1234";

export default function DashboardPage() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [name, setName] = useState("");

  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");

  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [allEmails, setAllEmails] = useState([]);
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employees"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPeople(list);
      if (list.length > 0) selectPerson(list[0]);
    };
    fetchEmployees();
  }, []);

  const selectPerson = async (p) => {
    setSelectedPerson(p);
    setEmails(p.emails || []);

    setTasks([]);
    setFilteredTasks([]);

    const tasksSnapshot = await getDocs(
      collection(db, "employees", p.id, "tasks")
    );

    const tasksList = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setTasks(tasksList);
    setFilteredTasks(tasksList);
  };

  useEffect(() => {
    const fetchEmails = async () => {
      const snap = await getDocs(collection(db, "emails"));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllEmails(list);
    };
    fetchEmails();
  }, []);

  const saveEmails = async (list) => {
    if (!selectedPerson) return;

    await updateDoc(doc(db, "employees", selectedPerson.id), {
      emails: list,
    });

    setEmails(list);
    setEmails(list);
    setSelectedPerson({ ...selectedPerson, emails: list });
    if (list.length > 0) setSelectedEmail(list[list.length - 1]);
  };

  const checkAdmin = async () => {
    const { value: pin } = await Swal.fire({
      title: "Enter Admin PIN",
      input: "password",
      inputLabel: "Admin PIN",
      inputPlaceholder: "Enter PIN",
      inputAttributes: {
        maxlength: 10,
        autocapitalize: "off",
        autocorrect: "off",
      },
    });
    if (pin !== adminPin) {
      Swal.fire({
        icon: "error",
        title: "Only admin can perform this action...",
      });
      return false;
    }
    return true;
  };

  const handleAdminToggle = async () => {
    if (isAdminMode) {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to disable admin mode?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, disable",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        setIsAdminMode(false);
        Swal.fire({ icon: "success", title: "Admin mode disabled" });
      }

      return;
    }

    const { value: pin } = await Swal.fire({
      title: "Enter Admin PIN",
      input: "password",
      inputLabel: "Admin PIN",
      inputPlaceholder: "Enter PIN",
      inputAttributes: {
        maxlength: 10,
        autocapitalize: "off",
        autocorrect: "off",
      },
    });

    if (pin === adminPin) {
      setIsAdminMode(true);
      Swal.fire({ icon: "success", title: "Admin mode enabled" });
    } else {
      Swal.fire({ icon: "error", title: "Incorrect PIN" });
    }
  };

  const saveTasks = (list) => {
    setTasks(list);
    if (selectedPerson) {
      localStorage.setItem("tasks_" + selectedPerson.id, JSON.stringify(list));
    }
  };

  const isExpired = (t) =>
    !t.completed && new Date(t.submissionDate) < new Date();

  const addPerson = async () => {
    if (!(await checkAdmin())) return;
    if (!name.trim()) return;

    const cleanName = name.trim();
    const lowerName = cleanName.toLowerCase();

    const snapshot = await getDocs(collection(db, "employees"));

    const alreadyExists = snapshot.docs.some((doc) => {
      const data = doc.data();
      return data.nameLower
        ? data.nameLower === lowerName
        : data.name?.toLowerCase() === lowerName;
    });

    if (alreadyExists) {
      Swal.fire({
        icon: "error",
        title: "Employee already exists",
        text: `"${cleanName}" already exists`,
      });
      return;
    }

    // ✅ Add employee
    const docRef = await addDoc(collection(db, "employees"), {
      name: cleanName,
      nameLower: lowerName,
      emails: [],
    });

    const newPerson = {
      id: docRef.id,
      name: cleanName,
      nameLower: lowerName,
      emails: [],
    };

    setPeople((prev) => [...prev, newPerson]);
    setSelectedPerson(newPerson);

    setTasks([]);
    setFilteredTasks([]);
    setEmails([]);
    setSelectedEmail("");
    setName("");

    Swal.fire({
      icon: "success",
      title: "Employee Added",
    });
  };

  const addTask = async () => {
    if (!taskName || !submissionDate) return;

    if (!isAdminMode) return;

    try {
      const ref = await addDoc(
        collection(db, "employees", selectedPerson.id, "tasks"),
        {
          name: taskName,
          description: taskDesc,
          submissionDate,
          completed: false,
          late: false,
          email: selectedEmail,
          createdAt: Date.now(),
        }
      );

      const newTask = {
        id: ref.id,
        name: taskName,
        description: taskDesc,
        submissionDate,
        completed: false,
        late: false,
        email: selectedEmail,
      };

      setTasks((prev) => [...prev, newTask]);
      setFilteredTasks((prev) => [...prev, newTask]);

      Swal.fire({
        icon: "success",
        title: "Task Assigned",
        timer: 1200,
        showConfirmButton: false,
      });

      setTaskName("");
      setTaskDesc("");
      setSubmissionDate("");
    } catch (error) {
      console.error("Task add failed:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Task could not be assigned. Try again.",
      });
    }
  };

  const getTaskScore = (task) => {
    const today = new Date();
    const due = new Date(task.submissionDate);

    if (!task.completed) return 0;

    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 100; // on time
    if (diffDays <= 20) return 80; // within 20 days late
    return 70; // very late
  };

  function getGaugeColor(score) {
    if (score === 100) return "#16a34a"; // Green
    if (score >= 80) return "#facc15"; // Yellow
    return "#dc2626"; // Red
  }

  const updateTask = async (id, updates) => {
    if (!isAdminMode) return;

    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    setTasks(updatedTasks);

    const taskRef = doc(db, "employees", selectedPerson.id, "tasks", id);
    await updateDoc(taskRef, updates);
  };

  const deleteTask = async (taskId) => {
    if (!isAdminMode) return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This task will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return;

    await deleteDoc(doc(db, "employees", selectedPerson.id, "tasks", taskId));

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setFilteredTasks((prev) => prev.filter((t) => t.id !== taskId));

    Swal.fire({
      icon: "success",
      title: "Task Deleted",
      timer: 1200,
      showConfirmButton: false,
    });
  };
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const editEmail = async (emailObj) => {
    if (!isAdminMode) return;

    const { value } = await Swal.fire({
      title: "Edit Email",
      input: "email",
      inputValue: emailObj.email,
      showCancelButton: true,
    });

    if (!value) return;

    const clean = value.trim().toLowerCase();

    if (!isValidEmail(clean)) {
      Swal.fire({ icon: "error", title: "Invalid Email" });
      return;
    }

    const duplicate = allEmails.some(
      (e) => e.email === clean && e.id !== emailObj.id
    );

    if (duplicate) {
      Swal.fire({
        icon: "error",
        title: "Duplicate Email",
      });
      return;
    }

    await updateDoc(doc(db, "emails", emailObj.id), {
      email: clean,
    });

    setAllEmails((prev) =>
      prev.map((e) => (e.id === emailObj.id ? { ...e, email: clean } : e))
    );

    if (selectedEmail === emailObj.email) {
      setSelectedEmail(clean);
    }

    Swal.fire({
      icon: "success",
      title: "Email Updated",
      timer: 1000,
      showConfirmButton: false,
    });
  };
  const deleteEmailConfirm = async (emailObj) => {
    if (!isAdminMode) return;

    const res = await Swal.fire({
      title: "Delete Email?",
      text: emailObj.email,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
    });

    if (!res.isConfirmed) return;

    await deleteDoc(doc(db, "emails", emailObj.id));

    setAllEmails((prev) => prev.filter((e) => e.id !== emailObj.id));

    if (selectedEmail === emailObj.email) {
      setSelectedEmail("");
    }

    Swal.fire({
      icon: "success",
      title: "Email Deleted",
      timer: 1000,
      showConfirmButton: false,
    });
  };

  const deleteStudent = async (id) => {
    if (!isAdminMode) return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "The employee and all of their tasks will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete all",
    });

    if (!confirm.isConfirmed) return;

    try {
      const tasksSnap = await getDocs(collection(db, "employees", id, "tasks"));
      for (const taskDoc of tasksSnap.docs) {
        await deleteDoc(doc(db, "employees", id, "tasks", taskDoc.id));
      }

      await deleteDoc(doc(db, "employees", id));
      setPeople((prev) => prev.filter((p) => p.id !== id));

      if (selectedPerson?.id === id) {
        setSelectedPerson(null);
        setTasks([]);
        setFilteredTasks([]);
      }

      Swal.fire({
        icon: "success",
        title: "Employee & Tasks Deleted",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: "Something went wrong",
      });
    }
  };

  const editStudent = async (id) => {
    if (!isAdminMode) return;

    const { value: newName } = await Swal.fire({
      title: "Edit Employee Name",
      input: "text",
      inputLabel: "New Name",
      inputPlaceholder: "Enter new name",
      inputValue: people.find((p) => p.id === id)?.name || "",
      showCancelButton: true,
    });

    if (!newName) return;

    try {
      const studentRef = doc(db, "employees", id);
      await updateDoc(studentRef, { name: newName });

      const updated = people.map((p) =>
        p.id === id ? { ...p, name: newName } : p
      );
      setPeople(updated);

      if (selectedPerson?.id === id) {
        setSelectedPerson({ ...selectedPerson, name: newName });
      }

      Swal.fire({
        icon: "success",
        title: "Employee name updated!",
        text: `Name has been changed to "${newName}"`,
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "Something went wrong while updating.",
      });
    }
  };
  // Filter tasks
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const filtered = tasks.filter((t) => {
      const taskDate = new Date(t.submissionDate);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      if (from && taskDate < from) return false;
      if (to && taskDate > to) return false;
      return true;
    });

    setFilteredTasks(filtered);
  }, [tasks, fromDate, toDate]);

  const completed = tasks.filter((t) => t.completed && !t.late).length;
  const late = tasks.filter((t) => t.completed && t.late).length;
  const pending = tasks.filter((t) => !t.completed).length;

  const barData = [
    { name: "Completed", value: completed },
    { name: "Late", value: late },
    { name: "Pending", value: pending },
  ];

  const progressPercent =
    tasks.length === 0
      ? 0
      : Math.round(
          tasks.reduce((acc, t) => acc + getTaskScore(t), 0) / tasks.length
        );

  const meterData = [
    { name: "Progress", value: progressPercent },
    { name: "Remaining", value: 100 - progressPercent },
  ];

  function GaugePointer() {
    const { valueAngle, outerRadius, cx, cy } = useGaugeState();

    if (valueAngle === null) return null;

    const angleDeg = (valueAngle * 180) / Math.PI;

    return (
      <g>
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - outerRadius}
          stroke="red"
          strokeWidth={3}
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `rotate(${angleDeg}deg)`,
            transition: "transform 1s ease-out",
          }}
        />
        <circle cx={cx} cy={cy} r={5} fill="red" />
      </g>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
          Employee Task Dashboard
        </h1>
        <div className="flex justify-end mb-4">
          <button
            onClick={handleAdminToggle}
            className="bg-blue-600 text-white  px-4 py-2 rounded"
          >
            {isAdminMode ? "Disable Admin Mode" : "Enable Admin Mode"}
          </button>
        </div>

        {isAdminMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Add Employee">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    className="border p-2 rounded w-full"
                    placeholder="Employee name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <button
                    onClick={addPerson}
                    className="bg-blue-600 text-white px-4 rounded"
                  >
                    Add
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    className="border p-2 rounded w-full"
                    placeholder="Add email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <button
                    onClick={async () => {
                      const email = newEmail.trim().toLowerCase();

                      // 🔒 Admin mode check (NO PIN POPUP)
                      if (!isAdminMode) {
                        Swal.fire({
                          icon: "error",
                          title: "Admin mode required",
                          text: "Please enable admin mode first",
                        });
                        return;
                      }

                      // ❌ Empty
                      if (!email) {
                        Swal.fire({
                          icon: "error",
                          title: "Email required",
                          text: "Please enter an email address",
                        });
                        return;
                      }

                      // ❌ Invalid
                      if (!isValidEmail(email)) {
                        Swal.fire({
                          icon: "error",
                          title: "Invalid Email",
                          text: "Please enter a valid email (example@gmail.com)",
                        });
                        return;
                      }

                      // 🔥 STRICT DUPLICATE CHECK (Firestore)
                      const snap = await getDocs(collection(db, "emails"));

                      const alreadyExists = snap.docs.some(
                        (doc) => doc.data().email.toLowerCase() === email
                      );

                      if (alreadyExists) {
                        Swal.fire({
                          icon: "error",
                          title: "Duplicate Email",
                          text: "This email already exists",
                        });
                        return;
                      }

                      // ✅ Add email
                      const ref = await addDoc(collection(db, "emails"), {
                        email,
                        createdAt: Date.now(),
                      });

                      setAllEmails((prev) => [...prev, { id: ref.id, email }]);
                      setNewEmail("");

                      Swal.fire({
                        icon: "success",
                        title: "Email Added",
                        timer: 1200,
                        showConfirmButton: false,
                      });
                    }}
                    className="bg-blue-600 text-white px-4 rounded"
                  >
                    Mail
                  </button>
                </div>
              </div>
            </Card>

            {selectedPerson && (
              <Card title={`Add Task • ${selectedPerson.name}`}>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  <input
                    className="border p-2 rounded w-full"
                    placeholder="Task name"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                  />
                  <textarea
                    className="border p-2 rounded w-full"
                    placeholder="Description (optional)"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                  />
                  <input
                    type="date"
                    className="border p-2 rounded w-full"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                  />
                  <div className="relative w-full">
                    {/* SELECT BOX */}
                    <button
                      type="button"
                      onClick={() => setEmailOpen((p) => !p)}
                      className="border p-2 rounded w-full bg-white text-left"
                    >
                      {selectedEmail || "Select Email"}
                    </button>

                    {/* DROPDOWN */}
                    {emailOpen && (
                      <div className="absolute z-30 mt-1 w-full bg-white border rounded shadow max-h-52 overflow-auto">
                        {allEmails.length === 0 && (
                          <p className="p-2 text-sm text-gray-500">No emails</p>
                        )}

                        {allEmails.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center justify-between px-2 py-1 hover:bg-gray-100"
                          >
                            {/* SELECT */}
                            <span
                              onClick={() => {
                                setSelectedEmail(e.email);
                                setEmailOpen(false);
                              }}
                              className="cursor-pointer text-sm"
                            >
                              {e.email}
                            </span>

                            {/* ACTIONS */}
                            {isAdminMode && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    editEmail(e);
                                  }}
                                  className="text-blue-600 text-sm"
                                >
                                  <FiEdit2 />
                                </button>

                                <button
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    deleteEmailConfirm(e);
                                  }}
                                  className="text-red-600 text-sm"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={addTask}
                    className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                  >
                    Assign Task
                  </button>
                </div>
              </Card>
            )}
          </div>
        )}

        {selectedPerson && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox title="Total Tasks" value={tasks.length} />
            <StatBox
              title="Completed"
              value={completed}
              color="text-green-600"
            />
            <StatBox title="Pending" value={pending} color="text-red-600" />
            <StatBox title="Late" value={late} color="text-yellow-600" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Filter & Score">
            <div className="flex flex-col gap-3">
              {/* Date Range Filter */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-300 bg-white px-3 py-2 rounded-md text-sm
        focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-gray-300 bg-white px-3 py-2 rounded-md text-sm
        focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Bike Meter */}
              <div className="w-full h-36 relative top-1 flex items-end justify-center">
                <GaugeContainer
                  width={220}
                  height={140}
                  startAngle={-90}
                  endAngle={90}
                  value={progressPercent} // percentage se needle move karega
                >
                  <defs>
                    <linearGradient
                      id="gaugeGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#dc2626" /> {/* Red */}
                      <stop offset="25%" stopColor="#f97316" /> {/* Orange */}
                      <stop offset="50%" stopColor="#facc15" /> {/* Yellow */}
                      <stop offset="75%" stopColor="#a3e635" />{" "}
                      {/* Light Green */}
                      <stop offset="100%" stopColor="#16a34a" /> {/* Green */}
                    </linearGradient>
                  </defs>

                  <GaugeReferenceArc style={{ fill: "#e5e7eb" }} />
                  <GaugeValueArc style={{ fill: "url(#gaugeGradient)" }} />
                  <GaugePointer />
                </GaugeContainer>

                <div className="absolute bottom-8 text-center">
                  <p className="text-3xl font-bold text-gray-800">
                    {progressPercent}%
                  </p>
                  <p className="text-xs text-gray-500">Task Completed</p>
                </div>
              </div>
            </div>
          </Card>

          {selectedPerson && (
            <Card title="Student Progress">
              <div className="h-52 w-full flex items-center mt-[-8px] justify-center overflow-hidden">
                <MUIPieChart
                  width={200}
                  height={180}
                  series={[
                    {
                      data: [
                        { id: 0, value: completed, label: "Completed" },
                        { id: 1, value: late, label: "Late" },
                        { id: 2, value: pending, label: "Pending" },
                      ],
                    },
                  ]}
                  colors={["#16a34a", "#facc15", "#dc2626"]} // green, yellow, red
                />
              </div>
            </Card>
          )}
        </div>

        {selectedPerson && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[340px] items-stretch">
            {/* Students */}
            <Card title="Employees">
              <div className="space-y-2 max-h-72 overflow-auto">
                {people.map((p) => (
                  <div
                    key={p.id}
                    className={`border rounded p-2 flex justify-between items-center cursor-pointer transition-all duration-300 ${
                      selectedPerson.id === p.id
                        ? "border-2 border-blue-800 shadow-lg shadow-blue-500/50"
                        : "border border-gray-300"
                    }`}
                    onClick={() => selectPerson(p)}
                  >
                    <span className="flex-1">{p.name}</span>

                    <div
                      className={`flex gap-2 ${
                        !isAdminMode ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      <FiEdit2
                        onClick={(e) => {
                          e.stopPropagation();
                          editStudent(p.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                      />
                      <FiTrash2
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStudent(p.id);
                        }}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Bar Graph */}
            <Card title="Progress">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {barData.map((e, i) => (
                      <Cell
                        key={i}
                        fill={
                          e.name === "Completed"
                            ? "#16a34a"
                            : e.name === "Late"
                            ? "#facc15"
                            : "#dc2626"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Tasks */}
            <Card title={`Assigned Tasks • ${selectedPerson.name}`}>
              <div className="space-y-3 max-h-72 overflow-auto">
                {filteredTasks.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No tasks found for selected date range
                  </p>
                ) : (
                  filteredTasks.map((t) => {
                    const expired = isExpired(t);
                    return (
                      <div key={t.id} className="border p-3 rounded">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-sm text-gray-500">
                          Due: {t.submissionDate}
                        </p>
                        <p
                          className={`text-sm font-medium mt-1 ${
                            t.completed
                              ? t.late
                                ? "text-yellow-600"
                                : "text-green-600"
                              : expired
                              ? "text-red-600"
                              : "text-red-400"
                          }`}
                        >
                          {t.completed
                            ? t.late
                              ? "Late Submitted"
                              : "Completed"
                            : expired
                            ? "Deadline Missed"
                            : "Pending"}
                        </p>

                        {/* ACTIONS */}
                        <div className="flex items-center mt-2 gap-2">
                          {!t.completed && (
                            <select
                              disabled={!isAdminMode}
                              className="border p-1 rounded text-sm"
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value === "done") {
                                  updateTask(t.id, {
                                    completed: true,
                                    late: false,
                                  });
                                }
                                if (e.target.value === "late") {
                                  updateTask(t.id, {
                                    completed: true,
                                    late: true,
                                  });
                                }
                              }}
                            >
                              <option value="">Action</option>
                              {!expired && (
                                <option value="done">Mark Completed</option>
                              )}
                              {expired && (
                                <option value="late">Submit (Late)</option>
                              )}
                            </select>
                          )}

                          <button
                            disabled={!isAdminMode}
                            onClick={() => deleteTask(t.id)}
                            className={`ml-auto text-red-600 ${
                              !isAdminMode
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:text-red-800"
                            }`}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow flex flex-col h-full">
      <h3 className="font-semibold px-4 pt-4 pb-2 text-sm">{title}</h3>

      <div className="flex-1 px-4 pb-2 overflow-hidden">{children}</div>
    </div>
  );
}

function StatBox({ title, value, color = "text-gray-800" }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow text-center">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
