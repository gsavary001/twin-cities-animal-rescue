/* Twin Cities Animal Rescue - interactivity
   1. Volunteer role tracker (services.html): save roles, stored in localStorage
   2. Saved roles carried to the volunteer form (contact.html)
   3. JavaScript form validation with messages next to each field */

/* ---------- Data ---------- */

// Array of objects: the volunteer roles shown on services.html
const roles = [
  { id: "animal-care", title: "Animal Care Volunteer", time: "About 3 hours a week" },
  { id: "event-helper", title: "Adoption Event Helper", time: "About 4 hours on a weekend" },
  { id: "transport-driver", title: "Transport Driver", time: "About 2 hours per trip" },
  { id: "office-outreach", title: "Office and Outreach Helper", time: "About 2 hours a week" }
];

const STORAGE_KEY = "tcarSavedRoles";

// Object: validation rules, one function per form field (returns an error message or "")
const validators = {
  name: function (value) {
    if (value.trim() === "") return "Please enter your full name.";
    if (value.trim().length < 2) return "Your name must be at least 2 characters.";
    return "";
  },
  email: function (value) {
    if (value.trim() === "") return "Please enter your email address.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value.trim())) return "Enter a valid email, such as name@example.com.";
    return "";
  },
  phone: function (value) {
    if (value.trim() === "") return "";
    if (!/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(value.trim())) return "Use the format 555-123-4567.";
    return "";
  },
  interest: function (value) {
    return value === "" ? "Please choose how you would like to help." : "";
  },
  availability: function (value) {
    return value === "" ? "Please choose your availability." : "";
  },
  experience: function (value) {
    return value === "" ? "Please choose your experience with pets." : "";
  },
  message: function (value) {
    return value.length > 500 ? "Your message must be 500 characters or fewer." : "";
  }
};

/* ---------- Storage helpers ---------- */

function getSavedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}

function setSavedIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    /* storage unavailable: the page still works for this visit */
  }
}

function findRole(id) {
  return roles.find(function (role) { return role.id === id; });
}

/* ---------- Volunteer role tracker (services.html) ---------- */

function toggleRole(id) {
  let ids = getSavedIds();
  const roleTitle = findRole(id).title;
  if (ids.includes(id)) {
    ids = ids.filter(function (savedId) { return savedId !== id; });
    showSavedMessage(roleTitle + " was removed from your saved roles.");
  } else {
    ids.push(id);
    showSavedMessage(roleTitle + " was saved.");
  }
  setSavedIds(ids);
  updateRoleButtons();
  renderSavedList();
}

function showSavedMessage(text) {
  const message = document.getElementById("saved-message");
  if (message) message.textContent = text;
}

function updateRoleButtons() {
  const ids = getSavedIds();
  document.querySelectorAll(".save-role").forEach(function (button) {
    const isSaved = ids.includes(button.dataset.role);
    button.textContent = isSaved ? "Saved ✓ (select to remove)" : "Save this role";
    button.setAttribute("aria-pressed", String(isSaved));
    button.classList.toggle("saved", isSaved);
  });
}

function renderSavedList() {
  const list = document.getElementById("saved-list");
  const emptyText = document.getElementById("saved-empty");
  const clearButton = document.getElementById("clear-saved");
  const formLink = document.getElementById("saved-form-link");
  const ids = getSavedIds();

  list.innerHTML = "";
  ids.forEach(function (id) {
    const role = findRole(id);
    if (!role) return;
    const item = document.createElement("li");
    item.textContent = role.title + " (" + role.time + ")";
    list.appendChild(item);
  });

  const hasSaved = ids.length > 0;
  emptyText.hidden = hasSaved;
  clearButton.hidden = !hasSaved;
  formLink.hidden = !hasSaved;
}

function clearSavedRoles() {
  setSavedIds([]);
  updateRoleButtons();
  renderSavedList();
  showSavedMessage("Your saved roles were cleared.");
}

function initServicesPage() {
  document.querySelectorAll(".save-role").forEach(function (button) {
    button.addEventListener("click", function () {
      toggleRole(button.dataset.role);
    });
  });
  document.getElementById("clear-saved").addEventListener("click", clearSavedRoles);
  updateRoleButtons();
  renderSavedList();
}

/* ---------- Volunteer form (contact.html) ---------- */

function getSavedTitles() {
  return getSavedIds()
    .map(findRole)
    .filter(Boolean)
    .map(function (role) { return role.title; });
}

function prefillFormFromStorage() {
  const titles = getSavedTitles();
  const summary = document.getElementById("saved-summary");
  if (titles.length === 0) return;

  summary.hidden = false;
  summary.innerHTML = "Roles you saved: <strong>" + titles.join(", ") + "</strong>. " +
    '<a href="services.html">Change your saved roles</a>';

  const interest = document.getElementById("interest");
  const message = document.getElementById("message");
  if (interest.value === "") interest.value = "volunteer";
  if (message.value.trim() === "") {
    message.value = "I am interested in these volunteer roles: " + titles.join(", ") + ".";
  }
}

function showError(fieldId, text) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + "-error");
  error.textContent = text;
  if (text) {
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", fieldId + "-error");
  } else {
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
  }
}

function validateField(fieldId) {
  const value = document.getElementById(fieldId).value;
  const text = validators[fieldId](value);
  showError(fieldId, text);
  return text === "";
}

function validateForm() {
  let firstInvalid = null;
  Object.keys(validators).forEach(function (fieldId) {
    if (!validateField(fieldId) && firstInvalid === null) firstInvalid = fieldId;
  });
  return firstInvalid;
}

function handleSubmit(event) {
  event.preventDefault();
  const status = document.getElementById("form-status");
  const firstInvalid = validateForm();

  if (firstInvalid !== null) {
    status.textContent = "Please fix the highlighted fields and try again. Your answers have been kept.";
    status.classList.add("has-errors");
    document.getElementById(firstInvalid).focus();
    return;
  }

  const firstName = document.getElementById("name").value.trim().split(" ")[0];
  status.classList.remove("has-errors");
  status.textContent = "Thank you, " + firstName + "! We received your interest and a team member will contact you soon.";
  status.focus();
}

function initContactPage() {
  const form = document.getElementById("interest-form");
  prefillFormFromStorage();
  form.addEventListener("submit", handleSubmit);
  Object.keys(validators).forEach(function (fieldId) {
    const field = document.getElementById(fieldId);
    field.addEventListener("blur", function () { validateField(fieldId); });
    field.addEventListener("input", function () {
      if (field.hasAttribute("aria-invalid")) validateField(fieldId);
    });
  });
}

/* ---------- Start ---------- */

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("saved-list")) initServicesPage();
  if (document.getElementById("interest-form")) initContactPage();
});
