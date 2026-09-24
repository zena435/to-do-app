// ------------- DASHBOARD GLOBAL VARIABLES -------------

const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');
const taskDueToggle = document.getElementById('taskDueToggle');
const taskDueButton = document.querySelector('.due-date-button');
const taskDueDate = document.getElementById('taskDueDate');
const addTaskButton = document.getElementById('addTaskButton');
const taskFormHeading = document.querySelector('.task-form-heading');
const taskSortSelect = document.getElementById('taskSortSelect');
const dashboardGreeting = document.getElementById('dashboardGreeting');

let editingTaskId = null;
let displayedTasks = [];

// ------------- DASHBOARD HELPERS -------------

// Personalise the dashboard heading using the name saved at login.
function showUserName() {
  const name = window.localStorage.getItem('userName');
  dashboardGreeting.textContent = `Welcome back, ${name}`;
}

function updateTaskFormHeading(text) {
  if (taskFormHeading) {
    taskFormHeading.textContent = text;
  }
}

function showAddTaskMode() {
  editingTaskId = null;
  updateTaskFormHeading('Create task');
  addTaskButton.textContent = 'Add task';
}

function showEditTaskMode(task) {
  editingTaskId = task._id;
  updateTaskFormHeading('Edit task');
  taskTitle.value = task.title;
  taskDescription.value = task.description || '';
  taskDueDate.value = task.dueDate ? String(task.dueDate).slice(0, 10) : '';
  taskDueToggle.checked = Boolean(task.dueDate);
  addTaskButton.textContent = 'Save task';
  scrollToTop();
  taskTitle.focus();
}

function resetTaskForm() {
  taskForm.reset();
  showAddTaskMode();
}

// Gets all tasks from the API and displays them on the page.
async function displayTasks() {
  clearTaskLists();
  showEmptyTaskMessage(
    pendingTasks,
    taskMessages.loading.title,
    taskMessages.loading.detail,
  );

  try {
    const result = await getTasksFromApi();
    const response = result.response;
    const tasks = result.data;

    if (!response.ok) {
      handleTaskError(response, tasks);

      if (response.status !== 401 && response.status !== 403) {
        showTaskLoadError();
      }

      return;
    }

    displayedTasks = tasks;
    renderTasks(displayedTasks);
  } catch (error) {
    showTaskLoadError();
  }
}

// ------------- TASK ACTIONS -------------

function editTask(id) {
  let task = null;

  for (let index = 0; index < displayedTasks.length; index++) {
    if (displayedTasks[index]._id === id) {
      task = displayedTasks[index];
      break;
    }
  }

  if (!task || task.completed) {
    return;
  }

  hideMessage('taskMessage');
  showEditTaskMode(task);
}

// Creates a new task.
async function addTask() {
  hideMessage('taskMessage');

  const title = taskTitle.value.trim();
  const description = taskDescription.value.trim();
  const dueDate = taskDueToggle.checked ? taskDueDate.value : '';

  if (!title) {
    showMessage('taskMessage', 'Please enter a task title.', 'error');
    return;
  }

  const newTask = {
    title: title,
  };

  if (description) {
    newTask.description = description;
  }

  if (dueDate) {
    newTask.dueDate = dueDate;
  }

  setButtonLoading(addTaskButton, true, 'Add task', 'Adding task...');

  try {
    const result = await createTaskInApi(newTask);
    const response = result.response;
    const data = result.data;

    if (!response.ok) {
      handleTaskError(response, data);
      return;
    }

    resetTaskForm();
    showMessage('taskMessage', 'Task added.', 'success');
    await showTaskEnterAnimation(data._id, displayTasks);
    taskTitle.focus();
  } catch (error) {
    showMessage('taskMessage', 'Could not connect to the server.', 'error');
  } finally {
    setButtonLoading(addTaskButton, false, 'Add task', 'Adding task...');
  }
}

// Saves changes to an existing task.
async function saveTaskChanges() {
  hideMessage('taskMessage');

  const taskId = editingTaskId;
  const title = taskTitle.value.trim();
  const description = taskDescription.value.trim();
  const dueDate = taskDueToggle.checked ? taskDueDate.value : '';

  if (!taskId) {
    resetTaskForm();
    showMessage('taskMessage', 'That task could not be found.', 'error');
    return;
  }

  if (!title) {
    showMessage('taskMessage', 'Please enter a task title.', 'error');
    return;
  }

  const taskUpdates = {
    title: title,
    description: description,
    dueDate: dueDate || null,
  };

  setButtonLoading(addTaskButton, true, 'Save task', 'Saving task...');

  try {
    const result = await updateTaskInApi(taskId, taskUpdates);
    const response = result.response;
    const data = result.data;

    if (!response.ok) {
      handleTaskError(response, data);
      return;
    }

    resetTaskForm();
    showMessage('taskMessage', 'Task updated.', 'success');
    await showTaskEnterAnimation(data._id, displayTasks);
    taskTitle.focus();
  } catch (error) {
    showMessage('taskMessage', 'Could not update task.', 'error');
  } finally {
    const buttonText = editingTaskId ? 'Save task' : 'Add task';
    setButtonLoading(addTaskButton, false, buttonText, 'Saving task...');
  }
}

