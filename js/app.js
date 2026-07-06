(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};

  function assetUrl(path) {
    if (!path) return path;
    return path.split("/").map(encodeURIComponent).join("/");
  }

  // Mobile navigation
  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector(".main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });
    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => mainNav.classList.remove("open"));
    });
  }

  // Active nav link
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (
      href === currentPage ||
      (currentPage === "" && href === "index.html")
    ) {
      link.classList.add("active");
    }
  });

  // Portfolio sidebar active link on scroll
  const portfolioSections = document.querySelectorAll(".portfolio-section[id]");
  const portfolioNavLinks = document.querySelectorAll(".portfolio-nav a");

  if (portfolioSections.length && portfolioNavLinks.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            portfolioNavLinks.forEach((link) => {
              link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + entry.target.id
              );
            });
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    portfolioSections.forEach((section) => observer.observe(section));
  }

  // Materials page: search and filter
  const materialsList = document.getElementById("materials-list");
  if (materialsList && window.MATERIALS) {
    const searchInput = document.getElementById("materials-search");
    const filterContainer = document.getElementById("materials-filters");
    const sectionLinks = document.querySelectorAll(".materials-section-link");
    const countEl = document.getElementById("materials-count");
    const pageHeader = document.querySelector(".page-header p");

    const SECTION_ORDER = ["kom", "methods", "programs", "archive"];
    const SECTION_SUBTITLES = {
      kom: "КИМ, КОС и ФОС по учебным дисциплинам",
      methods: "Методические разработки, пособия и самостоятельная работа",
      programs: "Рабочие программы по дисциплинам и воспитательной работе",
      archive: "Архивные материалы",
    };
    const SECTION_FILTERS = {
      kom: ["КИМ", "КОС", "ФОС"],
      methods: ["МР", "СР", "УП", "Статья"],
      programs: ["РП"],
      archive: ["УМК"],
    };

    function getSectionFromHash() {
      const hash = window.location.hash.slice(1);
      return SECTION_ORDER.includes(hash) ? hash : "methods";
    }

    let activeCategory = "all";
    let activeSection = getSectionFromHash();

    function getCategoryClass(category) {
      const map = {
        КИМ: "badge-kim",
        КОС: "badge-kos",
        ФОС: "badge-fos",
        МР: "badge-methods",
        СР: "badge-sr",
        УП: "badge-up",
        РП: "badge-rp",
        Статья: "badge-article",
        УМК: "badge-umk",
      };
      return map[category] || "badge-default";
    }

    function getFileIcon(material) {
      const url = material.downloads?.[0]?.url?.toLowerCase() || "";
      if (url.endsWith(".docx") || url.endsWith(".doc")) return "📘";
      return "📄";
    }

    function renderFilters() {
      if (!filterContainer) return;
      const categories = SECTION_FILTERS[activeSection] || [];
      filterContainer.innerHTML = [
        '<button class="filter-tag active" data-category="all">Все</button>',
        ...categories.map(
          (cat) =>
            `<button class="filter-tag" data-category="${cat}">${cat}</button>`
        ),
      ].join("");

      filterContainer.querySelectorAll(".filter-tag").forEach((tag) => {
        tag.addEventListener("click", () => {
          filterContainer.querySelectorAll(".filter-tag").forEach((t) => {
            t.classList.remove("active");
          });
          tag.classList.add("active");
          activeCategory = tag.dataset.category || "all";
          filterMaterials();
        });
      });
    }

    function updateSectionUI() {
      sectionLinks.forEach((link) => {
        const isActive = link.dataset.section === activeSection;
        link.classList.toggle("active", isActive);
      });

      if (pageHeader) {
        pageHeader.textContent =
          SECTION_SUBTITLES[activeSection] || SECTION_SUBTITLES.methods;
      }
    }

    function renderMaterials(items) {
      if (!items.length) {
        materialsList.innerHTML =
          '<div class="no-results"><p>Материалы не найдены. Попробуйте изменить запрос или фильтр.</p></div>';
        if (countEl) countEl.textContent = "Найдено: 0";
        return;
      }

      materialsList.innerHTML = items
        .map((m) => {
          const download = m.downloads?.[0];
          if (!download) return "";

          const fileUrl = assetUrl(download.url);
          const downloadBtns = m.downloads
            .map(
              (d) =>
                `<a href="${assetUrl(d.url)}" class="btn btn-primary btn-sm" download>${d.label}</a>`
            )
            .join("");

          return `
          <article class="material-card" data-category="${m.category}">
            <div class="material-icon">${getFileIcon(m)}</div>
            <div class="material-body">
              <h3><a href="${fileUrl}" download>${m.title}</a></h3>
              ${m.description ? `<p class="material-desc">${m.description}</p>` : ""}
              <div class="material-meta">
                <span class="badge ${getCategoryClass(m.category)}">${m.category}</span>
                <span>📅 ${m.date}</span>
              </div>
            </div>
            <div class="material-actions">
              ${downloadBtns}
            </div>
          </article>`;
        })
        .filter(Boolean)
        .join("");

      if (countEl) countEl.textContent = `Найдено: ${items.length}`;
    }

    function filterMaterials() {
      const query = (searchInput?.value || "").toLowerCase().trim();
      let filtered = window.MATERIALS.filter(
        (m) => m.section === activeSection && m.downloads?.length
      );

      if (activeCategory !== "all") {
        filtered = filtered.filter((m) => m.category === activeCategory);
      }

      if (query) {
        filtered = filtered.filter(
          (m) =>
            m.title.toLowerCase().includes(query) ||
            m.description.toLowerCase().includes(query) ||
            m.category.toLowerCase().includes(query)
        );
      }

      renderMaterials(filtered);
    }

    function switchSection(section) {
      activeSection = section;
      activeCategory = "all";
      if (searchInput) searchInput.value = "";
      history.replaceState(
        null,
        "",
        section === "methods" ? "materials.html" : `materials.html#${section}`
      );
      updateSectionUI();
      renderFilters();
      filterMaterials();
    }

    sectionLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        switchSection(link.dataset.section || "methods");
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", filterMaterials);
    }

    window.addEventListener("hashchange", () => {
      switchSection(getSectionFromHash());
    });

    updateSectionUI();
    renderFilters();
    filterMaterials();
  }

  // Quizzes page
  const quizGrid = document.getElementById("quiz-grid");
  if (quizGrid && window.QUIZZES) {
    quizGrid.innerHTML = window.QUIZZES.map(
      (q) => `
      <a href="${q.href}" class="quiz-card" target="_blank" rel="noopener noreferrer">
        <div class="quiz-card-badge">${q.badge}</div>
        <h2>${q.title}</h2>
        <p>${q.description}</p>
        <span class="quiz-card-action">Перейти к викторине →</span>
      </a>`
    ).join("");
  }

  // Certificates on about page
  const certificatesGrid = document.getElementById("certificates-grid");
  if (certificatesGrid && window.CERTIFICATES) {
    certificatesGrid.innerHTML = [...window.CERTIFICATES]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .map((cert) => {
        const url = assetUrl(cert.file);

        return `
        <a href="${url}" class="certificate-card" target="_blank" rel="noopener">
          <img src="${url}" alt="" class="certificate-preview" loading="lazy" />
          <span class="certificate-title">${cert.title}</span>
          <span class="certificate-action">Открыть</span>
        </a>`;
      })
      .join("");
  }

  // Feedback: email link
  const mailLink = document.getElementById("feedback-mail-link");
  const emailText = document.getElementById("feedback-email");
  if (config.contactEmail) {
    if (emailText) emailText.textContent = config.contactEmail;
    if (mailLink) {
      const subject = encodeURIComponent("Вопрос преподавателю");
      mailLink.href = `mailto:${config.contactEmail}?subject=${subject}`;
    }
  }

  // Home page: recent materials
  const recentMaterials = document.getElementById("recent-materials");
  if (recentMaterials && window.MATERIALS) {
    const recent = window.MATERIALS.filter(
      (m) => m.section !== "archive" && m.downloads?.length
    )
      .slice()
      .sort((a, b) => {
        const [da, ma, ya] = a.date.split(".").map(Number);
        const [db, mb, yb] = b.date.split(".").map(Number);
        return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
      })
      .slice(0, 3);
    recentMaterials.innerHTML = recent
      .map(
        (m) => `
      <div class="card">
        <div class="card-icon">📄</div>
        <h3>${m.title.length > 80 ? m.title.slice(0, 80) + "…" : m.title}</h3>
        <p>${m.description || m.category}</p>
        <a href="materials.html" class="btn btn-primary btn-sm" style="margin-top:0.75rem">Подробнее →</a>
      </div>`
      )
      .join("");
  }

  // Home page stats
  const materialsCount = document.getElementById("stat-materials");
  if (materialsCount && window.MATERIALS) {
    materialsCount.textContent = window.MATERIALS.filter(
      (m) => m.section !== "archive" && m.downloads?.length
    ).length;
  }

  const quizzesCount = document.getElementById("stat-quizzes");
  if (quizzesCount && window.QUIZZES) {
    quizzesCount.textContent = window.QUIZZES.length;
  }
})();
