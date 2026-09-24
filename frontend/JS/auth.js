// ------------- GLOBAL VARIABLES -------------

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const logoutButton = document.getElementById("logoutButton");
const signupButton = document.getElementById("signupButton");
const loginButton = document.getElementById("loginButton");

function goToLogin() {
  window.location.href = "./login.html";
}

// ------------- LOGIN STORAGE -------------

function getToken() {
  return window.localStorage.getItem("authToken");
}

function logout() {
  window.localStorage.removeItem("authToken");
  window.localStorage.removeItem("userName");
  goToLogin();
}

function confirmLogout() {
  const confirmed = window.confirm(`Log out of ${APP_NAME}?`);

  if (confirmed) {
    logout();
  }
}

function requireLogin() {
  if (!getToken()) {
    goToLogin();
    return false;
  }

  return true;
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ------------- SIGNUP -------------

// Sends the signup form to the backend.
async function signup() {
  hideMessage("authMessage");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    showMessage("authMessage", "Please fill in all fields.", "error");
    return;
  }

  if (password.length < 8) {
    showMessage(
      "authMessage",
      "Password must be at least 8 characters.",
      "error",
    );
    return;
  }

  setButtonLoading(signupButton, true, "Create account", "Creating account...");

  try {
    const response = await window.fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage(
        "authMessage",
        data.message || "Could not create account.",
        "error",
      );
      return;
    }

    showMessage(
      "authMessage",
      "Account created. Redirecting to the login page...",
      "success",
    );

    window.setTimeout(goToLogin, 900);
  } catch (error) {
    showMessage("authMessage", "Could not connect to the server.", "error");
  } finally {
    setButtonLoading(
      signupButton,
      false,
      "Create account",
      "Creating account...",
    );
  }
}

// ------------- LOGIN -------------

// Sends the login form to the backend.
async function login() {
  hideMessage("authMessage");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showMessage(
      "authMessage",
      "Please enter your email and password.",
      "error",
    );
    return;
  }

  setButtonLoading(loginButton, true, "Log in", "Logging in...");

  try {
    const response = await window.fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage("authMessage", data.message || "Could not log in.", "error");
      return;
    }

    window.localStorage.setItem("authToken", data.token);
    window.localStorage.setItem("userName", data.user.name);

    window.location.href = "./dashboard.html";
  } catch (error) {
    showMessage("authMessage", "Could not connect to the server.", "error");
  } finally {
    setButtonLoading(loginButton, false, "Log in", "Logging in...");
  }
}

// ------------- EVENT LISTENERS -------------

function handleSignupSubmit(event) {
  event.preventDefault();
  signup();
}

function handleLoginSubmit(event) {
  event.preventDefault();
  login();
}

function setupAuthPage() {
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignupSubmit);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", confirmLogout);
  }
}

// This file runs on every frontend page that includes auth.js.
document.addEventListener("DOMContentLoaded", setupAuthPage);
