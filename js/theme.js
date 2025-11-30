const toggleBtn = document.getElementById('themeToggle');
const body = document.body;
const icon = toggleBtn.querySelector('i');

// Init
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'light') {
    body.classList.add('light-mode');
    icon.classList.replace('fa-sun', 'fa-moon');
}

toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    body.classList.toggle('light-mode');
    
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
        icon.classList.replace('fa-sun', 'fa-moon');
    } else {
        localStorage.setItem('theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
});