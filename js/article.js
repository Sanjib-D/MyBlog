import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Logic
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

const loading = document.getElementById('loading');
const articleView = document.getElementById('article-view');

async function loadArticle() {
    if (!postId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const docRef = doc(db, "blogs", postId);
        const docSnap = await getDoc(docRef); // Fixed: Actually fetching the doc

        if (docSnap.exists()) {
            const post = docSnap.data();
            renderArticle(post);
        } else {
            document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px;'>404: Article Not Found</h1>";
        }
    } catch (err) {
        console.error(err);
    }
}

// ... inside article.js ...

function renderArticle(post) {
    // 1. Basic Title
    document.title = `${post.title} | Sanjib Dev`;

    // 2. Dynamic SEO & Social Cards (Open Graph)
    setMeta('description', post.title + " - A story about " + post.category);
    setMeta('og:title', post.title);
    setMeta('og:description', "Read this story on Sanjib.Dev");
    setMeta('og:image', post.image);
    setMeta('og:url', window.location.href);
    setMeta('twitter:card', 'summary_large_image');

    // 3. DOM Injection (Existing code)
    const catBadge = document.getElementById('art-category');
    catBadge.innerText = post.category;
    catBadge.classList.add(`badge-${post.category}`);
    document.getElementById('art-title').innerText = post.title;

    // Reading Time
    const plainText = post.content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    document.getElementById('art-date').innerHTML = `
        <i class="far fa-calendar"></i> ${post.date} &nbsp;|&nbsp; 
        <i class="far fa-clock"></i> ${readTime} min read
    `;
    
    document.getElementById('art-image').src = post.image;
    document.getElementById('art-body').innerHTML = post.content;

    // ... (Social Share Links remain the same) ...
    
    loading.style.display = 'none';
    articleView.style.display = 'block';
}

// Helper function to update/create meta tags
function setMeta(name, content) {
    let element = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
}

// Scroll Progress Bar Logic
window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (scrollTop / scrollHeight) * 100;
    document.getElementById('progressBar').style.width = scrolled + "%";
});

loadArticle();