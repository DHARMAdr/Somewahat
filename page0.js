/**
 * ============================================================
 * page0.js — @iamlazydanger Gaming Blog Logic
 * ============================================================
 * PURPOSE: Powers the landing page. Handles:
 *  1. Rendering blog posts from a data array
 *  2. Live search filtering
 *  3. Category pill filtering
 *  4. Profile modal open/close
 *  5. Chat widget open/close + EmailJS-ready send logic
 *
 * WHY DATA-DRIVEN POSTS: Storing posts in a JS array (not hardcoded
 * HTML) means anyone can add/edit/remove blog posts by just editing
 * the `posts` array below — no HTML knowledge required.
 *
 * IMPROVEMENT IDEAS:
 * - Move `posts` array to a separate JSON file fetched via fetch()
 * - Add pagination or "load more" for 20+ posts
 * - Persist search/filter state in the URL (query params)
 * ============================================================
 */

(function () {
  "use strict";

  // ─── CONFIG: IMAGE LINKS ───────────────────────────────────
  /**
   * IMAGE_LINKS: Central place to manage external image URLs.
   * WHY: Easy for the client to swap in real photos later without
   * digging through code — just replace the URL string here.
   */
  const IMAGE_LINKS = {
    profilePicture: "", // e.g. "https://i.imgur.com/yourimage.jpg" — leave blank to use SVG initial
  };

  // ─── DATA: BLOG POSTS ──────────────────────────────────────
  /**
   * posts: Array of blog post objects.
   * Each post has: id, title, excerpt, category, emoji (thumbnail
   * placeholder), date, readTime.
   *
   * HOW TO ADD A POST: Copy an existing object, change the values,
   * make sure `id` is unique.
   */
  const posts = [
    {
      id: 1,
      title: "Top 5 Budget GPUs That Actually Run 2026 Titles",
      excerpt: "You don't need a $2000 card to hit 1440p at 100fps. Here's what actually delivers.",
      category: "hardware",
      emoji: "🎮",
      date: "Jun 24, 2026",
      readTime: "6 min",
    },
    {
      id: 2,
      title: "Beginner's Guide to Competitive FPS Aim Training",
      excerpt: "Stop blaming your mouse. These drills fixed my aim in three weeks flat.",
      category: "guide",
      emoji: "🎯",
      date: "Jun 20, 2026",
      readTime: "9 min",
    },
    {
      id: 3,
      title: "Review: The New Mechanical Keyboard Everyone's Talking About",
      excerpt: "Hot-swappable switches, silent typing, and a price that doesn't hurt.",
      category: "review",
      emoji: "⌨️",
      date: "Jun 15, 2026",
      readTime: "5 min",
    },
    {
      id: 4,
      title: "5 Settings You're Probably Getting Wrong",
      excerpt: "Sensitivity, FOV, and frame caps — small tweaks, massive difference.",
      category: "tips",
      emoji: "⚙️",
      date: "Jun 10, 2026",
      readTime: "4 min",
    },
    {
      id: 5,
      title: "Monitor Refresh Rates Explained: 144Hz vs 240Hz vs 360Hz",
      excerpt: "Is the upgrade actually worth it, or just marketing? We tested all three.",
      category: "guide",
      emoji: "🖥️",
      date: "Jun 5, 2026",
      readTime: "7 min",
    },
    {
      id: 6,
      title: "Review: This Headset Has the Best Mic I've Ever Used",
      excerpt: "Crystal clear comms and surprisingly good bass for the price point.",
      category: "review",
      emoji: "🎧",
      date: "Jun 1, 2026",
      readTime: "5 min",
    },
  ];

  // ─── DOM REFERENCES ────────────────────────────────────────
  // Caching DOM lookups in variables avoids repeated document.getElementById calls
  const postsGrid = document.getElementById("postsGrid");
  const noResults = document.getElementById("noResults");
  const searchInput = document.getElementById("searchInput");
  const filterPills = document.querySelectorAll(".pill");

  const profileIconBtn = document.getElementById("profileIconBtn");
  const profileModalOverlay = document.getElementById("profileModalOverlay");
  const modalClose = document.getElementById("modalClose");

  const chatBubble = document.getElementById("chatBubble");
  const chatPanel = document.getElementById("chatPanel");
  const chatClose = document.getElementById("chatClose");
  const chatSend = document.getElementById("chatSend");
  const chatName = document.getElementById("chatName");
  const chatMessage = document.getElementById("chatMessage");
  const chatStatus = document.getElementById("chatStatus");

  // ─── STATE ─────────────────────────────────────────────────
  let currentFilter = "all"; // which category pill is active
  let currentSearch = "";    // current search text (lowercased)

  // ─── RENDER POSTS ──────────────────────────────────────────

  /**
   * renderPosts()
   * Filters the `posts` array based on currentFilter + currentSearch,
   * then builds and injects the HTML for each matching post card.
   *
   * WHY REBUILD EVERY TIME: Simpler than diffing the DOM manually.
   * For 6-20 posts, full re-render is instant and not a performance issue.
   */
  function renderPosts() {
    // Step 1: Filter by category
    let filtered = posts.filter((post) => {
      const matchesCategory = currentFilter === "all" || post.category === currentFilter;
      const matchesSearch =
        post.title.toLowerCase().includes(currentSearch) ||
        post.excerpt.toLowerCase().includes(currentSearch);
      return matchesCategory && matchesSearch;
    });

    // Step 2: Show "no results" message if nothing matches
    if (filtered.length === 0) {
      postsGrid.innerHTML = "";
      noResults.style.display = "block";
      return;
    }
    noResults.style.display = "none";

    // Step 3: Build HTML for each post card
    // WHY map().join(""): Faster than repeated string concatenation in a loop
    postsGrid.innerHTML = filtered
      .map(
        (post) => `
      <a href="#" class="post-card" data-id="${post.id}">
        <div class="post-thumb-placeholder" style="background:${getCategoryGradient(post.category)}">
          ${post.emoji}
        </div>
        <div class="post-body">
          <span class="post-tag tag-${post.category}">${post.category}</span>
          <h3 class="post-title">${escapeHtml(post.title)}</h3>
          <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
          <div class="post-meta">
            <span>${post.date}</span>
            <span class="post-read-time">${post.readTime} read</span>
          </div>
        </div>
      </a>
    `
      )
      .join("");
  }

  /**
   * getCategoryGradient(category)
   * Returns a CSS gradient string matching each category's accent color.
   * WHY: Gives each thumbnail placeholder a unique, on-brand color
   * instead of one flat gray box for every post.
   */
  function getCategoryGradient(category) {
    const gradients = {
      review: "linear-gradient(135deg, #2a0a14, #1a0508)",
      guide: "linear-gradient(135deg, #062a30, #041820)",
      tips: "linear-gradient(135deg, #1f0a30, #140520)",
      hardware: "linear-gradient(135deg, #2a2206, #1a1504)",
    };
    return gradients[category] || "linear-gradient(135deg, #1a1a2e, #16213e)";
  }

  /**
   * escapeHtml(str)
   * Prevents HTML/script injection from post content.
   * WHY: Even though our post data is hardcoded and trusted right now,
   * this is a good security habit if posts ever come from user input
   * or an external CMS in the future.
   */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── SEARCH HANDLING ───────────────────────────────────────

  /**
   * Listens for input events on the search box.
   * 'input' fires on every keystroke (unlike 'change' which waits for blur).
   * WHY 'input': Gives the live/instant filtering feel we want.
   */
  searchInput.addEventListener("input", function (e) {
    currentSearch = e.target.value.toLowerCase().trim();
    renderPosts();
  });

  // ─── FILTER PILL HANDLING ──────────────────────────────────

  filterPills.forEach((pill) => {
    pill.addEventListener("click", function () {
      // Remove 'active' class from all pills, add to the clicked one
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      currentFilter = pill.dataset.filter; // read data-filter="..." attribute
      renderPosts();
    });
  });

  // ─── PROFILE MODAL HANDLING ────────────────────────────────

  /**
   * openProfileModal() / closeProfileModal()
   * Toggle the 'open' class which CSS uses to show/hide the overlay.
   */
  function openProfileModal() {
    profileModalOverlay.classList.add("open");
    profileModalOverlay.setAttribute("aria-hidden", "false");
  }

  function closeProfileModal() {
    profileModalOverlay.classList.remove("open");
    profileModalOverlay.setAttribute("aria-hidden", "true");
  }

  profileIconBtn.addEventListener("click", openProfileModal);
  modalClose.addEventListener("click", closeProfileModal);

  // Close modal when clicking the dark overlay (outside the modal box)
  profileModalOverlay.addEventListener("click", function (e) {
    if (e.target === profileModalOverlay) closeProfileModal();
  });

  // Close modal with the Escape key for accessibility
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeProfileModal();
  });

  // If a real profile image URL was provided, swap it in
  if (IMAGE_LINKS.profilePicture) {
    const modalAvatar = document.querySelector(".modal-avatar");
    modalAvatar.innerHTML = `<img src="${IMAGE_LINKS.profilePicture}" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
  }

  // ─── CHAT WIDGET HANDLING ──────────────────────────────────

  chatBubble.addEventListener("click", function () {
    chatPanel.classList.toggle("open");
    const isOpen = chatPanel.classList.contains("open");
    chatPanel.setAttribute("aria-hidden", String(!isOpen));
  });

  chatClose.addEventListener("click", function () {
    chatPanel.classList.remove("open");
    chatPanel.setAttribute("aria-hidden", "true");
  });

  /**
   * chatSend click handler
   * Currently a placeholder — shows a status message.
   * EmailJS INTEGRATION: Once you sign up at emailjs.com, replace
   * the body of this function with:
   *
   *   emailjs.send("YOUR_EMAILJS_SERVICE_ID", "YOUR_EMAILJS_TEMPLATE_ID", {
   *     from_name: chatName.value,
   *     message: chatMessage.value,
   *   }, "YOUR_EMAILJS_PUBLIC_KEY")
   *   .then(() => { chatStatus.textContent = "Message sent!"; })
   *   .catch(() => { chatStatus.textContent = "Failed to send. Try again."; });
   *
   * You'll also need to add this script tag to page0.html <head>:
   *   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
   * and call emailjs.init("YOUR_PUBLIC_KEY") once on page load.
   */
  chatSend.addEventListener("click", function () {
    const name = chatName.value.trim();
    const message = chatMessage.value.trim();

    if (!name || !message) {
      chatStatus.textContent = "Please fill in both fields.";
      chatStatus.style.color = "#ff4444";
      return;
    }

    // Placeholder behavior until EmailJS is configured (see comment above)
    chatStatus.textContent = "Message saved locally (EmailJS not yet configured).";
    chatStatus.style.color = "var(--accent-cyan)";

    // Clear the fields after "sending"
    chatName.value = "";
    chatMessage.value = "";
  });

  // ─── INITIAL RENDER ────────────────────────────────────────
  renderPosts();
})();
