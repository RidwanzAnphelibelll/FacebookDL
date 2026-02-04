const API_BASE_URL = 'https://api-facebook-rscoders.vercel.app/';

window.addEventListener('load', function() {
    setTimeout(function() {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(function() {
            document.getElementById('loading').style.display = 'none';
        }, 500);
    }, 1000);
});

const observeElements = () => {
    const featureCards = document.querySelectorAll('.feature-card');
    const stepCards = document.querySelectorAll('.step-card');
    
    if (!('IntersectionObserver' in window)) {
        featureCards.forEach(card => card.classList.add('visible'));
        stepCards.forEach(card => card.classList.add('visible'));
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    featureCards.forEach(card => observer.observe(card));
    stepCards.forEach(card => observer.observe(card));
};

async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        const input = document.getElementById('facebook-url');
        input.value = text.trim();
        input.classList.add('paste-effect');
        setTimeout(() => input.classList.remove('paste-effect'), 800);
        updateInputIcon();
        input.focus();
    } catch (err) {
        showError('Failed to read clipboard. Please paste manually.');
    }
}

function updateInputIcon() {
    const input = document.getElementById('facebook-url');
    const pasteBtn = document.getElementById('paste-btn');
    const icon = pasteBtn.querySelector('i');
    
    if (input.value.trim()) {
        icon.className = 'fas fa-times';
        pasteBtn.setAttribute('title', 'Clear URL');
        pasteBtn.setAttribute('aria-label', 'Clear URL');
    } else {
        icon.className = 'fas fa-paste';
        pasteBtn.setAttribute('title', 'Paste from clipboard');
        pasteBtn.setAttribute('aria-label', 'Paste URL');
    }
}

function handleIconClick() {
    const input = document.getElementById('facebook-url');
    
    if (input.value.trim()) {
        clearInput();
    } else {
        pasteFromClipboard();
    }
}

function isValidFacebookURL(url) {
    const pattern = /^https:\/\/.*facebook\.com\/.+/;
    return pattern.test(url);
}

function clearInput() {
    const input = document.getElementById('facebook-url');
    const errorMessage = document.getElementById('error-message');
    const resultContainer = document.getElementById('result-container');
    const noResultContainer = document.getElementById('no-result-container');
    const downloadSection = document.querySelector('.download-section');
    const featuresSection = document.querySelector('.features-section');
    const howToSection = document.querySelector('.how-to-section');
    
    input.value = '';
    errorMessage.classList.remove('active');
    resultContainer.style.display = 'none';
    if (noResultContainer) {
        noResultContainer.style.display = 'none';
    }
    downloadSection.style.display = 'block';
    featuresSection.classList.remove('hidden');
    howToSection.classList.remove('hidden');
    updateInputIcon();
    input.focus();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleDownload() {
    const input = document.getElementById('facebook-url');
    let url = input.value.trim();
    
    if (!url) {
        showError('Please enter a Facebook URL!');
        return;
    }
    
    if (!isValidFacebookURL(url)) {
        showError('Invalid Facebook URL! Please enter a valid Facebook link.');
        return;
    }
    
    getFacebookData(url);
}

function getFacebookData(url) {
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const resultContainer = document.getElementById('result-container');
    const noResultContainer = document.getElementById('no-result-container');
    
    loader.classList.add('active');
    errorMessage.classList.remove('active');
    resultContainer.style.display = 'none';
    if (noResultContainer) {
        noResultContainer.style.display = 'none';
    }
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', API_BASE_URL + 'api/download?url=' + encodeURIComponent(url), true);
    
    xhr.onload = function() {
        loader.classList.remove('active');
        
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.responseText);
                
                if (response.status && response.result) {
                    displayResult(response.result);
                } else {
                    showNoResult('Please check your Facebook link!');
                }
            } catch (e) {
                showNoResult('Failed to parse response data!');
            }
        }
    };
    
    xhr.onerror = function() {
        loader.classList.remove('active');
        showNoResult('Network error occurred. Please check your connection.');
    };
    
    xhr.send();
}

