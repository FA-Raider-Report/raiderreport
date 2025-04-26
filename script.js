// GitHub Pages compatible JavaScript for Raider Report

// Global variables
let allIssues = [];
let currentPdfUrl = '';

// Initialize AOS Animations
document.addEventListener('DOMContentLoaded', function() {
  // Initialize animations
  setTimeout(function() {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true
    });
  }, 500);
  
  // Set current year for footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  
  // Initialize loading spinner
  setTimeout(function() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.opacity = '0';
    setTimeout(() => {
      spinner.style.display = 'none';
    }, 500);
  }, 1500);
  
  // Setup scroll to top button
  setupScrollToTop();
  
  // Setup PDF modal
  setupPdfModal();
  
  // Load issues from JSON
  loadIssues();
  
  // Detect browser for compatibility fixes
  detectBrowserCompatibility();
});

// Detect problematic browsers like Instagram in-app browser and Safari
function detectBrowserCompatibility() {
  const isInstagram = /Instagram/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isFacebookBrowser = /FBAN|FBAV/.test(navigator.userAgent);
  const isOtherAppBrowser = /Twitter|Line|WhatsApp|wv/.test(navigator.userAgent);
  
  if (isInstagram || isSafari || isFacebookBrowser || isOtherAppBrowser) {
    // Hide the PDF iframe container and show direct download button
    document.querySelector('.pdf-iframe').style.display = 'none';
    document.querySelector('.direct-download-button').style.display = 'block';
    
    console.log('Problematic browser detected. Using direct download mode.');
  }
}

// Setup scroll to top button
function setupScrollToTop() {
  const scrollToTopBtn = document.getElementById('scrollToTop');
  
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });
  
  scrollToTopBtn.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Setup PDF modal functionality
function setupPdfModal() {
  const pdfModal = document.getElementById('pdfModal');
  const pdfModalClose = document.getElementById('pdfModalClose');
  const pdfDownloadBtn = document.getElementById('pdfDownloadBtn');
  
  // Close modal when clicking the close button or outside the modal
  pdfModalClose.addEventListener('click', closePdfModal);
  pdfModal.addEventListener('click', function(e) {
    if (e.target === pdfModal) {
      closePdfModal();
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pdfModal.classList.contains('active')) {
      closePdfModal();
    }
  });
  
  // Download PDF
  pdfDownloadBtn.addEventListener('click', function() {
    if (currentPdfUrl) {
      window.open(currentPdfUrl, '_blank');
    }
  });
}

// Load issues from JSON file
async function loadIssues() {
  try {
    const response = await fetch('issues.json');
    const data = await response.json();
    
    if (data && data.issues) {
      allIssues = data.issues;
      displayIssues(allIssues);
    } else {
      console.error('Invalid issues data format');
    }
  } catch (error) {
    console.error('Error loading issues:', error);
    // Fallback to display error message
    document.getElementById('issuesGrid').innerHTML = '<p style="text-align:center;color:red;">Error loading issues. Please try again later.</p>';
  }
}

// Process and display issues
function displayIssues(issues) {
  // Early exit if no issues
  if (!issues || issues.length === 0) {
    document.getElementById('issuesGrid').innerHTML = '<p class="no-issues">No issues found.</p>';
    return;
  }
  
  // Extract categories for filter tabs, excluding "General"
  const categories = [];
  issues.forEach(issue => {
    if (issue.category && issue.category !== "General" && !categories.includes(issue.category)) {
      categories.push(issue.category);
    }
  });
  
  // Populate category tabs only if we have meaningful categories
  const categoryTabsEl = document.getElementById('categoryTabs');
  categoryTabsEl.innerHTML = '';
  
  if (categories.length > 0) {
    categoryTabsEl.innerHTML = '<div class="category-tab active" data-category="all">All Issues</div>';
    
    categories.forEach(category => {
      categoryTabsEl.innerHTML += `<div class="category-tab" data-category="${category}">${category}</div>`;
    });
    
    // Add event listeners to category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Filter issues by category
        const category = this.getAttribute('data-category');
        filterIssuesByCategory(issues, category);
      });
    });
  } else {
    // Hide the category tabs container if we don't have meaningful categories
    categoryTabsEl.style.display = 'none';
  }
  
  // Display the featured issue (first issue or one marked as featured)
  const featuredIssue = issues.find(issue => issue.featured) || issues[0];
  displayFeaturedIssue(featuredIssue);
  
  // Display all issues (excluding the featured one)
  filterIssuesByCategory(issues, 'all');
}

