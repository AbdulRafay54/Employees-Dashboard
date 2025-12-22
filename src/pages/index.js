"use client";
import { useState, useEffect } from "react";
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
  const [monthFilter, setMonthFilter] = useState("all");

  useEffect(() => {
    const savedPeople = JSON.parse(localStorage.getItem("people")) || [];
    setPeople(savedPeople);
    if (savedPeople.length > 0) selectPerson(savedPeople[0]);
  }, []);

  const selectPerson = (p) => {
    setSelectedPerson(p);
    const savedTasks = JSON.parse(localStorage.getItem("tasks_" + p.id)) || [];
    setEmails(JSON.parse(localStorage.getItem("emails_" + p.id)) || []);
    setTasks(savedTasks);
  };

  const saveEmails = (list) => {
    setEmails(list);
    if (selectedPerson) {
      localStorage.setItem("emails_" + selectedPerson.id, JSON.stringify(list));
    }
  };

  const checkAdmin = () => {
    if (prompt("Admin PIN") !== adminPin) {
      alert("Only admin can perform this action");
      return false;
    }
    return true;
  };

  const savePeople = (list) => {
    setPeople(list);
    localStorage.setItem("people", JSON.stringify(list));
  };

  const saveTasks = (list) => {
    setTasks(list);
    if (selectedPerson) {
      localStorage.setItem("tasks_" + selectedPerson.id, JSON.stringify(list));
    }
  };

  const isExpired = (t) =>
    !t.completed && new Date(t.submissionDate) < new Date();

  const addPerson = () => {
    if (!name.trim() || !checkAdmin()) return;
    const newPerson = { id: Date.now(), name };
    savePeople([...people, newPerson]);
    setName("");
    selectPerson(newPerson);
  };

  const addTask = () => {
    if (!taskName || !submissionDate || !checkAdmin()) return;
    saveTasks([
      ...tasks,
      {
        id: Date.now(),
        name: taskName,
        description: taskDesc,
        submissionDate,
        completed: false,
        late: false,
        showMore: false,
        email: selectedEmail,
      },
    ]);
    setTaskName("");
    setTaskDesc("");
    setSubmissionDate("");
  };

  const updateTask = (id, updates) => {
    if (!checkAdmin()) return;
    saveTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id) => {
    if (!checkAdmin()) return;
    saveTasks(tasks.filter((t) => t.id !== id));
  };

  const deleteStudent = (id) => {
    if (!checkAdmin()) return;

    const updated = people.filter((p) => p.id !== id);
    setPeople(updated);
    localStorage.setItem("people", JSON.stringify(updated));

    localStorage.removeItem("tasks_" + id);
    localStorage.removeItem("emails_" + id);

    if (selectedPerson?.id === id) {
      setSelectedPerson(updated[0] || null);
      setTasks([]);
    }
  };

  const editStudent = (id) => {
    if (!checkAdmin()) return;
    const newName = prompt("Enter new name:");
    if (!newName) return;

    const updated = people.map((p) =>
      p.id === id ? { ...p, name: newName } : p
    );
    setPeople(updated);
    localStorage.setItem("people", JSON.stringify(updated));

    if (selectedPerson?.id === id) {
      setSelectedPerson({ ...selectedPerson, name: newName });
    }
  };

  const completed = tasks.filter((t) => t.completed && !t.late).length;
  const late = tasks.filter((t) => t.completed && t.late).length;
  const pending = tasks.filter((t) => !t.completed).length;

  const barData = [
    { name: "Completed", value: completed },
    { name: "Late", value: late },
    { name: "Pending", value: pending },
  ];

  const progressPercent =
    tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Student Task Dashboard
        </h1>

        {/* 🔹 Add Student + Empty half (ONLY CHANGE HERE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Add Student">
            <div className="flex gap-2">
              <input
                className="border p-2 rounded w-full"
                placeholder="Student name"
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
          </Card>

          <Card title="Filter & Score">
            <div className="flex items-center justify-between">
              <select
                className="border p-2 rounded"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="all">All Months</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "short",
                    })}
                  </option>
                ))}
              </select>

              <div
                className="w-24 h-24 rounded-full border-8 border-yellow-400
                    flex items-center justify-center"
              >
                <span className="text-xl font-bold">{progressPercent}%</span>
              </div>
            </div>
          </Card>
        </div>

        {selectedPerson && (
          <>
            {/* Add Task + Pie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title={`Add Task • ${selectedPerson.name}`}>
                <div className="space-y-2">
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
                  <select
                    className="border p-2 rounded w-full"
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                  >
                    <option value="">Select Email</option>
                    {emails.map((email, i) => (
                      <option key={i} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={addTask}
                    className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                  >
                    Add Task
                  </button>
                </div>
              </Card>

              <Card title="Student Progress">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {/* LEFT: PIE (SAME AS BEFORE) */}
                  <div className="flex flex-col items-center">
                    <PieChart width={180} height={180}>
                      <Pie
                        data={barData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                      >
                        <Cell fill="#16a34a" />
                        <Cell fill="#facc15" />
                        <Cell fill="#dc2626" />
                      </Pie>
                    </PieChart>
                    <p className="text-sm text-gray-500">Completion</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {progressPercent}%
                    </p>
                  </div>

                  {/* RIGHT: EMAIL ADD BOX */}
                  <div className="space-y-2">
                    <input
                      className="border p-2 rounded w-full"
                      placeholder="Add email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        if (!checkAdmin()) return;
                        saveEmails([...emails, newEmail]);
                        setNewEmail("");
                      }}
                      className="bg-blue-600 text-white w-full py-2 rounded"
                    >
                      Add Email
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* 🔹 4 STAT BOXES (RESTORED) */}
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

            {/* Main */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Students */}
              <Card title="Students">
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

                      <div className="flex gap-2">
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
             <Card title={`Tasks • ${selectedPerson.name}`}>
  <div className="space-y-3 max-h-72 overflow-auto">
    {tasks.map((t) => {
      const expired = isExpired(t);

      return (
        <div key={t.id} className="border p-3 rounded">
          <p className="font-medium">{t.name}</p>
          <p className="text-sm text-gray-500">
            Due: {t.submissionDate}
          </p>

          {/* STATUS */}
          <p
            className={`text-sm font-medium mt-1 ${
              t.completed
                ? t.late
                  ? "text-yellow-600"
                  : "text-green-600"
                : expired
                ? "text-red-600"
                : "text-gray-700"
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
              onClick={() => deleteTask(t.id)}
              className="ml-auto text-red-600"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
      );
    })}
  </div>
</Card>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
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