function displayResult(data) {
    const resultContainer = document.getElementById('result-container');
    const noResultContainer = document.getElementById('no-result-container');
    const downloadSection = document.querySelector('.download-section');
    const featuresSection = document.querySelector('.features-section');
    const howToSection = document.querySelector('.how-to-section');
    
    if (noResultContainer) {
        noResultContainer.style.display = 'none';
    }
    
    downloadSection.style.display = 'none';
    featuresSection.classList.add('hidden');
    howToSection.classList.add('hidden');
    
    let resultHTML = '<div class="result-content">';
    
    if (data.thumbnail) {
        resultHTML += `
            <div class="video-preview">
                <div class="video-thumbnail-container">
                    <img src="${data.thumbnail}" alt="Video Thumbnail" />
                    ${data.duration ? `<span class="video-duration-badge">${data.duration}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    resultHTML += `
        <div class="download-options">
            <h3><i class="fas fa-download"></i> Download Options</h3>
            <div class="options-grid">
    `;
    
    data.downloads.forEach(download => {
        const qualityClass = download.quality.toLowerCase();
        const sizeDisplay = download.size ? `<span class="file-size"><i class="fas fa-hdd"></i> ${download.size}</span>` : '';
        
        resultHTML += `
            <div class="option-card">
                <div class="option-header">
                    <div class="option-icon">
                        <i class="fas fa-video"></i>
                    </div>
                    <div class="option-details">
                        <h4>Video ${download.quality}</h4>
                        <p>${download.type}</p>
                        ${sizeDisplay}
                    </div>
                </div>
                <div class="option-action">
                    <span class="quality-badge ${qualityClass}">${download.quality}</span>
                    <button class="download-action-btn" onclick="downloadFile('${download.url}')">
                        Download <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    resultHTML += `
            </div>
            <div class="download-another-container">
                <button class="download-another-btn" onclick="clearInput()">
                    <i class="fas fa-redo"></i>
                    Download Another
                </button>
            </div>
        </div>
    </div>
    `;
    
    resultContainer.innerHTML = resultHTML;
    resultContainer.style.display = 'block';
}

function showNoResult(message) {
    const resultContainer = document.getElementById('result-container');
    resultContainer.style.display = 'none';
    
    let noResultContainer = document.getElementById('no-result-container');
    
    if (!noResultContainer) {
        noResultContainer = document.createElement('div');
        noResultContainer.id = 'no-result-container';
        noResultContainer.className = 'no-result-container';
        
        const mainContainer = document.querySelector('.container');
        const downloadSection = document.querySelector('.download-section');
        mainContainer.insertBefore(noResultContainer, downloadSection.nextSibling);
    }
    
    noResultContainer.innerHTML = `
        <div class="no-result-content">
            <div class="no-result-icon">
                <i class="fas fa-search"></i>
            </div>
            <h3>No Result Found</h3>
            <p>${message}</p>
            <button class="try-again-btn" onclick="clearInput()">
                <i class="fas fa-redo"></i>
                Try Again
            </button>
        </div>
    `;
    
    noResultContainer.style.display = 'block';
}

function downloadFile(downloadUrl) {
    window.location.href = downloadUrl;
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorMessage.classList.add('active');
}

function handleScroll() {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('year').textContent = new Date().getFullYear();
    
    const downloadBtn = document.getElementById('download-btn');
    const input = document.getElementById('facebook-url');
    const pasteBtn = document.getElementById('paste-btn');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navMenu = document.getElementById('nav-menu');
    
    downloadBtn.addEventListener('click', handleDownload);
    pasteBtn.addEventListener('click', handleIconClick);
    
    input.addEventListener('input', updateInputIcon);
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleDownload();
        }
    });
    
    hamburgerMenu.addEventListener('click', function() {
        navMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', function(event) {
        if (!hamburgerMenu.contains(event.target) && !navMenu.contains(event.target)) {
            navMenu.classList.remove('show');
        }
    });
    
    window.addEventListener('scroll', handleScroll);
    
    observeElements();
});