// Display featured issue
function displayFeaturedIssue(issue) {
  const featuredIssueEl = document.getElementById('featuredIssue');
  
  featuredIssueEl.innerHTML = `
    <div class="featured-issue" data-aos="fade-up">
      <div class="featured-image">
        <img src="${issue.imageUrl}" alt="${issue.title}">
        <div class="featured-badge">Latest Issue</div>
      </div>
      <div class="featured-content">
        <div class="featured-date">${issue.date}</div>
        <h3 class="featured-title">${issue.description}</h3>
        <p class="featured-description">Check out our latest issue of the Raider Report, featuring school news, sports updates, and student achievements.</p>
        <a href="#" class="btn" onclick="handleIssueClick(event, '${issue.pdfUrl}', '${issue.title}')">Read Full Issue</a>
      </div>
    </div>
  `;
}

// Filter issues by category
function filterIssuesByCategory(issues, category) {
  const issuesGridEl = document.getElementById('issuesGrid');
  const carouselContainerEl = document.getElementById('carouselContainer');
  const carouselDotsEl = document.getElementById('carouselDots');
  
  // Debug logs
  console.log("Filtering issues for category:", category);
  console.log("Number of issues:", issues.length);
  
  issuesGridEl.innerHTML = '';
  carouselContainerEl.innerHTML = '';
  carouselDotsEl.innerHTML = '';
  
  // Get featured issue to exclude from the grid
  const featuredIssue = issues.find(issue => issue.featured) || issues[0];
  
  // Filter and display issues
  const filteredIssues = issues.filter(issue => {
    return (category === 'all' || issue.category === category) && issue.title !== featuredIssue.title;
  });
  
  // Debug log
  console.log("Filtered issues count:", filteredIssues.length);
  
  if (filteredIssues.length === 0) {
    issuesGridEl.innerHTML = '<p class="no-issues">No issues found in this category.</p>';
    return;
  }
  
  // Calculate date for "new" badge (issues in the last 14 days)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  // Populate regular grid view
  filteredIssues.forEach((issue, index) => {
    const card = document.createElement('div');
    card.className = 'issue-card';
    card.style.animationDelay = `${0.1 * (index % 6)}s`;
    
    // Check if issue is recent to show "NEW" badge
    const issueDate = new Date(issue.date);
    const isNew = issueDate > twoWeeksAgo;
    
    // Build the card HTML
    let cardHTML = `
      <a href="#" style="text-decoration: none; color: inherit;" onclick="handleIssueClick(event, '${issue.pdfUrl}', '${issue.title}')">
        <div class="issue-image">
          <img src="${issue.imageUrl}" alt="${issue.title}">
          ${isNew ? '<div class="new-badge">NEW</div>' : ''}
          <div class="issue-date">${issue.date}</div>
        </div>
        <div class="issue-content">
          <h4 class="issue-title">${issue.description}</h4>
          <div class="issue-footer">
            <span class="read-more">Read More <i class="fas fa-arrow-right"></i></span>
          </div>
        </div>
      </a>
    `;
    
    card.innerHTML = cardHTML;
    issuesGridEl.appendChild(card);
  });
  
  // Populate mobile carousel view with all issues to enable circular navigation
  filteredIssues.forEach((issue, index) => {
    // Create carousel slide
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.setAttribute('data-index', index);
    
    // Check if issue is recent to show "NEW" badge
    const issueDate = new Date(issue.date);
    const isNew = issueDate > twoWeeksAgo;
    
    // Build the slide HTML with explicit image handling
    slide.innerHTML = `
      <div class="issue-card">
        <a href="#" style="text-decoration: none; color: inherit;" onclick="handleIssueClick(event, '${issue.pdfUrl}', '${issue.title}')">
          <div class="issue-image">
            <img src="${issue.imageUrl}" 
                alt="${issue.title || 'Issue image'}" 
                onerror="this.src='images/placeholder.jpg'; console.error('Failed to load image');">
            ${isNew ? '<div class="new-badge">NEW</div>' : ''}
            <div class="issue-date">${issue.date}</div>
          </div>
          <div class="issue-content">
            <h4 class="issue-title">${issue.description || issue.title}</h4>
            <div class="issue-footer">
              <span class="read-more">Read More <i class="fas fa-arrow-right"></i></span>
            </div>
          </div>
        </a>
      </div>
    `;
    
    carouselContainerEl.appendChild(slide);
    
    // Create dot for this slide
    const dot = document.createElement('div');
    dot.className = 'carousel-dot';
    dot.setAttribute('data-index', index);
    dot.addEventListener('click', function() {
      moveToSlide(parseInt(this.getAttribute('data-index')));
    });
    
    carouselDotsEl.appendChild(dot);
  });
  
  // Initialize carousel
  initCarousel();
}

