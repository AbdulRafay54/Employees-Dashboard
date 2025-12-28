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

const adminPin = "1234";

export default function DashboardPage() {
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

    const snap = await getDocs(collection(db, "employees", p.id, "tasks"));
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setTasks(list);
  };

  const checkAdmin = async () => {
    const { value: pin } = await Swal.fire({
      title: "Admin PIN",
      input: "password",
      inputPlaceholder: "Enter PIN",
    });
    if (pin !== adminPin) {
      Swal.fire("Access Denied", "Only admin allowed", "error");
      return false;
    }
    return true;
  };

  const addPerson = async () => {
    if (!(await checkAdmin())) return;
    if (!name.trim()) return;

    const ref = await addDoc(collection(db, "employees"), {
      name: name.trim(),
      nameLower: name.trim().toLowerCase(),
      emails: [],
    });

    setPeople([...people, { id: ref.id, name: name.trim(), emails: [] }]);
    setName("");
  };

  const addTask = async () => {
    if (!(await checkAdmin())) return;
    if (!taskName || !submissionDate || !selectedPerson) return;

    const ref = await addDoc(
      collection(db, "employees", selectedPerson.id, "tasks"),
      {
        name: taskName,
        description: taskDesc,
        submissionDate,
        completed: false,
        late: false,
        email: selectedEmail,
      }
    );

    setTasks([
      ...tasks,
      {
        id: ref.id,
        name: taskName,
        description: taskDesc,
        submissionDate,
        completed: false,
        late: false,
      },
    ]);

    setTaskName("");
    setTaskDesc("");
    setSubmissionDate("");
  };

  const updateTask = async (id, updates) => {
    if (!(await checkAdmin())) return;
    const ref = doc(db, "employees", selectedPerson.id, "tasks", id);
    await updateDoc(ref, updates);
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = async (id) => {
    if (!(await checkAdmin())) return;
    await deleteDoc(doc(db, "employees", selectedPerson.id, "tasks", id));
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const completed = tasks.filter((t) => t.completed && !t.late).length;
  const late = tasks.filter((t) => t.completed && t.late).length;
  const pending = tasks.filter((t) => !t.completed).length;

  const barData = [
    { name: "Completed", value: completed },
    { name: "Late", value: late },
    { name: "Pending", value: pending },
  ];

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  function GaugePointer() {
    const { valueAngle, outerRadius, cx, cy } = useGaugeState();
    if (valueAngle === null) return null;
    const x = cx + outerRadius * Math.sin(valueAngle);
    const y = cy - outerRadius * Math.cos(valueAngle);
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="#2563eb" />
        <line x1={cx} y1={cy} x2={x} y2={y} stroke="#2563eb" strokeWidth={3} />
      </g>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 p-4">
      <h1 className="text-3xl font-extrabold text-center mb-6">
        Employee Task Dashboard
      </h1>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Employees */}
        <div className="lg:col-span-3">
          <Card title="Employees">
            {people.map((p) => (
              <div
                key={p.id}
                onClick={() => selectPerson(p)}
                className={`px-3 py-2 rounded-lg cursor-pointer mb-2 transition ${
                  selectedPerson?.id === p.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50 hover:bg-blue-50"
                }`}
              >
                {p.name}
              </div>
            ))}
          </Card>
        </div>

        {/* Center */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat title="Total" value={tasks.length} />
            <Stat title="Completed" value={completed} />
            <Stat title="Pending" value={pending} />
            <Stat title="Late" value={late} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Progress">
              <div className="flex justify-center">
                <GaugeContainer width={220} height={140} value={progress}>
                  <GaugeReferenceArc />
                  <GaugeValueArc />
                  <GaugePointer />
                </GaugeContainer>
              </div>
              <p className="text-center text-2xl font-bold">{progress}%</p>
            </Card>

            <Card title="Overview">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={barData} dataKey="value" outerRadius={80}>
                    <Cell fill="#22c55e" />
                    <Cell fill="#facc15" />
                    <Cell fill="#ef4444" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="Progress Chart">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {barData.map((e, i) => (
                    <Cell
                      key={i}
                      fill={
                        e.name === "Completed"
                          ? "#22c55e"
                          : e.name === "Late"
                          ? "#facc15"
                          : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tasks */}
        <div className="lg:col-span-3">
          <Card title="Tasks">
            {tasks.map((t) => (
              <div key={t.id} className="p-2 bg-gray-50 rounded mb-2">
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-gray-500">{t.submissionDate}</p>
                {!t.completed && (
                  <button
                    onClick={() =>
                      updateTask(t.id, { completed: true, late: false })
                    }
                    className="text-xs text-blue-600"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-4">
      <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow text-center p-3">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
