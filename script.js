// Bus Pass Management - browser storage (no localhost / no server)
const studentForm = document.getElementById("studentForm");
const passForm = document.getElementById("passForm");
const studentMessage = document.getElementById("studentMessage");
const passMessage = document.getElementById("passMessage");
const passTable = document.getElementById("passTable");
const searchInput = document.getElementById("searchInput");

let students = JSON.parse(localStorage.getItem("busStudents") || "[]");
let passes = JSON.parse(localStorage.getItem("busPasses") || "[]");
let nextPassId = Number(localStorage.getItem("nextBusPassId") || "101");

function saveData() {
  localStorage.setItem("busStudents", JSON.stringify(students));
  localStorage.setItem("busPasses", JSON.stringify(passes));
  localStorage.setItem("nextBusPassId", String(nextPassId));
}

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.className = isError ? "message error" : "message";
}

function getStatus(startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  if (today < start) return "Not Yet Active";
  if (today > end) return "Expired";
  return "Active";
}

studentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(studentForm);
  const id = String(form.get("id")).trim();
  const name = String(form.get("name")).trim();
  const department = String(form.get("department")).trim();

  if (students.some(student => String(student.id) === id)) {
    showMessage(studentMessage, "This Student ID is already registered.", true);
    return;
  }

  students.push({ id, name, department });
  saveData();
  showMessage(studentMessage, "Student registered and saved successfully.");
  studentForm.reset();
  updateDashboard();
});

passForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(passForm);
  const studentId = String(form.get("studentId")).trim();
  const student = students.find(item => String(item.id) === studentId);

  if (!student) {
    showMessage(passMessage, "Student ID not found. Register the student first.", true);
    return;
  }

  const busNumber = String(form.get("busNumber")).trim();
  const route = String(form.get("route")).trim();
  const startDate = String(form.get("startDate"));
  const endDate = String(form.get("endDate"));

  if (endDate < startDate) {
    showMessage(passMessage, "End date cannot be before start date.", true);
    return;
  }

  passes.push({
    passId: nextPassId++, studentId, studentName: student.name,
    department: student.department, busNumber, route, startDate, endDate
  });

  saveData();
  showMessage(passMessage, "Bus pass generated and saved successfully.");
  passForm.reset();
  updateDashboard();
  displayPasses(passes);
});

function updateDashboard() {
  document.getElementById("studentCount").textContent = students.length;
  document.getElementById("passCount").textContent = passes.length;
  document.getElementById("activeCount").textContent =
    passes.filter(pass => getStatus(pass.startDate, pass.endDate) === "Active").length;
}

function displayPasses(list) {
  passTable.innerHTML = "";
  if (list.length === 0) {
    passTable.innerHTML = '<tr><td colspan="7" class="empty">No matching bus passes found.</td></tr>';
    return;
  }

  list.forEach(pass => {
    const status = getStatus(pass.startDate, pass.endDate);
    const statusClass = status === "Active" ? "active" :
      status === "Expired" ? "expired" : "pending";
    const row = document.createElement("tr");
    const values = [
      "BP" + pass.passId,
      pass.studentName + " (" + pass.studentId + ")",
      pass.busNumber,
      pass.route,
      pass.startDate,
      pass.endDate
    ];
    values.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "status " + statusClass;
    badge.textContent = status;
    statusCell.appendChild(badge);
    row.appendChild(statusCell);
    passTable.appendChild(row);
  });
}

function searchPasses() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    displayPasses(passes);
    return;
  }
  const filtered = passes.filter(pass =>
    String(pass.studentId).toLowerCase().includes(query) ||
    pass.studentName.toLowerCase().includes(query) ||
    pass.busNumber.toLowerCase().includes(query) ||
    ("bp" + pass.passId).toLowerCase().includes(query)
  );
  displayPasses(filtered);
}

document.getElementById("searchButton").addEventListener("click", searchPasses);
searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") searchPasses();
});
document.getElementById("refreshButton").addEventListener("click", () => {
  searchInput.value = "";
  displayPasses(passes);
  updateDashboard();
});

// Load previously saved records whenever the page is opened.
updateDashboard();
displayPasses(passes);