// Track Issue Clicks (for analytics - in GitHub we just log to console)
function logClick(issueTitle) {
  console.log(`Clicked on issue: ${issueTitle}`);
  // In a real implementation, you could track clicks using Google Analytics or similar
}

// Mobile detection
function isMobileDevice() {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

// Handle issue clicks
function handleIssueClick(event, pdfUrl, title) {
  event.preventDefault();
  logClick(title);
  
  // Store current PDF URL for download button
  currentPdfUrl = pdfUrl;
  
  // Update direct download link
  const directLink = document.getElementById('directPdfLink');
  if (directLink) {
    directLink.href = pdfUrl;
    directLink.download = title + '.pdf';
  }
  
  // If coming from Instagram or other apps that have their own browser, go directly to PDF
  if (isMobileDevice() && (document.referrer.includes('instagram') || 
      /FBAN|FBAV|Twitter|Line|WhatsApp|wv/.test(navigator.userAgent))) {
    window.location.href = pdfUrl;
  } else {
    // Otherwise open in our modal
    openPdfModal(pdfUrl, title);
  }
}

// Open PDF modal
function openPdfModal(pdfUrl, title) {
  // Prevent scrolling of the body when modal is open
  document.body.style.overflow = 'hidden';
  
  // Get elements
  const pdfContainer = document.getElementById('pdfContainer');
  const pdfModalTitle = document.getElementById('pdfModalTitle');
  const pdfModal = document.getElementById('pdfModal');
  
  // Clear previous content
  pdfContainer.innerHTML = '<div class="spinner"></div>';
  
  // Set title
  pdfModalTitle.textContent = title || 'Viewing PDF';
  
  // Show modal
  pdfModal.classList.add('active');
  
  // Check if browser is Safari or Instagram browser
  if (/Instagram/.test(navigator.userAgent) || 
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /FBAN|FBAV|Twitter|Line|WhatsApp|wv/.test(navigator.userAgent)) {
    
    // Show direct download button instead of embedded viewer
    pdfContainer.style.display = 'none';
    document.querySelector('.direct-download-button').style.display = 'block';
    return;
  }
  
  // Load PDF using PDF.js
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  loadingTask.promise.then(function(pdf) {
    pdfContainer.innerHTML = '';
    
    // Set up the PDF viewer
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 5); pageNum++) {
      pdf.getPage(pageNum).then(function(page) {
        const canvas = document.createElement('canvas');
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.appendChild(canvas);
        pdfContainer.appendChild(pageContainer);
        
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.5 });
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page into canvas context
        page.render({
          canvasContext: context,
          viewport: viewport
        });
      });
    }
    
    // Add message if there are more pages
    if (pdf.numPages > 5) {
      const morePages = document.createElement('div');
      morePages.className = 'more-pages-message';
      morePages.innerHTML = `
        <p>Only showing first 5 pages. Download the PDF to view all ${pdf.numPages} pages.</p>
        <button id="downloadFullPdf" class="btn">Download Full PDF</button>
      `;
      pdfContainer.appendChild(morePages);
      
      // Add click handler to download button
      document.getElementById('downloadFullPdf').addEventListener('click', function() {
        window.open(pdfUrl, '_blank');
      });
    }
  }).catch(function(error) {
    console.error('Error loading PDF:', error);
    pdfContainer.innerHTML = `
      <div class="pdf-error">
        <p>Error loading PDF. Please try downloading it instead.</p>
        <button onclick="window.open('${pdfUrl}', '_blank')" class="btn">Download PDF</button>
      </div>
    `;
  });
}

