// ------------- TASK LIST GLOBAL VARIABLES -------------

const pendingTasks = document.getElementById('pendingTasks');
const completedTasks = document.getElementById('completedTasks');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const totalTaskCount = document.getElementById('totalTaskCount');
const lastUpdated = document.getElementById('lastUpdated');
const expandedTaskIds = [];
const movingTaskIds = [];
const enteringTaskIds = [];
const taskMoveAnimationDuration = 180;
let confirmingDeleteTaskId = null;
let currentTaskSort = 'newest';

// ------------- TASK MESSAGES -------------

const taskMessages = {
  loading: {
    title: 'Loading tasks...',
    detail: 'Your task list will be ready shortly.',
  },
  noPending: {
    title: 'You are all caught up.',
    detail: 'Add a task above when something new needs to get done.',
  },
  noCompleted: {
    title: 'No completed tasks yet.',
    detail: 'Finished tasks will appear here.',
  },
  serverError: {
    title: 'Tasks are unavailable.',
    detail: 'Could not connect to the server. Please try again.',
  },
};

// ------------- TASK LIST HELPERS -------------

function addTaskId(taskIds, id) {
  if (!taskIds.includes(id)) {
    taskIds.push(id);
  }
}

function removeTaskId(taskIds, id) {
  const index = taskIds.indexOf(id);

  if (index !== -1) {
    taskIds.splice(index, 1);
  }
}

function updateTaskSummary(totalPending, totalCompleted) {
  const totalTasks = totalPending + totalCompleted;
  const taskWord = totalTasks === 1 ? 'task' : 'tasks';
  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  totalTaskCount.textContent = `${totalTasks} ${taskWord} total`;
  lastUpdated.textContent = `Last updated ${time}`;
}

function formatDueDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const dateParts = String(dateValue).slice(0, 10).split('-');

  if (dateParts.length !== 3) {
    return '';
  }

  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]) - 1;
  const day = Number(dateParts[2]);
  const date = new Date(year, month, day);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCompletedAt(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getCompletionStatusClass(dueDateValue, completedAtValue) {
  if (!dueDateValue || !completedAtValue) {
    return '';
  }

  const dateParts = String(dueDateValue).slice(0, 10).split('-');

  if (dateParts.length !== 3) {
    return '';
  }

  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]) - 1;
  const day = Number(dateParts[2]);
  const dueDateEnd = new Date(year, month, day, 23, 59, 59, 999);
  const completedDate = new Date(completedAtValue);

  if (Number.isNaN(dueDateEnd.getTime()) || Number.isNaN(completedDate.getTime())) {
    return '';
  }

  if (completedDate <= dueDateEnd) {
    return 'on-time';
  }

  return 'past-due';
}

function clearTaskLists() {
  pendingTasks.textContent = '';
  completedTasks.textContent = '';
}

function showEmptyTaskMessage(list, title = 'No tasks to show.', detail = '') {
  const item = window.document.createElement('li');
  const heading = window.document.createElement('strong');
  const description = window.document.createElement('span');

  item.className = 'empty-task';
  heading.textContent = title;
  description.textContent = detail;

  item.append(heading);
  item.append(description);
  list.append(item);
}

function showTaskLoadError() {
  clearTaskLists();
  showEmptyTaskMessage(
    pendingTasks,
    taskMessages.serverError.title,
    taskMessages.serverError.detail,
  );
  showEmptyTaskMessage(
    completedTasks,
    taskMessages.serverError.title,
    taskMessages.serverError.detail,
  );
  pendingCount.textContent = '-';
  completedCount.textContent = '-';
  totalTaskCount.textContent = 'Tasks unavailable';
}

function getTaskDateTime(dateValue, fallbackTime = 0) {
  if (!dateValue) {
    return fallbackTime;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return fallbackTime;
  }

  return date.getTime();
}

function getDueDateTime(task) {
  if (!task.dueDate) {
    return Number.POSITIVE_INFINITY;
  }

  return getTaskDateTime(task.dueDate, Number.POSITIVE_INFINITY);
}

function compareTaskTitles(firstTask, secondTask) {
  return firstTask.title.localeCompare(secondTask.title);
}

function compareTasks(firstTask, secondTask) {
  if (currentTaskSort === 'oldest') {
    return getTaskDateTime(firstTask.createdAt) - getTaskDateTime(secondTask.createdAt);
  }

  if (currentTaskSort === 'due') {
    const dueDateDifference = getDueDateTime(firstTask) - getDueDateTime(secondTask);

    if (dueDateDifference !== 0) {
      return dueDateDifference;
    }

    return compareTaskTitles(firstTask, secondTask);
  }

  if (currentTaskSort === 'title') {
    return compareTaskTitles(firstTask, secondTask);
  }

  return getTaskDateTime(secondTask.createdAt) - getTaskDateTime(firstTask.createdAt);
}

function getSortedTasks(tasksToSort) {
  const sortedTasks = tasksToSort.slice();

  sortedTasks.sort(compareTasks);

  return sortedTasks;
}

