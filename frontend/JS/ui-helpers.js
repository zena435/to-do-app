function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior:'smooth',
    });
}

function showMessage(id, message, type = 'success') {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = `message ${type}`;
    element.hidden = false;
}

function hideMessage(id) {
    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent = '';
    element.hidden = true;
}

function setButtonLoading(button, isLoading,normalText, loadingText) {
    if (!button) {
        return;
    }

    if (isLoading) {
        button.textContent = loadingText;
        button.disabled = true;
    } else {
        button.textContent = normalText;
        button.disabled = false;
    }
}
