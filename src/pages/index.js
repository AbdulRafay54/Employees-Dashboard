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

    const tasksSnapshot = await getDocs(
      collection(db, "employees", p.id, "tasks")
    );
    const tasksList = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTasks(tasksList);
  };

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
      autocorrect: "off"
    }
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

  const addPerson = async () => {
    if (!name.trim() || !checkAdmin()) return;

    const ref = await addDoc(collection(db, "employees"), {
      name,
      emails: [],
    });

  
    const snapshot = await getDocs(collection(db, "employees"));
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPeople(list);

    const newPerson = list.find((emp) => emp.id === ref.id);
    setSelectedPerson(newPerson);
    setEmails(newPerson.emails || []);

    setName("");
    setTasks([]);

    Swal.fire({ icon: "success", title: "Employee Added" });

    setTasks([]);
    setEmails([]);
  };

  const addTask = async () => {
    if (!taskName || !submissionDate || !checkAdmin()) return;

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

    setTasks([
      ...tasks,
      {
        id: ref.id,
        name: taskName,
        description: taskDesc,
        submissionDate,
        completed: false,
        late: false,
        email: selectedEmail,
      },
    ]);

    Swal.fire({
      icon: "success",
      title: "Task Assigned",
    });

    setTaskName("");
    setTaskDesc("");
    setSubmissionDate("");
  };

  const updateTask = (id, updates) => {
    if (!checkAdmin()) return;
    saveTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = async (id) => {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return;

  Swal.fire({
    title: "Are you sure?",
    text: "This task will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it",
  }).then((result) => {
    if (result.isConfirmed) {
      saveTasks(tasks.filter((t) => t.id !== id));
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Task has been deleted successfully.",
        timer: 1200,
        showConfirmButton: false,
      });
    }
  });
};


 
const deleteStudent = async (id) => {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return;

  
  await deleteDoc(doc(db, "employees", id));

  
  const snapshot = await getDocs(collection(db, "employees"));
  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  setPeople(list);

 
  if (selectedPerson?.id === id) {
    setSelectedPerson(list[0] || null);
    setTasks([]);
  }

  Swal.fire({ icon: "success", title: "Employee Deleted" });
};

  const editStudent = async (id) => {
  if (!await checkAdmin()) return; 

  const { value: newName } = await Swal.fire({
    title: "Edit Employee Name",
    input: "text",
    inputLabel: "New Name",
    inputPlaceholder: "Enter new name",
    inputValue: people.find(p => p.id === id)?.name || "",
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

  const meterData = [
    { name: "Progress", value: progressPercent },
    { name: "Remaining", value: 100 - progressPercent },
  ];
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
          Employee Task Dashboard
        </h1>

        
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
        onClick={() => {
          if (!checkAdmin()) return;
          saveEmails([...emails, newEmail]);
          setNewEmail("");
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
                  Assign Task
                </button>
              </div>
            </Card>
          )}
        </div>

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
              {/* Month Filter */}
              <select
                className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm
                 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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

              {/* Bike Meter */}
              <div className="w-full h-36 relative flex items-end justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={meterData}
                      startAngle={180}
                      endAngle={0}
                      cx="50%"
                      cy="60%"
                      innerRadius={55}
                      outerRadius={75}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#22c55e" /> {/* progress */}
                      <Cell fill="#e5e7eb" /> {/* remaining */}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute bottom-12 text-center">
                  <p className="text-3xl font-bold text-gray-800">
                    {progressPercent}%
                  </p>
                  <p className="text-xs text-gray-500">Task Completion</p>
                </div>
              </div>
            </div>
          </Card>

          {selectedPerson && (
            <Card title="Student Progress">
              <div className="h-56 w-full flex items-center mt-[-30px] justify-center overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={barData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80} // size control
                      paddingAngle={2}
                    >
                      <Cell fill="#16a34a" />
                      <Cell fill="#facc15" />
                      <Cell fill="#dc2626" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
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
            <Card title={`Assigned Tasks • ${selectedPerson.name}`}>
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