// Sets a task to complete.
async function completeTask(id) {
  if (!startTaskMoveAnimation(id)) {
    return;
  }

  const moveAnimation = waitForTaskMoveAnimation();

  try {
    const result = await completeTaskInApi(id);
    const response = result.response;
    const data = result.data;

    if (!response.ok) {
      cancelTaskMoveAnimation(id);
      handleTaskError(response, data);
      return;
    }

    if (editingTaskId === id) {
      resetTaskForm();
    }

    await moveAnimation;
    await finishTaskMoveAnimation(id, displayTasks);
  } catch (error) {
    cancelTaskMoveAnimation(id);
    showMessage('taskMessage', 'Could not complete task.', 'error');
  }
}

// Sets a task to incomplete.
async function incompleteTask(id) {
  if (!startTaskMoveAnimation(id)) {
    return;
  }

  const moveAnimation = waitForTaskMoveAnimation();

  try {
    const result = await reopenTaskInApi(id);
    const response = result.response;
    const data = result.data;

    if (!response.ok) {
      cancelTaskMoveAnimation(id);
      handleTaskError(response, data);
      return;
    }

    if (editingTaskId === id) {
      resetTaskForm();
    }

    await moveAnimation;
    await finishTaskMoveAnimation(id, displayTasks);
  } catch (error) {
    cancelTaskMoveAnimation(id);
    showMessage('taskMessage', 'Could not mark task incomplete.', 'error');
  }
}

// Deletes a task.
async function deleteTask(id) {
  if (!startTaskMoveAnimation(id)) {
    return;
  }

  const deleteAnimation = waitForTaskMoveAnimation();

  try {
    const result = await deleteTaskFromApi(id);
    const response = result.response;
    const data = result.data;

    if (!response.ok) {
      cancelTaskMoveAnimation(id);
      resetDeleteConfirmationButtons();
      handleTaskError(response, data);
      return;
    }

    await deleteAnimation;
    removeTaskId(expandedTaskIds, id);
    removeTaskId(movingTaskIds, id);

    if (editingTaskId === id) {
      resetTaskForm();
    }

    await displayTasks();
  } catch (error) {
    cancelTaskMoveAnimation(id);
    resetDeleteConfirmationButtons();
    showMessage('taskMessage', 'Could not delete task.', 'error');
  }
}

// ------------- ERROR HANDLING -------------

function handleTaskError(response, data) {
  if (response.status === 401 || response.status === 403) {
    logout();
    return;
  }

  showMessage('taskMessage', data.message || 'Something went wrong.', 'error');
}

// ------------- EVENT LISTENERS -------------

function handleTaskFormSubmit(event) {
  event.preventDefault();

  if (editingTaskId) {
    saveTaskChanges();
  } else {
    addTask();
  }
}

function finishTaskFormReset() {
  showAddTaskMode();
}

function handleTaskFormReset() {
  window.setTimeout(finishTaskFormReset, 0);
}

function openTaskDueDatePicker() {
  if (!taskDueToggle || !taskDueDate) {
    return;
  }

  taskDueToggle.checked = true;
  taskDueDate.focus();

  // Force the browser to apply the checked-state CSS before opening the picker.
  void taskDueDate.offsetWidth;

  if (typeof taskDueDate.showPicker === 'function') {
    try {
      taskDueDate.showPicker();
      return;
    } catch (error) {
      taskDueDate.focus();
    }
  }

  taskDueDate.click();
}

function handleTaskDueButtonClick(event) {
  event.preventDefault();
  openTaskDueDatePicker();
}

function handleTaskDueButtonKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openTaskDueDatePicker();
  }
}

function handleTaskSortChange() {
  currentTaskSort = taskSortSelect.value;
  renderTasks(displayedTasks);
}

function setupDashboard() {
  if (!requireLogin()) {
    return;
  }

  showUserName();
  displayTasks();

  taskForm.addEventListener('submit', handleTaskFormSubmit);
  taskForm.addEventListener('reset', handleTaskFormReset);

  if (taskDueButton) {
    taskDueButton.tabIndex = 0;
    taskDueButton.setAttribute('role', 'button');
    taskDueButton.addEventListener('click', handleTaskDueButtonClick);
    taskDueButton.addEventListener('keydown', handleTaskDueButtonKeydown);
  }

  if (taskSortSelect) {
    taskSortSelect.addEventListener('change', handleTaskSortChange);
  }
}

// This runs when the dashboard page is ready.
window.document.addEventListener('DOMContentLoaded', setupDashboard);