function getTaskCreatorName(task) {
  if (typeof task.createdBy === 'string') {
    return task.createdBy;
  }

  if (task.user && typeof task.user.name === 'string') {
    return task.user.name;
  }

  return '';
}

function applyTaskExpandedState(item, details, actions, isExpanded) {
  item.classList.toggle('expanded', isExpanded);

  if (details) {
    details.hidden = !isExpanded;
  }

  actions.hidden = !isExpanded;
  item.setAttribute('aria-expanded', String(isExpanded));
}

function getTaskElementById(id) {
  const taskCards = document.querySelectorAll('.task-card');

  for (let index = 0; index < taskCards.length; index++) {
    if (taskCards[index].dataset.taskId === id) {
      return taskCards[index];
    }
  }

  return null;
}

function setDeleteButtonConfirming(deleteButton, task, isConfirming) {
  deleteButton.classList.toggle('is-confirming', isConfirming);
  deleteButton.textContent = isConfirming ? 'Confirm' : 'Delete';
  deleteButton.setAttribute(
    'aria-label',
    `${isConfirming ? 'Confirm delete' : 'Delete'} ${task.title}`,
  );
  deleteButton.setAttribute('title', isConfirming ? 'Confirm delete' : 'Delete task');
}

function resetDeleteConfirmationButtons() {
  const deleteButtons = document.querySelectorAll('.deleteButton.is-confirming');

  for (let index = 0; index < deleteButtons.length; index++) {
    deleteButtons[index].classList.remove('is-confirming');
    deleteButtons[index].textContent = 'Delete';
    deleteButtons[index].setAttribute(
      'aria-label',
      deleteButtons[index].dataset.deleteLabel || 'Delete task',
    );
    deleteButtons[index].setAttribute('title', 'Delete task');
  }

  confirmingDeleteTaskId = null;
}

function handleDeleteButtonClick(deleteButton, task) {
  if (
    confirmingDeleteTaskId === task._id &&
    deleteButton.classList.contains('is-confirming')
  ) {
    confirmingDeleteTaskId = null;
    deleteTask(task._id);
    return;
  }

  resetDeleteConfirmationButtons();
  confirmingDeleteTaskId = task._id;
  setDeleteButtonConfirming(deleteButton, task, true);
}

// ------------- DISPLAY TASKS -------------

// Formats the UI layout of each task.
function formatTask(task) {
  const isComplete = task.completed;
  const item = document.createElement('li');
  const content = document.createElement('div');
  const summary = document.createElement('div');
  const title = document.createElement('span');
  const actions = document.createElement('div');
  const footerMeta = document.createElement('div');
  const actionFooter = document.createElement('div');
  const actionButtons = document.createElement('div');
  const editButton = document.createElement('button');
  const toggleButton = document.createElement('button');
  const deleteButton = document.createElement('button');
  const dueDateText = formatDueDate(task.dueDate);
  const completedAtText = formatCompletedAt(task.completedAt);
  const completionStatusClass = getCompletionStatusClass(task.dueDate, task.completedAt);
  const creatorName = getTaskCreatorName(task);
  let details = null;

  item.className = 'task-card';
  item.dataset.taskId = task._id;
  content.className = 'task-content';
  summary.className = 'task-summary';
  title.className = 'task-title';
  actions.className = 'task-actions';
  footerMeta.className = 'task-footer-meta';
  actionFooter.className = 'task-action-footer';
  actionButtons.className = 'task-action-buttons';
  item.tabIndex = 0;
  item.setAttribute('aria-expanded', 'false');

  title.textContent = task.title;
  summary.append(title);

  content.append(summary);

  if (task.description) {
    details = document.createElement('div');
    details.className = 'task-details';
    details.hidden = true;

    const description = document.createElement('span');

    description.className = 'task-description';
    description.textContent = task.description;
    details.append(description);
    content.append(details);
  }

  toggleButton.type = 'button';
  editButton.type = 'button';
  editButton.className = 'editButton';
  editButton.textContent = 'Edit';
  editButton.setAttribute('aria-label', `Edit ${task.title}`);
  editButton.setAttribute('title', 'Edit task');
  deleteButton.type = 'button';
  deleteButton.className = 'danger deleteButton';
  deleteButton.textContent = 'Delete';
  deleteButton.dataset.deleteLabel = `Delete ${task.title}`;
  deleteButton.setAttribute('aria-label', `Delete ${task.title}`);
  deleteButton.setAttribute('title', 'Delete task');

  const dueDateMeta = document.createElement('span');
  const dueDateLabel = document.createElement('span');
  const dueDateValue = document.createElement('span');

  dueDateMeta.className = 'task-footer-due-date';
  dueDateLabel.className = 'task-footer-meta-label';
  dueDateLabel.textContent = 'Due:';
  dueDateValue.className = 'task-footer-meta-value';
  dueDateValue.textContent = dueDateText;
  dueDateMeta.append(dueDateLabel);
  dueDateMeta.append(dueDateValue);
  footerMeta.append(dueDateMeta);

  if (completedAtText) {
    const completedAt = document.createElement('span');
    const completedAtLabel = document.createElement('span');
    const completedAtValue = document.createElement('span');

    completedAt.className = 'task-completed-at';
    completedAtLabel.className = 'task-footer-meta-label';
    completedAtLabel.textContent = 'Completed:';
    completedAtValue.className = 'task-footer-meta-value';
    completedAtValue.textContent = completedAtText;

    if (completionStatusClass) {
      completedAt.classList.add(completionStatusClass);
    }

    completedAt.append(completedAtLabel);
    completedAt.append(completedAtValue);
    footerMeta.append(completedAt);
  }

  content.append(footerMeta);

  if (isComplete) {
    item.className = 'task-card complete';
    toggleButton.className = 'undoButton';
    toggleButton.textContent = 'Redo';

    toggleButton.addEventListener('click', function () {
      incompleteTask(task._id);
    });
  } else {
    toggleButton.className = 'completeButton';
    toggleButton.textContent = 'Complete';
    toggleButton.addEventListener('click', function () {
      completeTask(task._id);
    });
    editButton.addEventListener('click', function () {
      editTask(task._id);
    });
    actionButtons.append(editButton);
  }

  deleteButton.addEventListener('click', function () {
    handleDeleteButtonClick(deleteButton, task);
  });

  actionButtons.append(toggleButton);
  actionButtons.append(deleteButton);

  actionFooter.append(actionButtons);

  if (creatorName) {
    const createdBy = document.createElement('span');

    createdBy.className = 'task-created-by';
    createdBy.textContent = `Created by ${creatorName}`;
    actionFooter.append(createdBy);
  }

  actions.append(actionFooter);
  actions.hidden = true;

  function toggleTaskExpanded() {
    const isExpanded = !item.classList.contains('expanded');

    applyTaskExpandedState(item, details, actions, isExpanded);

    if (isExpanded) {
      addTaskId(expandedTaskIds, task._id);
    } else {
      removeTaskId(expandedTaskIds, task._id);
    }
  }

  item.addEventListener('click', function (event) {
    if (event.target.closest('button')) {
      return;
    }

    toggleTaskExpanded();
  });

  item.addEventListener('keydown', function (event) {
    if (event.target.closest('button')) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTaskExpanded();
    }
  });

  actions.addEventListener('click', function (event) {
    event.stopPropagation();
  });

  item.append(content);
  item.append(actions);
  applyTaskExpandedState(item, details, actions, expandedTaskIds.includes(task._id));

  if (enteringTaskIds.includes(task._id)) {
    item.classList.add('is-entering');
  }

  return item;
}