// Close PDF modal
function closePdfModal() {
  const pdfModal = document.getElementById('pdfModal');
  pdfModal.classList.remove('active');
  // Restore scrolling
  document.body.style.overflow = '';
  // Reset containers
  setTimeout(() => {
    document.getElementById('pdfContainer').innerHTML = '';
    currentPdfUrl = '';
  }, 300);
}

// Initialize the mobile carousel
let currentSlide = 0;
let slideCount = 0;
let isAnimating = false;

function initCarousel() {
  const carousel = document.getElementById('carouselContainer');
  const slides = carousel.querySelectorAll('.carousel-slide');
  slideCount = slides.length;
  
  console.log("Initializing carousel with", slideCount, "slides");
  
  if (slideCount <= 1) {
    console.log("Not enough slides to initialize carousel");
    return;
  }
  
  // Set initial slide to the first one
  currentSlide = 0;
  console.log("Setting initial slide to", currentSlide);
  
  // Set initial position
  updateCarouselPosition();
  
  // Force visibility on all slides to debug
  slides.forEach((slide, index) => {
    // Make sure all slides are at least partially visible for debugging
    slide.style.opacity = "0.7";
    
    if (index === currentSlide) {
      slide.classList.add('active');
      slide.style.opacity = "1";
    } else {
      slide.classList.remove('active');
    }
  });
  
  // Set active class on initial dot
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, index) => {
    if (index === currentSlide) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
  
  // Add event listeners for navigation
  document.getElementById('carouselPrev').addEventListener('click', function() {
    if (isAnimating) return;
    moveToSlide(currentSlide - 1);
  });
  
  document.getElementById('carouselNext').addEventListener('click', function() {
    if (isAnimating) return;
    moveToSlide(currentSlide + 1);
  });
  
  // Add touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  
  carousel.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  carousel.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const swipeThreshold = 50; // Minimum distance for swipe
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swipe left (next)
      if (isAnimating) return;
      moveToSlide(currentSlide + 1);
    } else if (touchEndX > touchStartX + swipeThreshold) {
      // Swipe right (previous)
      if (isAnimating) return;
      moveToSlide(currentSlide - 1);
    }
  }
}

function moveToSlide(index) {
  if (slideCount <= 1) return; // Don't move if there's only 1 or 0 slides
  
  // Handle circular navigation
  if (index < 0) {
    index = slideCount - 1;
  } else if (index >= slideCount) {
    index = 0;
  }
  
  // Set animating flag
  isAnimating = true;
  
  // Update current slide index
  currentSlide = index;
  
  // Update carousel position
  updateCarouselPosition();
  
  // Update active classes on slides and dots
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  
  slides.forEach(slide => slide.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));
  
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  
  // Reset animating flag after transition completes
  setTimeout(() => {
    isAnimating = false;
  }, 400); // Match to CSS transition time
}

function updateCarouselPosition() {
  const carousel = document.getElementById('carouselContainer');
  const slideWidth = document.querySelector('.carousel-slide').offsetWidth;
  
  // Simple calculation for a standard carousel - each slide takes full width
  const offset = -currentSlide * slideWidth;
  
  carousel.style.transform = `translateX(${offset}px)`;
}
