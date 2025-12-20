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
  CartesianGrid,
} from "recharts";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const adminPin = "1234";

export default function DashboardPage() {
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [name, setName] = useState("");

  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");

  useEffect(() => {
    const savedPeople = JSON.parse(localStorage.getItem("people")) || [];
    setPeople(savedPeople);
    if (savedPeople.length > 0) {
      selectPerson(savedPeople[0]);
    }
  }, []);

  const selectPerson = (p) => {
    setSelectedPerson(p);
    const savedTasks = JSON.parse(localStorage.getItem("tasks_" + p.id)) || [];
    setTasks(savedTasks);
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
    const updated = [...people, newPerson];
    savePeople(updated);
    setName("");
    selectPerson(newPerson);
  };

  const editPerson = (p, e) => {
    e.stopPropagation();
    if (!checkAdmin()) return;
    const newName = prompt("New name", p.name);
    if (!newName) return;
    savePeople(
      people.map((x) => (x.id === p.id ? { ...x, name: newName } : x))
    );
  };

  const deletePerson = (p, e) => {
    e.stopPropagation();
    if (!checkAdmin()) return;
    savePeople(people.filter((x) => x.id !== p.id));
    localStorage.removeItem("tasks_" + p.id);
    if (selectedPerson?.id === p.id) {
      setSelectedPerson(null);
      setTasks([]);
    }
  };

  const addTask = () => {
    if (!taskName || !submissionDate || !checkAdmin()) return;
    saveTasks([
      ...tasks,
      {
        id: Date.now(),
        name: taskName,
        submissionDate,
        completed: false,
        late: false,
      },
    ]);
    setTaskName("");
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

  const completed = tasks.filter((t) => t.completed && !t.late).length;
  const late = tasks.filter((t) => t.completed && t.late).length;
  const pending = tasks.filter((t) => !t.completed).length;

  const barData = [
    { name: "Completed", value: completed },
    { name: "Late", value: late },
    { name: "Pending", value: pending },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Student Task Dashboard
        </h1>

        {/* Add Student */}
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

        {/* Empty State */}
        {people.length === 0 && (
          <p className="text-center text-gray-500">
            No students yet. Add a student to start.
          </p>
        )}

        {selectedPerson && (
          <>
            {/* Add Task */}
            <Card title={`Add Task • ${selectedPerson.name}`}>
              <div className="flex gap-2">
                <input
                  className="border p-2 rounded w-full"
                  placeholder="Task name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={submissionDate}
                  onChange={(e) => setSubmissionDate(e.target.value)}
                />
                <button
                  onClick={addTask}
                  className="bg-blue-600 text-white px-4 rounded"
                >
                  Add
                </button>
              </div>
            </Card>

            {/* Stats */}
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
                      onClick={() => selectPerson(p)}
                      className={`border rounded p-2 flex justify-between items-center cursor-pointer transition-all duration-300 ${
                        selectedPerson.id === p.id
                          ? "border-2 border-blue-800 shadow-lg shadow-blue-500/50"
                          : "border border-gray-300"
                      }`}
                    >
                      <span>{p.name}</span>
                      <div className="flex gap-2">
                        <FiEdit
                          color="blue"
                          onClick={(e) => editPerson(p, e)}
                        />
                        <FiTrash2
                          color="red"
                          onClick={(e) => deletePerson(p, e)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            {/* Graph */}
              <Card title="Progress">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value">
                      {barData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.name === "Completed"
                              ? "#16a34a"
                              : entry.name === "Pending"
                              ? "#dc2626"
                              : "#facc15"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Tasks */}
              <Card title={` Task • ${selectedPerson.name}`}>
                <div className="space-y-3 max-h-72 overflow-auto">
                  {tasks.map((t) => (
                    <div key={t.id} className="border p-3 rounded">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm">Due: {t.submissionDate}</p>
                      <div className="flex gap-2 mt-2">
                        {!t.completed && !isExpired(t) && (
                          <button
                            onClick={() =>
                              updateTask(t.id, { completed: true, late: false })
                            }
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Mark Completed
                          </button>
                        )}
                        {!t.completed && isExpired(t) && (
                          <button
                            onClick={() =>
                              updateTask(t.id, { completed: true, late: true })
                            }
                            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Submit Late
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="ml-auto text-red-600"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
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
