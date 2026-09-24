async function getTasksFromApi() {
  const response = await window.fetch(`${API_URL}/tasks`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  return { response: response, data: data };
}

async function createTaskInApi(task) {
  const response = await window.fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  });
  const data = await response.json();
  return { response: response, data: data };
}

async function updateTaskInApi(id, taskUpdates) {
  const response = await window.fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskUpdates),
  });
  const data = await response.json();
  return { response: response, data: data };
}

async function completeTaskInApi(id) {
  const response = await window.fetch(`${API_URL}/tasks/complete/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  return { response: response, data: data };
}

async function reopenTaskInApi(id) {
  const response = await window.fetch(`${API_URL}/tasks/incomplete/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  return { response: response, data: data };
}

async function deleteTaskFromApi(id) {
  const response = await window.fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  return { response: response, data: data };
}
