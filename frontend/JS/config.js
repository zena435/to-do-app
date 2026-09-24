const API_URL = 'https://to-do-app-j48m.onrender.com';
const APP_NAME = 'Taskmate';

function applyAppname() {
    const appNameElements = document.querySelectorAll('.app-name');// allows to target attributes coz of its versatility

    for (const element of appNameElements) {
        element.textContent = APP_NAME;
    }
}
document.addEventListener('DOMContentLoaded', applyAppname);