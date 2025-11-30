import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDvcJ7iU8cqpxzTelK3-GgIS9aCela8G3U",
    authDomain: "sanjib-portfolio.firebaseapp.com",
    projectId: "sanjib-portfolio",
    storageBucket: "sanjib-portfolio.firebasestorage.app",
    messagingSenderId: "1036448013244",
    appId: "1:1036448013244:web:aec993949eb2ea5bea69b9",
    measurementId: "G-734PP7BY3W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const blogGrid = document.getElementById('blog-grid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('no-results');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');

let allPosts = [];

// 1. Fetch Logic
async function fetchPosts() {
    try {
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        allPosts = [];
        snapshot.forEach(doc => allPosts.push({ id: doc.id, ...doc.data() }));
        
        loading.style.display = 'none';
        renderPosts(allPosts);
    } catch (err) { 
        console.error(err);
        loading.innerText = "Failed to load content. Check console.";
    }
}

// 2. Render Logic
function renderPosts(posts) {
    blogGrid.innerHTML = '';
    
    if (posts.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    noResults.style.display = 'none';

    posts.forEach(post => {
        // Create plain text preview from HTML content
        const temp = document.createElement("div");
        temp.innerHTML = post.content || "";
        
        // --- FIX: Remove CSS and JS code from the text preview ---
        const scripts = temp.querySelectorAll('script, style');
        scripts.forEach(node => node.remove());
        // --------------------------------------------------------

        const plainText = (temp.textContent || temp.innerText || "").substring(0, 120);

        const article = document.createElement('article');
        article.className = 'project-card';
        article.innerHTML = `
            <div class="card-image">
                <img src="${post.image}" alt="${post.title}" loading="lazy">
                <span class="card-badge badge-${post.category}">${post.category}</span>
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <i class="far fa-calendar"></i> ${post.date}
                </div>
                <h3>${post.title}</h3>
                <p>${plainText}...</p>
                <div style="margin-top:auto;">
                    <a href="article.html?id=${post.id}" class="btn btn-outline" style="width:100%; justify-content:center;">Read Story</a>
                </div>
            </div>
        `;
        blogGrid.appendChild(article);
    });
}

// 3. Filter Logic
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // UI Update
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Data Filter
        const cat = btn.dataset.category;
        filterData(cat, searchInput.value);
    });
});

// 4. Search Logic (Fuzzy)
searchInput.addEventListener('input', (e) => {
    const activeCat = document.querySelector('.filter-btn.active').dataset.category;
    filterData(activeCat, e.target.value);
});

function filterData(category, searchTerm) {
    const term = searchTerm.toLowerCase();
    
    const filtered = allPosts.filter(post => {
        const matchesCategory = category === 'all' || post.category === category;
        const matchesSearch = post.title.toLowerCase().includes(term) || 
                              post.content.toLowerCase().includes(term);
        return matchesCategory && matchesSearch;
    });
    
    renderPosts(filtered);
}

// Init
fetchPosts();