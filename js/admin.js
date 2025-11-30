import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const logoutBtn = document.getElementById("logoutBtn");
const blogForm = document.getElementById("blogForm");
const postListContainer = document.getElementById("admin-post-list");
const messagesListContainer = document.getElementById("messages-list");
const htmlFileInput = document.getElementById("htmlFileInput");
const adminSearch = document.getElementById("adminSearch");

// State for search
let adminPosts = [];

// --- 1. Auth State ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add("hidden");
        dashboardSection.classList.remove("hidden");
        logoutBtn.classList.remove("hidden");
        loadPosts();
    } else {
        loginSection.classList.remove("hidden");
        dashboardSection.classList.add("hidden");
        logoutBtn.classList.add("hidden");
    }
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
});

logoutBtn.addEventListener("click", () => signOut(auth));

// --- 2. Tab Switching ---
window.switchTab = (tabName) => {
    const viewBlogs = document.getElementById("view-blogs");
    const viewMessages = document.getElementById("view-messages");
    const tabBlogs = document.getElementById("tab-blogs");
    const tabMessages = document.getElementById("tab-messages");

    if (tabName === "blogs") {
        viewBlogs.classList.remove("hidden");
        viewMessages.classList.add("hidden");
        tabBlogs.className = "btn btn-primary";
        tabMessages.className = "btn btn-outline";
    } else {
        viewBlogs.classList.add("hidden");
        viewMessages.classList.remove("hidden");
        tabBlogs.className = "btn btn-outline";
        tabMessages.className = "btn btn-primary";
        loadMessages();
    }
};

// --- 3. Blog Management ---
async function loadPosts() {
    postListContainer.innerHTML = '<div style="color:gray">Loading posts...</div>';
    
    try {
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        adminPosts = []; // Clear memory
        snapshot.forEach(doc => {
            adminPosts.push({ id: doc.id, ...doc.data() });
        });

        renderPostList(adminPosts);
    } catch (err) {
        postListContainer.innerHTML = `<div style="color:red">Error: ${err.message}</div>`;
    }
}

function renderPostList(posts) {
    postListContainer.innerHTML = "";
    if (posts.length === 0) {
        postListContainer.innerHTML = '<div style="text-align:center; color:gray; padding:20px;">No posts found.</div>';
        return;
    }

    posts.forEach(post => {
        const div = document.createElement("div");
        div.className = "post-item";
        div.innerHTML = `
            <div>
                <strong style="font-size:1.1rem;">${post.title}</strong>
                <br>
                <small style="color:var(--text-secondary)">
                    <i class="far fa-calendar"></i> ${post.date} &nbsp;|&nbsp; 
                    <span style="color:var(--accent)">${post.category}</span>
                </small>
            </div>
            <div style="display:flex; gap:5px;">
                <button class="btn-icon btn-edit" onclick="window.startEdit('${post.id}')" title="Edit">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="window.deletePost('${post.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        postListContainer.appendChild(div);
    });
}

// Search Logic
adminSearch.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = adminPosts.filter(post => 
        post.title.toLowerCase().includes(term) || 
        post.category.toLowerCase().includes(term)
    );
    renderPostList(filtered);
});

// Add/Update Logic
blogForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Processing...";

    const editId = document.getElementById("editPostId").value;
    const data = {
        title: document.getElementById("postTitle").value,
        category: document.getElementById("postCategory").value,
        image: document.getElementById("postImage").value,
        content: document.getElementById("postContent").value,
        date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "blogs", editId), data);
            alert("Updated successfully!");
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, "blogs"), data);
            alert("Published successfully!");
        }
        resetForm();
        loadPosts();
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
});

// Helper Functions
htmlFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            let content = ev.target.result;
            content = content.replace(/<\/?(html|head|body|!DOCTYPE)[^>]*>/gi, "");
            document.getElementById("postContent").value = content.trim();
        };
        reader.readAsText(file);
    }
});

window.startEdit = async (id) => {
    // Check if we have it in memory first to save a read
    const post = adminPosts.find(p => p.id === id);
    if (post) {
        fillForm(post);
    } else {
        // Fallback fetch
        const docSnap = await getDoc(doc(db, "blogs", id));
        if (docSnap.exists()) fillForm({id: docSnap.id, ...docSnap.data()});
    }
};

function fillForm(data) {
    document.getElementById("editPostId").value = data.id;
    document.getElementById("postTitle").value = data.title;
    document.getElementById("postCategory").value = data.category;
    document.getElementById("postImage").value = data.image;
    document.getElementById("postContent").value = data.content;
    
    document.getElementById("formTitle").innerText = "Edit Post: " + data.title;
    document.getElementById("submitBtn").innerText = "Update Post";
    document.getElementById("cancelEditBtn").classList.remove("hidden");
    
    // Scroll to form
    document.querySelector('.sidebar').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

function resetForm() {
    blogForm.reset();
    document.getElementById("editPostId").value = "";
    document.getElementById("formTitle").innerText = "Create New Post";
    document.getElementById("submitBtn").innerText = "Publish Post";
    document.getElementById("cancelEditBtn").classList.add("hidden");
}

window.deletePost = async (id) => {
    if (confirm("Are you sure you want to delete this post?")) {
        await deleteDoc(doc(db, "blogs", id));
        loadPosts();
    }
};

// --- 4. Messages Logic (Restored) ---
window.loadMessages = async () => {
    messagesListContainer.innerHTML = "Loading...";
    try {
        const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        messagesListContainer.innerHTML = "";
        if (snapshot.empty) {
            messagesListContainer.innerHTML = "<p style='color:gray'>No messages found.</p>";
            return;
        }

        snapshot.forEach((docSnap) => {
            const msg = docSnap.data();
            const date = msg.timestamp ? msg.timestamp.toDate().toLocaleString() : "Unknown";
            
            const div = document.createElement("div");
            div.className = "msg-card";
            div.innerHTML = `
                <div class="msg-header">
                    <div>
                        <strong>${msg.name}</strong>
                        <div style="font-size:0.9rem; color:var(--accent);">${msg.email}</div>
                    </div>
                    <small style="color:gray">${date}</small>
                </div>
                <p style="color:#cbd5e1; line-height:1.6;">${msg.message}</p>
            `;
            messagesListContainer.appendChild(div);
        });
    } catch (err) {
        messagesListContainer.innerHTML = `<p style="color:red">Error loading messages: ${err.message}</p>`;
    }
};