# Raider Report GitHub Pages Version

## Overview
This README provides instructions for adapting the Raider Report Google Apps Script website to GitHub Pages. This adaptation will ensure compatibility with all devices and browsers, including Instagram, Safari, and Android devices.

## File Structure
- `ind.html` - The main HTML file
- `script.js` - The JavaScript functionality
- `issues.json` - A data file containing information about all issues
- Images folder - Contains all issue covers
- PDFs folder - Contains all PDF files of issues

## Step 1: Create issues.json
Create a file called `issues.json` with the following structure:

```json
{
  "issues": [
    {
      "title": "newspaper-issue-1",
      "description": "First Issue Description",
      "date": "01-15-2023",
      "imageUrl": "images/issue1.jpg",
      "pdfUrl": "pdfs/issue1.pdf",
      "category": "General",
      "featured": true
    },
    {
      "title": "newspaper-issue-2",
      "description": "Second Issue Description",
      "date": "02-15-2023",
      "imageUrl": "images/issue2.jpg",
      "pdfUrl": "pdfs/issue2.pdf",
      "category": "General",
      "featured": false
    }
    // Add more issues as needed
  ]
}
```

## Step 2: Create ind.html
Copy your existing `Index.html` file to `ind.html` and make the following changes:

1. Update meta tags for mobile compatibility:
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="format-detection" content="telephone=no">
```

2. Remove Google Apps Script dependencies:
   - Remove all instances of `google.script.run`
   - Replace with direct JavaScript function calls

3. Update the PDF viewer to use PDF.js instead of Google Drive
```html
<!-- PDF.js Library -->
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/build/pdf.min.js"></script>
<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/build/pdf.worker.min.js';
</script>
```

4. Replace the subscription form with a static form or Formspree:
```html
<form action="https://formspree.io/f/YOUR_FORMSPREE_ID" method="POST">
  <input type="email" name="email" placeholder="Your email address" required>
  <button type="submit">Subscribe</button>
</form>
```

5. Add CSS fixes for Safari and mobile browsers:
```css
/* Safari-specific fixes */
@supports (-webkit-overflow-scrolling: touch) {
  body {
    -webkit-overflow-scrolling: touch;
  }
  .pdf-iframe {
    -webkit-overflow-scrolling: touch;
    overflow-y: scroll;
  }
}

/* Fix for Instagram browser compatibility */
.direct-download-button {
  display: none; /* Show only when needed via JS */
  margin: 20px auto;
  padding: 15px 30px;
  background-color: var(--primary);
  color: white;
  border-radius: 30px;
  text-align: center;
  font-weight: bold;
}
```

6. Add script tag to load script.js:
```html
<script src="script.js"></script>
```

## Step 3: Create script.js
Create a new file called `script.js` with the following key components:

1. Browser detection for Instagram and Safari:
```javascript
function detectBrowsers() {
  const isInstagram = /Instagram/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (isInstagram || isSafari) {
    // Show direct download buttons instead of embedded viewer
    document.querySelectorAll('.pdf-modal-body').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.direct-download-button').forEach(el => {
      el.style.display = 'block';
    });
  }
}

// Call the function when the page loads
window.addEventListener('DOMContentLoaded', detectBrowsers);
```

2. Function to load issues from JSON:
```javascript
async function loadIssues() {
  try {
    const response = await fetch('issues.json');
    const data = await response.json();
    displayIssues(data.issues);
  } catch (error) {
    console.error('Error loading issues:', error);
  }
}
```

3. PDF.js viewer setup:
```javascript
function openPdf(pdfUrl, title) {
  const pdfContainer = document.getElementById('pdfContainer');
  pdfContainer.innerHTML = '';
  
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  loadingTask.promise.then(function(pdf) {
    // Set up the PDF viewer
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      pdf.getPage(pageNum).then(function(page) {
        const canvas = document.createElement('canvas');
        pdfContainer.appendChild(canvas);
        
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
    
    document.getElementById('pdfModalTitle').textContent = title || 'Viewing PDF';
    document.getElementById('pdfModal').classList.add('active');
  }).catch(function(error) {
    console.error('Error loading PDF:', error);
  });
}
```

4. Mobile carousel functionality:
```javascript
let currentSlide = 0;
let slideCount = 0;
let isAnimating = false;

function initCarousel() {
  const carousel = document.getElementById('carouselContainer');
  const slides = carousel.querySelectorAll('.carousel-slide');
  slideCount = slides.length;
  
  // Set initial slide to the first one
  currentSlide = 0;
  
  // Set initial position
  updateCarouselPosition();
  
  // Set active states on slides and dots
  updateActiveSlide();
  
  // Add touch support
  setupTouchSupport();
}

function updateActiveSlide() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  
  slides.forEach((slide, index) => {
    if (index === currentSlide) {
      slide.classList.add('active');
      slide.style.opacity = "1";
    } else {
      slide.classList.remove('active');
      slide.style.opacity = "0.7";
    }
  });
  
  dots.forEach((dot, index) => {
    if (index === currentSlide) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function updateCarouselPosition() {
  const carousel = document.getElementById('carouselContainer');
  const slideWidth = document.querySelector('.carousel-slide').offsetWidth;
  const offset = -currentSlide * slideWidth;
  
  carousel.style.transform = `translateX(${offset}px)`;
}

function moveToSlide(index) {
  if (isAnimating || slideCount <= 1) return;
  
  isAnimating = true;
  
  // Handle circular navigation
  if (index < 0) {
    index = slideCount - 1;
  } else if (index >= slideCount) {
    index = 0;
  }
  
  currentSlide = index;
  updateCarouselPosition();
  updateActiveSlide();
  
  setTimeout(() => {
    isAnimating = false;
  }, 400);
}

function setupTouchSupport() {
  const carousel = document.getElementById('carouselContainer');
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
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swipe left (next)
      moveToSlide(currentSlide + 1);
    } else if (touchEndX > touchStartX + swipeThreshold) {
      // Swipe right (previous)
      moveToSlide(currentSlide - 1);
    }
  }
}
```

5. Initialize the website:
```javascript
document.addEventListener('DOMContentLoaded', function() {
  // Load issues from JSON
  loadIssues();
  
  // Set current year in footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  
  // Remove loading spinner
  setTimeout(function() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.opacity = '0';
    setTimeout(() => {
      spinner.style.display = 'none';
    }, 500);
  }, 1500);
});
```

## Step 4: Host PDFs and Images
1. Create two folders in your GitHub repository:
   - `/images/` - For all issue cover images
   - `/pdfs/` - For all PDF files
   
2. Upload your images and PDFs to these folders.

3. Update your issues.json file with the correct paths to these files.

## Step 5: Deploy to GitHub Pages
1. Upload all files to a GitHub repository
2. Go to repository Settings > Pages
3. Set Source to "main" branch
4. Wait for deployment to complete
5. Your site will be available at https://yourusername.github.io/repositoryname/

## Mobile Compatibility Notes
- Instagram browser: Direct download links are used instead of embedded viewers
- Safari on iOS: Additional CSS fixes applied
- Android: Touch event handling and performance optimizations added