// Splits tasks into the correct columns.
function renderTasks(tasksToRender) {
  let totalPending = 0;
  let totalCompleted = 0;
  const sortedTasks = getSortedTasks(tasksToRender);

  confirmingDeleteTaskId = null;
  clearTaskLists();

  // tasksToRender is an array. Each task inside it is an object from MongoDB.
  for (let index = 0; index < sortedTasks.length; index++) {
    const task = sortedTasks[index];
    const taskElement = formatTask(task);

    if (task.completed) {
      completedTasks.append(taskElement);
      totalCompleted += 1;
    } else {
      pendingTasks.append(taskElement);
      totalPending += 1;
    }
  }

  if (totalPending === 0) {
    showEmptyTaskMessage(
      pendingTasks,
      taskMessages.noPending.title,
      taskMessages.noPending.detail,
    );
  }

  if (totalCompleted === 0) {
    showEmptyTaskMessage(
      completedTasks,
      taskMessages.noCompleted.title,
      taskMessages.noCompleted.detail,
    );
  }

  pendingCount.textContent = totalPending;
  completedCount.textContent = totalCompleted;
  updateTaskSummary(totalPending, totalCompleted);
}

// ------------- TASK ANIMATIONS -------------

function waitForTaskMoveAnimation() {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, getTaskMoveAnimationDuration());
  });
}

function getTaskMoveAnimationDuration() {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 0;
  }

  return taskMoveAnimationDuration;
}

function startTaskMoveAnimation(id) {
  if (movingTaskIds.includes(id)) {
    return false;
  }

  addTaskId(movingTaskIds, id);

  const taskElement = getTaskElementById(id);

  if (taskElement) {
    taskElement.classList.add('is-leaving');
  }

  return true;
}

async function finishTaskMoveAnimation(id, renderTaskList) {
  await showTaskEnterAnimation(id, renderTaskList);
  removeTaskId(movingTaskIds, id);
}

async function showTaskEnterAnimation(id, renderTaskList) {
  addTaskId(enteringTaskIds, id);
  await renderTaskList();

  const taskElement = getTaskElementById(id);

  if (taskElement) {
    window.setTimeout(function () {
      taskElement.classList.remove('is-entering');
      removeTaskId(enteringTaskIds, id);
    }, getTaskMoveAnimationDuration());
  } else {
    removeTaskId(enteringTaskIds, id);
  }
}

function cancelTaskMoveAnimation(id) {
  removeTaskId(movingTaskIds, id);
  removeTaskId(enteringTaskIds, id);

  const taskElement = getTaskElementById(id);

  if (taskElement) {
    taskElement.classList.remove('is-leaving');
  }
}
