/**
 * ViralClip AI - Interactive Application Logic
 * Manages video analysis, 9:16 shorts studio, subtitle synchronization,
 * FFmpeg rendering pipeline, and the faceless income calculator.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Register Service Worker for PWA Desktop App support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration:', err);
    });
  }

  let deferredInstallPrompt = null;
  const pwaInstallBtn = document.getElementById('pwa-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'inline-flex';
      if (window.lucide) window.lucide.createIcons();
    }
  });

  if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('🎉 ViralClip AI installed as Desktop App!');
          pwaInstallBtn.style.display = 'none';
        }
        deferredInstallPrompt = null;
      }
    });
  }

  // State Management
  const state = {
    selectedObjective: 'funny',
    selectedDuration: 30,
    selectedLayout: 'crop',
    selectedSubStyle: 'hormozi',
    currentVideoMeta: null,
    currentClips: [],
    activeClip: null,
    isPlaying: false,
    isMuted: true,
    samples: []
  };

  // Subscription & Monetization System
  // App Owner/Developer defaults to Dev Mode on localhost with unlimited free access.
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const savedTier = localStorage.getItem('viralclip_tier');
  const initialTier = savedTier || (isLocalHost ? 'dev' : 'free');
  const savedTries = parseInt(localStorage.getItem('viralclip_tries') || '10', 10);

  const subscriptionState = {
    tier: initialTier, // 'dev' | 'free' | 'pro' | 'ultra'
    triesLeft: isNaN(savedTries) ? 10 : savedTries,
    modalSelectedTier: 'pro'
  };

  function saveSubscription() {
    localStorage.setItem('viralclip_tier', subscriptionState.tier);
    localStorage.setItem('viralclip_tries', subscriptionState.triesLeft.toString());
    updateTierBadge();
  }

  function updateTierBadge() {
    const badge = document.getElementById('user-tier-badge');
    const iconEl = document.getElementById('header-tier-icon');
    const textEl = document.getElementById('header-tier-text');
    const subEl = document.getElementById('header-tier-sub');
    const freeTriesEl = document.getElementById('pricing-free-tries-text');
    const devStatusTag = document.getElementById('dev-banner-status');
    const devToggleBtn = document.getElementById('btn-toggle-dev-mode');

    if (!badge) return;

    badge.classList.remove('tier-badge-dev', 'tier-badge-pro', 'tier-badge-ultra', 'tier-badge-free');
    badge.classList.add(`tier-badge-${subscriptionState.tier}`);

    if (subscriptionState.tier === 'dev') {
      if (iconEl) iconEl.textContent = '🛠️';
      if (textEl) textEl.textContent = 'Dev Mode';
      if (subEl) subEl.textContent = 'Unlimited';
      if (devStatusTag) {
        devStatusTag.textContent = 'ACTIVE (Unlimited Free)';
        devStatusTag.className = 'text-emerald';
      }
      if (devToggleBtn) {
        devToggleBtn.innerHTML = '<i data-lucide="refresh-cw"></i> Switch to Free Mode (Test)';
      }
    } else if (subscriptionState.tier === 'ultra') {
      if (iconEl) iconEl.textContent = '👑';
      if (textEl) textEl.textContent = 'Ultra Studio';
      if (subEl) subEl.textContent = 'All Unlocked';
      if (devStatusTag) {
        devStatusTag.textContent = 'INACTIVE (Ultra Active)';
        devStatusTag.className = 'text-pink';
      }
      if (devToggleBtn) {
        devToggleBtn.innerHTML = '<i data-lucide="wrench"></i> Restore Dev Mode';
      }
    } else if (subscriptionState.tier === 'pro') {
      if (iconEl) iconEl.textContent = '⚡';
      if (textEl) textEl.textContent = 'Pro Creator';
      if (subEl) subEl.textContent = 'Captions Active';
      if (devStatusTag) {
        devStatusTag.textContent = 'INACTIVE (Pro Active)';
        devStatusTag.className = 'text-indigo';
      }
      if (devToggleBtn) {
        devToggleBtn.innerHTML = '<i data-lucide="wrench"></i> Restore Dev Mode';
      }
    } else {
      // free
      if (iconEl) iconEl.textContent = '🌱';
      if (textEl) textEl.textContent = 'Free Trial';
      if (subEl) subEl.textContent = `${subscriptionState.triesLeft} Tries`;
      if (devStatusTag) {
        devStatusTag.textContent = 'INACTIVE (Free Mode)';
        devStatusTag.className = 'text-amber';
      }
      if (devToggleBtn) {
        devToggleBtn.innerHTML = '<i data-lucide="wrench"></i> Restore Dev Mode';
      }
    }

    if (freeTriesEl) {
      freeTriesEl.textContent = `${subscriptionState.triesLeft} free tries remaining`;
    }

    // Update plan buttons in pricing section
    const freeCardBtn = document.getElementById('btn-select-free');
    if (freeCardBtn) {
      if (subscriptionState.tier === 'free') {
        freeCardBtn.innerHTML = '<i data-lucide="check-circle-2"></i> Current Plan';
        freeCardBtn.classList.add('btn-primary');
        freeCardBtn.classList.remove('btn-secondary');
      } else {
        freeCardBtn.innerHTML = '<i data-lucide="user"></i> Switch to Free (Test)';
        freeCardBtn.classList.add('btn-secondary');
        freeCardBtn.classList.remove('btn-primary');
      }
    }

    // Update lock tags on subtitle buttons
    document.querySelectorAll('.sub-lock-pill').forEach(pill => {
      if (subscriptionState.tier === 'pro' || subscriptionState.tier === 'ultra' || subscriptionState.tier === 'dev') {
        pill.textContent = '✓ UNLOCKED';
        pill.style.background = 'rgba(16, 185, 129, 0.15)';
        pill.style.color = '#34d399';
        pill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      } else {
        pill.textContent = 'PRO ₹10';
        pill.style.background = 'rgba(245, 158, 11, 0.15)';
        pill.style.color = '#fbbf24';
        pill.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Keyboard shortcut: Ctrl + Shift + D to toggle Dev Mode anywhere
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      toggleDevMode();
    }
  });

  window.toggleDevMode = function() {
    if (subscriptionState.tier === 'dev') {
      subscriptionState.tier = 'free';
      showToast('Switched to Free Visitor Mode (10 Tries). Paywalls active!');
    } else {
      subscriptionState.tier = 'dev';
      showToast('🛠️ Dev Mode Activated! Unlimited free owner access.');
    }
    saveSubscription();
  };

  window.switchTier = function(newTier) {
    if (newTier === 'free') {
      subscriptionState.tier = 'free';
      showToast('Switched to Free Tier (10 tries)');
      saveSubscription();
    } else {
      window.openSubscriptionModal(newTier);
    }
  };

  window.promptDevPasscode = function() {
    const code = prompt('Enter Owner / Developer Passcode:');
    if (!code) return;
    if (code.trim().toUpperCase() === 'DEV2026') {
      subscriptionState.tier = 'dev';
      saveSubscription();
      showToast('🎉 Owner Verified! Unlimited Developer Mode Active.');
      window.closeSubscriptionModal();
    } else {
      alert('❌ Incorrect passcode. Contact the application owner.');
    }
  };

  window.activateDevModeImmediate = function() {
    subscriptionState.tier = 'dev';
    saveSubscription();
    showToast('🛠️ Welcome, Creator! Dev Mode activated with unlimited access.');
    window.closeSubscriptionModal();
  };

  window.openSubscriptionModal = function(targetTier = 'pro') {
    const modal = document.getElementById('subscription-modal');
    if (!modal) return;
    subscriptionState.modalSelectedTier = targetTier;
    modal.style.display = 'flex';
    selectModalPlan(targetTier);
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeSubscriptionModal = function() {
    const modal = document.getElementById('subscription-modal');
    if (modal) modal.style.display = 'none';
  };

  window.selectModalPlan = function(planId) {
    subscriptionState.modalSelectedTier = planId;
    
    // Tab highlighting
    document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeTab = document.getElementById(`tab-plan-${planId}`);
    if (activeTab) activeTab.classList.add('active');

    const modalTitle = document.getElementById('sub-modal-title');
    const planName = document.getElementById('summary-plan-name');
    const planDesc = document.getElementById('summary-plan-desc');
    const priceTag = document.getElementById('summary-price-tag');
    const perksList = document.getElementById('summary-perks-list');
    const paymentBox = document.getElementById('sub-payment-box');
    const qrImg = document.getElementById('upi-qr-image');
    const deeplinkBtn = document.getElementById('btn-upi-deeplink');
    const confirmBtn = document.getElementById('btn-confirm-payment');

    if (planId === 'free') {
      if (modalTitle) modalTitle.textContent = 'Free Starter Trial';
      if (planName) planName.textContent = 'Free Starter Plan';
      if (planDesc) planDesc.textContent = '10 free video generations to test out the clipper';
      if (priceTag) priceTag.textContent = '₹0';
      if (perksList) {
        perksList.innerHTML = `
          <li><i data-lucide="check"></i> 10 Free Video Generations</li>
          <li><i data-lucide="check"></i> 9:16 Vertical Smart Crop</li>
          <li><i data-lucide="check"></i> 720p HD Output</li>
          <li><i data-lucide="check"></i> Virality & Hook Scoring</li>
        `;
      }
      if (paymentBox) paymentBox.style.display = 'none';
      return;
    }

    if (paymentBox) paymentBox.style.display = 'block';

    const price = planId === 'pro' ? 10 : 50;
    const upiUrl = `upi://pay?pa=6303356281@fam&pn=ViralClip%20AI&am=${price}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`;

    if (qrImg) qrImg.src = qrUrl;
    if (deeplinkBtn) deeplinkBtn.href = upiUrl;

    if (planId === 'pro') {
      if (modalTitle) modalTitle.textContent = 'Upgrade to Pro Creator';
      if (planName) planName.textContent = 'Pro Creator Pass';
      if (planDesc) planDesc.textContent = 'Unlocks dynamic Hormozi yellow/green captions & 50 renders';
      if (priceTag) priceTag.textContent = '₹10';
      if (confirmBtn) confirmBtn.innerHTML = '<i data-lucide="zap"></i> Confirm & Activate Pro (₹10)';
      if (perksList) {
        perksList.innerHTML = `
          <li><i data-lucide="check"></i> 50 Viral Video Generations</li>
          <li><i data-lucide="check"></i> Alex Hormozi Dynamic Subtitles</li>
          <li><i data-lucide="check"></i> MrBeast & Cyber Neon Captions</li>
          <li><i data-lucide="check"></i> Whisper AI Word-by-Word Sync</li>
          <li><i data-lucide="check"></i> 1080p Full HD High Bitrate</li>
        `;
      }
    } else if (planId === 'ultra') {
      if (modalTitle) modalTitle.textContent = 'Upgrade to Ultra Studio';
      if (planName) planName.textContent = 'Ultra Studio VIP Pass';
      if (planDesc) planDesc.textContent = 'Full KineMaster Pro multi-track editor, visual effects, music, and unlimited exports';
      if (priceTag) priceTag.textContent = '₹50';
      if (confirmBtn) confirmBtn.innerHTML = '<i data-lucide="crown"></i> Confirm & Activate Ultra (₹50)';
      if (perksList) {
        perksList.innerHTML = `
          <li><i data-lucide="check"></i> Unlimited Video Generations</li>
          <li><i data-lucide="check"></i> Full KineMaster Pro Timeline</li>
          <li><i data-lucide="check"></i> All Captions (Hormozi, MrBeast, Cyber)</li>
          <li><i data-lucide="check"></i> Background Music Library & SFX Hits</li>
          <li><i data-lucide="check"></i> Emoji Stickers & Cinematic VFX</li>
          <li><i data-lucide="check"></i> 60 FPS Ultra HD Video Export</li>
        `;
      }
    }

    if (window.lucide) window.lucide.createIcons();
  };

  window.copyUpiId = function() {
    const vpa = '6303356281@fam';
    navigator.clipboard.writeText(vpa).then(() => {
      showToast('📋 UPI ID copied: ' + vpa);
    }).catch(() => {
      showToast('UPI ID: ' + vpa);
    });
  };

  window.confirmPaymentSimulation = async function() {
    const targetTier = subscriptionState.modalSelectedTier || 'pro';
    try {
      const res = await fetch('/api/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier, payment_method: 'upi' })
      });
      const data = await res.json();
      if (data.success) {
        subscriptionState.tier = targetTier;
        if (targetTier === 'pro') {
          subscriptionState.triesLeft = Math.max(50, subscriptionState.triesLeft + 50);
        }
        saveSubscription();
        window.closeSubscriptionModal();
        showToast(`🎉 Payment Confirmed! Upgraded to ${targetTier.toUpperCase()} Plan!`);
      }
    } catch (e) {
      subscriptionState.tier = targetTier;
      saveSubscription();
      window.closeSubscriptionModal();
      showToast(`🎉 Upgraded to ${targetTier.toUpperCase()} Plan!`);
    }
  };

  // Initial Tier Badge update
  updateTierBadge();

  // DOM Elements
  const urlInput = document.getElementById('youtube-url-input');
  const pasteBtn = document.getElementById('paste-btn');
  const analyzeBtn = document.getElementById('analyze-btn');
  const fileUploadInput = document.getElementById('video-file-upload');
  const uploadedFilename = document.getElementById('uploaded-filename');
  const samplePillsContainer = document.getElementById('sample-pills-container');

  const loadingSection = document.getElementById('loading-section');
  const loaderStatus = document.getElementById('loader-status');
  const loaderProgress = document.getElementById('loader-progress');
  const resultsSection = document.getElementById('results-section');
  const clipsGrid = document.getElementById('clips-grid');
  const clipsCount = document.getElementById('clips-count');
  const videoTitleDisplay = document.getElementById('video-title-display');

  // Studio Elements
  const studioSection = document.getElementById('studio-section');
  const phoneScreen = document.getElementById('phone-screen');
  const shortVideoContainer = document.getElementById('short-video-container');
  const primaryVideo = document.getElementById('studio-primary-video');
  const gameplayVideo = document.getElementById('studio-gameplay-video');
  const previewHookBanner = document.getElementById('preview-hook-banner');
  const subtitleActiveText = document.getElementById('subtitle-active-text');
  const playPauseOverlay = document.getElementById('play-pause-overlay');
  const playStateIcon = document.getElementById('play-state-icon');
  const playerProgressBar = document.getElementById('player-progress-bar');
  const playerTimeDisplay = document.getElementById('player-time-display');

  const togglePlayBtn = document.getElementById('toggle-play-btn');
  const btnPlayIcon = document.getElementById('btn-play-icon');
  const toggleMuteBtn = document.getElementById('toggle-mute-btn');
  const btnVolumeIcon = document.getElementById('btn-volume-icon');

  const activeClipVirality = document.getElementById('active-clip-virality');
  const hookBannerInput = document.getElementById('hook-banner-input');
  const trimStartInput = document.getElementById('trim-start-input');
  const trimEndInput = document.getElementById('trim-end-input');
  const trimDurationBadge = document.getElementById('trim-duration-badge');

  // Caption & Script Studio Elements
  const scriptEditorInput = document.getElementById('script-editor-input');
  const btnAiTranscribe = document.getElementById('btn-ai-transcribe');
  const btnSyncScript = document.getElementById('btn-sync-script');
  const captionChunksScroller = document.getElementById('caption-chunks-scroller');
  const chunksCountNum = document.getElementById('chunks-count-num');
  const chunksStatusPill = document.getElementById('chunks-status-pill');

  const copyTitleText = document.getElementById('copy-title-text');
  const copyTagsText = document.getElementById('copy-tags-text');
  const previewCaption = document.getElementById('preview-caption');

  const renderBtn = document.getElementById('render-btn');
  const renderResultBox = document.getElementById('render-result-box');
  const renderSpinner = document.getElementById('render-spinner');
  const renderStatusTitle = document.getElementById('render-status-title');
  const renderStatusSub = document.getElementById('render-status-sub');
  const downloadShortLink = document.getElementById('download-short-link');

  // 1. Fetch & Render Curated Sample Videos
  fetchSamples();

  async function fetchSamples() {
    try {
      const res = await fetch('/api/samples');
      const data = await res.json();
      state.samples = data.samples || [];
      renderSamplePills();
    } catch (e) {
      console.warn('Could not load samples:', e);
    }
  }

  function renderSamplePills() {
    if (!samplePillsContainer) return;
    samplePillsContainer.innerHTML = '';
    state.samples.forEach(sample => {
      const pill = document.createElement('div');
      pill.className = 'sample-pill-item';
      let emoji = '🎙️';
      if (sample.category === 'funny') emoji = '🎤';
      if (sample.id.includes('mrbeast')) emoji = '🏆';
      if (sample.id.includes('UF8uR6Z6KLc')) emoji = '🍏';

      pill.innerHTML = `<span>${emoji}</span> <span>${sample.title.split('-')[0].trim()}</span>`;
      pill.addEventListener('click', () => {
        urlInput.value = `https://www.youtube.com/watch?v=${sample.id}`;
        startVideoAnalysis();
      });
      samplePillsContainer.appendChild(pill);
    });
  }

  // 2. Clipboard Paste Handler
  if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          urlInput.value = text;
          showToast('Pasted YouTube URL!');
        }
      } catch (err) {
        urlInput.focus();
        showToast('Please press Ctrl+V to paste URL');
      }
    });
  }

  // 3. Objective & Duration Pill Handlers
  document.querySelectorAll('#objective-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#objective-pills .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedObjective = btn.getAttribute('data-objective');
    });
  });

  document.querySelectorAll('#duration-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#duration-pills .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedDuration = parseInt(btn.getAttribute('data-duration'), 10);
    });
  });

  // Hero Layout Pills
  document.querySelectorAll('#hero-layout-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-layout');
      setLayoutMode(mode);
    });
  });

  // 4. File Upload Handler
  if (fileUploadInput) {
    fileUploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      uploadedFilename.textContent = file.name;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('objective', state.selectedObjective);
      formData.append('duration', state.selectedDuration);

      showLoading(true, 'Uploading & Analyzing Video...', 'Transcribing speech and detecting punchlines');
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        handleAnalysisSuccess(data);
      } catch (err) {
        alert('File upload failed: ' + err.message);
      } finally {
        showLoading(false);
      }
    });
  }

  // 5. Main Analyze Trigger
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', startVideoAnalysis);
  }
  if (urlInput) {
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startVideoAnalysis();
    });
  }

  async function startVideoAnalysis() {
    if (subscriptionState.tier === 'free' && subscriptionState.triesLeft <= 0) {
      showToast('⚠️ You have used your 10 free tries! Upgrade to Pro (₹10) to continue.');
      window.openSubscriptionModal('pro');
      return;
    }

    let url = urlInput.value.trim();
    if (!url) {
      // Default to Joe Rogan x Elon Musk if empty
      url = 'https://www.youtube.com/watch?v=ycPr5-FLMQg';
      urlInput.value = url;
    }

    const customPromptInput = document.getElementById('custom-prompt-input');
    const customPrompt = customPromptInput ? customPromptInput.value.trim() : null;

    showLoading(true, 'Scanning Video for Punchlines...', 'Evaluating audio cadence, emotion, and viral hooks');

    let res;
    try {
      res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          objective: state.selectedObjective,
          duration: state.selectedDuration,
          custom_prompt: customPrompt
        })
      });
    } catch (networkErr) {
      console.warn('Initial analyze request failed, retrying in 1.5s...', networkErr);
      if (loaderStatus) loaderStatus.textContent = 'Connecting to ViralClip Engine...';
      await new Promise(r => setTimeout(r, 1500));
      try {
        res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: url,
            objective: state.selectedObjective,
            duration: state.selectedDuration,
            custom_prompt: customPrompt
          })
        });
      } catch (retryErr) {
        showLoading(false);
        showToast('⚠️ Backend engine is waking up. Please double-click the "ViralClip AI" icon on your Desktop or wait 3 seconds.', 6000);
        return;
      }
    }

    try {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Server returned HTTP ' + res.status }));
        throw new Error(err.detail || 'Analysis error');
      }

      const data = await res.json();
      handleAnalysisSuccess(data);
    } catch (err) {
      showToast('❌ Analysis Error: ' + err.message);
    } finally {
      showLoading(false);
    }
  }

  function showLoading(show, title = '', desc = '') {
    if (loadingSection) loadingSection.style.display = show ? 'flex' : 'none';
    if (show) {
      if (resultsSection) resultsSection.style.display = 'none';
      if (studioSection) studioSection.style.display = 'none';
      if (loaderStatus) loaderStatus.textContent = title;
      if (loaderProgress) {
        loaderProgress.style.width = '20%';
        setTimeout(() => { loaderProgress.style.width = '65%'; }, 400);
        setTimeout(() => { loaderProgress.style.width = '95%'; }, 900);
      }
    }
  }

  function handleAnalysisSuccess(data) {
    state.currentVideoMeta = data;
    state.currentClips = data.clips || [];

    if (videoTitleDisplay) {
      videoTitleDisplay.textContent = `${data.title} • ${data.channel} • ${data.views || ''}`;
    }
    if (clipsCount) {
      clipsCount.textContent = state.currentClips.length;
    }

    renderClipsGrid();
    if (resultsSection) resultsSection.style.display = 'block';

    // Auto-select first clip and open studio
    if (state.currentClips.length > 0) {
      selectClipForStudio(state.currentClips[0]);
    }

    // Scroll smoothly to results
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 6. Render Discovered Clips Grid
  function renderClipsGrid() {
    if (!clipsGrid) return;
    clipsGrid.innerHTML = '';

    state.currentClips.forEach((clip, idx) => {
      const card = document.createElement('div');
      card.className = 'clip-card';

      const thumbUrl = clip.thumbnail || state.currentVideoMeta.thumbnail || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800';
      const isGold = clip.virality_score >= 97;

      card.innerHTML = `
        <div class="clip-thumbnail-wrap">
          <img src="${thumbUrl}" alt="Thumbnail" class="clip-thumb-img">
          <div class="clip-badges">
            <span class="virality-badge ${isGold ? 'gold' : ''}">
              <i data-lucide="flame"></i> ${clip.virality_score}% VIRAL
            </span>
            <span class="time-badge">${formatSeconds(clip.start_time)} - ${formatSeconds(clip.end_time)}</span>
          </div>
          <div class="hook-badge-preview">
            ${clip.hook_banner}
          </div>
        </div>

        <div class="clip-body">
          <h3 class="clip-title">${clip.title}</h3>
          <div class="clip-stats-row">
            <span class="stat-pill">Hook: <strong>${clip.hook_grade}</strong></span>
            <span class="stat-pill">Loop: <strong>${clip.retention_prediction}</strong></span>
            <span class="stat-pill">Length: <strong>${clip.duration}s</strong></span>
          </div>

          <p class="clip-transcript-snippet">"${clip.transcript}"</p>

          <div class="clip-card-actions">
            <button class="btn btn-secondary btn-sm preview-btn">
              <i data-lucide="smartphone"></i> Preview
            </button>
            <button class="btn btn-secondary btn-sm pro-edit-btn" style="border-color: #ec4899; color: #f472b6;" title="Edit in KineMaster Pro Studio">
              <i data-lucide="film"></i> Pro Edit
            </button>
            <button class="btn btn-primary btn-sm quick-render-btn">
              <i data-lucide="download"></i> Render
            </button>
          </div>
        </div>
      `;

      // Event listeners
      card.querySelector('.preview-btn').addEventListener('click', () => {
        selectClipForStudio(clip);
        if (studioSection) studioSection.scrollIntoView({ behavior: 'smooth' });
      });

      card.querySelector('.pro-edit-btn').addEventListener('click', () => {
        selectClipForStudio(clip);
        openProEditor(clip);
      });

      card.querySelector('.quick-render-btn').addEventListener('click', () => {
        selectClipForStudio(clip);
        if (studioSection) studioSection.scrollIntoView({ behavior: 'smooth' });
        triggerRender();
      });

      clipsGrid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Helper to ensure a specific clip segment is downloaded from YouTube for studio preview
  async function ensureClipVideoReady(clip) {
    if (!clip) return null;
    if (clip.video_url) return clip.video_url;

    const vidId = (state.currentVideoMeta && state.currentVideoMeta.video_id) || '';
    if (!vidId) return null;

    if (state.currentVideoMeta.is_sample) {
      clip.video_url = state.currentVideoMeta.video_url || '/assets/sample_clip.mp4';
      return clip.video_url;
    }

    const overlay = document.getElementById('video-loading-overlay');
    const overlayText = document.getElementById('video-loading-text');
    if (overlay) overlay.style.display = 'flex';
    if (overlayText) overlayText.textContent = `Downloading Scene (${formatSeconds(clip.start_time)} - ${formatSeconds(clip.end_time)}) in HD...`;

    try {
      const res = await fetch('/api/prepare-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: vidId,
          start_time: clip.start_time,
          duration: clip.duration
        })
      });
      if (!res.ok) throw new Error('Could not download scene');
      const data = await res.json();
      if (data.video_url) {
        clip.video_url = data.video_url;
        clip.source_file = data.source_file;
        if (data.thumbnail) clip.thumbnail = data.thumbnail;

        // If this clip is currently active, load into player immediately
        if (state.activeClip && state.activeClip.clip_id === clip.clip_id && primaryVideo) {
          primaryVideo.src = data.video_url;
          primaryVideo.load();
          primaryVideo.currentTime = 0;
        }
        renderClipsGrid();
        return data.video_url;
      }
    } catch (err) {
      console.warn('Clip prepare error:', err);
      showToast('⚠️ Could not download this scene from YouTube. Check connection.');
    } finally {
      if (overlay) overlay.style.display = 'none';
    }
    return null;
  }

  // 7. Select Clip & Load Studio
  function selectClipForStudio(clip) {
    state.activeClip = clip;

    if (studioSection) studioSection.style.display = 'block';

    // Update active badges & inputs
    if (activeClipVirality) {
      activeClipVirality.innerHTML = `<i data-lucide="flame"></i> ${clip.virality_score}% Viral Score • ${clip.hook_grade}`;
    }
    if (hookBannerInput) hookBannerInput.value = clip.hook_banner;
    if (previewHookBanner) previewHookBanner.querySelector('span').textContent = clip.hook_banner;

    if (trimStartInput) trimStartInput.value = clip.start_time.toFixed(1);
    if (trimEndInput) trimEndInput.value = clip.end_time.toFixed(1);
    if (trimDurationBadge) trimDurationBadge.textContent = `Duration: ${clip.duration.toFixed(1)}s`;

    if (copyTitleText) copyTitleText.textContent = clip.title;
    if (copyTagsText) copyTagsText.textContent = clip.hashtags.join(' ');
    if (previewCaption) previewCaption.textContent = `${clip.raw_title} 💀 ${clip.hashtags.slice(0, 4).join(' ')}`;

    // Reset video player time and update video source
    if (primaryVideo) {
      if (clip.video_url) {
        if (!primaryVideo.src.endsWith(clip.video_url)) {
          primaryVideo.src = clip.video_url;
          primaryVideo.load();
        }
        primaryVideo.currentTime = 0;
      } else if (state.currentVideoMeta && state.currentVideoMeta.is_sample) {
        const sampleSrc = state.currentVideoMeta.video_url || '/assets/sample_clip.mp4';
        primaryVideo.src = sampleSrc;
        primaryVideo.load();
        primaryVideo.currentTime = 0;
      } else {
        // Real YouTube video without pre-cached segment: fetch on-demand!
        ensureClipVideoReady(clip);
      }
    }
    if (gameplayVideo) {
      gameplayVideo.currentTime = 0;
    }

    // Populate Caption / Script Editor
    if (scriptEditorInput) {
      if (clip.subtitles && clip.subtitles.length > 0) {
        scriptEditorInput.value = clip.subtitles.map(s => s.text).join(' ');
      } else {
        scriptEditorInput.value = clip.transcript || '';
      }
    }
    renderCaptionChunksList();

    updateSubtitleForTime(0);

    // Apply and synchronize layout across all UI bars
    setLayoutMode(state.selectedLayout || 'crop');
    applySubtitleStyle(state.selectedSubStyle);

    if (window.lucide) window.lucide.createIcons();
  }

  // --- Caption & Script Studio Management ---
  function renderCaptionChunksList() {
    if (!captionChunksScroller) return;
    captionChunksScroller.innerHTML = '';
    const subs = (state.activeClip && state.activeClip.subtitles) || [];

    if (chunksCountNum) chunksCountNum.textContent = subs.length;
    if (chunksStatusPill) {
      chunksStatusPill.textContent = subs.length > 0 ? `${subs.length} Chunks Synced` : 'No Captions';
      chunksStatusPill.style.background = subs.length > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      chunksStatusPill.style.color = subs.length > 0 ? '#34d399' : '#f87171';
    }

    subs.forEach((chunk, idx) => {
      const chip = document.createElement('div');
      chip.className = 'chunk-chip';
      chip.dataset.idx = idx;
      chip.innerHTML = `
        <span class="chunk-time-tag">${chunk.start.toFixed(1)}s</span>
        <span class="chunk-text-tag">${chunk.text}</span>
      `;
      chip.addEventListener('click', () => {
        if (primaryVideo) {
          primaryVideo.currentTime = chunk.start;
          updateSubtitleForTime(chunk.start);
          highlightActiveChunkChip(idx);
        }
      });
      captionChunksScroller.appendChild(chip);
    });
  }

  function highlightActiveChunkChip(activeIdx) {
    if (!captionChunksScroller) return;
    const chips = captionChunksScroller.querySelectorAll('.chunk-chip');
    chips.forEach((c, i) => {
      if (i === activeIdx) {
        if (!c.classList.contains('active-chunk')) {
          c.classList.add('active-chunk');
          c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      } else {
        c.classList.remove('active-chunk');
      }
    });
  }

  let syncDebounceTimer = null;
  if (scriptEditorInput) {
    scriptEditorInput.addEventListener('input', () => {
      if (chunksStatusPill) {
        chunksStatusPill.textContent = 'Typing...';
        chunksStatusPill.style.background = 'rgba(234, 179, 8, 0.15)';
        chunksStatusPill.style.color = '#facc15';
      }
      clearTimeout(syncDebounceTimer);
      syncDebounceTimer = setTimeout(() => {
        autoSyncScriptText(false);
      }, 600);
    });
  }

  if (btnSyncScript) {
    btnSyncScript.addEventListener('click', () => {
      autoSyncScriptText(true);
    });
  }

  async function autoSyncScriptText(showFeedback = false) {
    if (!state.activeClip) return;
    const text = (scriptEditorInput ? scriptEditorInput.value : '').trim();
    if (!text) {
      state.activeClip.subtitles = [];
      renderCaptionChunksList();
      if (subtitleActiveText) subtitleActiveText.style.display = 'none';
      return;
    }

    try {
      const dur = state.activeClip.duration || 30.0;
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: (state.currentVideoMeta && state.currentVideoMeta.video_id) || 'clip',
          script_text: text,
          duration: dur
        })
      });
      const data = await res.json();
      if (data.subtitles && data.subtitles.length > 0) {
        state.activeClip.subtitles = data.subtitles;
        state.activeClip.transcript = text;
        renderCaptionChunksList();
        updateSubtitleForTime(primaryVideo ? primaryVideo.currentTime : 0);
        if (showFeedback) showToast('✨ Captions auto-synced across clip duration!');
      }
    } catch (e) {
      console.warn('Auto-sync error:', e);
    }
  }

  if (btnAiTranscribe) {
    btnAiTranscribe.addEventListener('click', async () => {
      if (!state.activeClip) return;
      btnAiTranscribe.disabled = true;
      btnAiTranscribe.innerHTML = '<i data-lucide="loader"></i> <span>Transcribing...</span>';
      if (window.lucide) window.lucide.createIcons();

      try {
        const vidId = (state.currentVideoMeta && state.currentVideoMeta.video_id) || 'clip';
        const srcFile = state.activeClip.source_file || (state.currentVideoMeta && state.currentVideoMeta.source_file) || null;
        const dur = state.activeClip.duration || 30.0;
        const startTime = state.activeClip.start_time || 0.0;

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_id: vidId,
            source_file: srcFile,
            start_time: startTime,
            duration: dur
          })
        });

        const data = await res.json();
        if (data.subtitles && data.subtitles.length > 0) {
          state.activeClip.subtitles = data.subtitles;
          const fullScript = data.subtitles.map(s => s.text).join(' ');
          state.activeClip.transcript = fullScript;
          if (scriptEditorInput) scriptEditorInput.value = fullScript;
          renderCaptionChunksList();
          updateSubtitleForTime(primaryVideo ? primaryVideo.currentTime : 0);
          showToast(`🎙️ AI Whisper transcribed ${data.subtitles.length} chunks!`);
        } else {
          showToast('No speech detected in audio. Type your custom words in the box.');
        }
      } catch (err) {
        showToast('Transcription error: ' + err.message);
      } finally {
        btnAiTranscribe.disabled = false;
        btnAiTranscribe.innerHTML = '<i data-lucide="mic"></i> <span>AI Whisper</span>';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // 8. Video Player & Subtitle Synchronization
  if (primaryVideo) {
    primaryVideo.addEventListener('timeupdate', () => {
      const current = primaryVideo.currentTime;
      const duration = primaryVideo.duration || 30;

      // Update scrub bar
      const pct = (current / duration) * 100;
      if (playerProgressBar) playerProgressBar.style.width = `${pct}%`;
      if (playerTimeDisplay) {
        playerTimeDisplay.textContent = `${formatSeconds(current)} / ${formatSeconds(duration)}`;
      }

      // Sync Subtitles
      updateSubtitleForTime(current);

      // Keep bottom gameplay synced
      if (gameplayVideo && Math.abs(gameplayVideo.currentTime - current) > 0.3) {
        gameplayVideo.currentTime = current;
      }
    });

    primaryVideo.addEventListener('ended', () => {
      primaryVideo.currentTime = 0;
      if (gameplayVideo) gameplayVideo.currentTime = 0;
      primaryVideo.play();
    });
  }

  let animFrameId = null;
  function startSyncLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    function loop() {
      if (primaryVideo && state.isPlaying) {
        const current = primaryVideo.currentTime;
        updateSubtitleForTime(current);
        const duration = primaryVideo.duration || 30;
        const pct = (current / duration) * 100;
        if (playerProgressBar) playerProgressBar.style.width = `${pct}%`;
        if (playerTimeDisplay) {
          playerTimeDisplay.textContent = `${formatSeconds(current)} / ${formatSeconds(duration)}`;
        }
        animFrameId = requestAnimationFrame(loop);
      }
    }
    animFrameId = requestAnimationFrame(loop);
  }

  function updateSubtitleForTime(sec) {
    if (state.selectedSubStyle === 'none') {
      if (subtitleActiveText) subtitleActiveText.style.display = 'none';
      highlightActiveChunkChip(-1);
      return;
    }
    if (!state.activeClip || !state.activeClip.subtitles || state.activeClip.subtitles.length === 0) {
      if (subtitleActiveText) subtitleActiveText.style.display = 'none';
      return;
    }
    const subs = state.activeClip.subtitles;
    
    // 1. Direct match: sec between start and end
    let match = subs.find(s => sec >= s.start && sec <= s.end);

    // 2. Smooth bridge: if in between two chunks, keep recent chunk active for 0.4s
    if (!match) {
      for (let i = subs.length - 1; i >= 0; i--) {
        if (sec >= subs[i].start && sec <= (subs[i].end + 0.45)) {
          match = subs[i];
          break;
        }
      }
    }

    // 3. Beginning fallback
    if (!match && subs.length > 0 && sec < (subs[0].start + 0.5)) {
      match = subs[0];
    }

    if (match && subtitleActiveText) {
      const matchIdx = subs.indexOf(match);
      highlightActiveChunkChip(matchIdx);
      const displayText = `${match.text.toUpperCase()} ${match.emoji || ''}`.trim();
      if (subtitleActiveText.textContent !== displayText) {
        subtitleActiveText.textContent = displayText;
        subtitleActiveText.classList.remove('caption-pop-anim');
        void subtitleActiveText.offsetWidth; // Force CSS reflow to re-trigger pop
        subtitleActiveText.classList.add('caption-pop-anim');
      }
      subtitleActiveText.style.display = 'inline-block';
    } else if (!match) {
      highlightActiveChunkChip(-1);
    }
  }

  // Play / Pause / Mute Handlers
  if (shortVideoContainer) {
    shortVideoContainer.addEventListener('click', togglePlayback);
  }
  if (togglePlayBtn) {
    togglePlayBtn.addEventListener('click', togglePlayback);
  }

  function togglePlayback() {
    if (!primaryVideo) return;
    if (primaryVideo.paused) {
      primaryVideo.play().catch(e => console.warn('Play error:', e));
      if (gameplayVideo) gameplayVideo.play().catch(e => console.warn('Gameplay play error:', e));
      state.isPlaying = true;
      startSyncLoop();
      if (playPauseOverlay) playPauseOverlay.style.opacity = '0';
      if (togglePlayBtn) togglePlayBtn.innerHTML = '<i data-lucide="pause"></i> Pause';
    } else {
      primaryVideo.pause();
      if (gameplayVideo) gameplayVideo.pause();
      state.isPlaying = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (playPauseOverlay) playPauseOverlay.style.opacity = '1';
      if (togglePlayBtn) togglePlayBtn.innerHTML = '<i data-lucide="play"></i> Play';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  if (toggleMuteBtn) {
    toggleMuteBtn.addEventListener('click', () => {
      if (!primaryVideo) return;
      state.isMuted = !state.isMuted;
      primaryVideo.muted = state.isMuted;
      if (gameplayVideo) gameplayVideo.muted = true; // Always mute gameplay background

      if (state.isMuted) {
        toggleMuteBtn.innerHTML = '<i data-lucide="volume-x"></i> Unmute Voice';
        toggleMuteBtn.className = 'btn btn-primary btn-sm';
      } else {
        toggleMuteBtn.innerHTML = '<i data-lucide="volume-2"></i> Mute Voice';
        toggleMuteBtn.className = 'btn btn-secondary btn-sm';
        showToast('🔊 Voice Audio Unmuted!');
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // 9. Layout Mode Management
  const layoutNames = {
    crop: '📱 Full 9:16 (No Split)',
    split: '🎮 Split-Screen (Viral Gameplay)',
    blur: '✨ Fit & Blurred Glow',
    fit: '⬛ Letterbox (Clean Fit)'
  };

  function setLayoutMode(mode) {
    state.selectedLayout = mode;

    // Update active label banner
    const layoutActiveName = document.getElementById('layout-active-name');
    if (layoutActiveName) {
      layoutActiveName.textContent = layoutNames[mode] || mode;
    }

    // Sync Hero pills
    document.querySelectorAll('#hero-layout-pills .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-layout') === mode);
    });

    // Sync Studio cards
    document.querySelectorAll('.layout-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-layout') === mode);
    });

    // Sync Top Phone Tabs
    document.querySelectorAll('.phone-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-layout') === mode);
    });

    // Sync Quick Phone layout pills
    document.querySelectorAll('.phone-layout-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-layout') === mode);
    });

    applyLayoutMode(mode);
  }

  // Click listeners for Top Phone Tab Switcher
  document.querySelectorAll('.phone-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const mode = btn.getAttribute('data-layout');
      setLayoutMode(mode);
      showToast(`Switched: ${layoutNames[mode] || mode}`);
    });
  });

  // Click listeners for Quick Phone layout pills
  document.querySelectorAll('.phone-layout-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const mode = btn.getAttribute('data-layout');
      setLayoutMode(mode);
      showToast(`Switched: ${layoutNames[mode] || mode}`);
    });
  });

  // Click listeners for Studio customizer cards
  document.querySelectorAll('.layout-card').forEach(card => {
    card.addEventListener('click', () => {
      const mode = card.getAttribute('data-layout');
      setLayoutMode(mode);
      showToast(`Switched: ${layoutNames[mode] || mode}`);
    });
  });

  function applyLayoutMode(mode) {
    if (!shortVideoContainer) return;
    shortVideoContainer.classList.remove('split-mode', 'crop-mode', 'blur-mode', 'fit-mode');
    shortVideoContainer.classList.add(`${mode}-mode`);

    // Manage gameplay video explicitly in JS
    if (gameplayVideo) {
      if (mode === 'split') {
        gameplayVideo.style.display = 'block';
        gameplayVideo.style.visibility = 'visible';
        gameplayVideo.style.opacity = '1';
        if (state.isPlaying) {
          gameplayVideo.play().catch(() => {});
        }
      } else {
        gameplayVideo.pause();
        gameplayVideo.style.display = 'none';
        gameplayVideo.style.visibility = 'hidden';
        gameplayVideo.style.opacity = '0';
      }
    }

    // Direct JS style enforcement to guarantee instant update
    if (primaryVideo) {
      if (mode === 'split') {
        primaryVideo.style.height = '50%';
        primaryVideo.style.maxHeight = '50%';
        primaryVideo.style.top = '0';
        primaryVideo.style.transform = 'none';
        primaryVideo.style.objectFit = 'cover';
      } else if (mode === 'blur') {
        primaryVideo.style.height = 'auto';
        primaryVideo.style.maxHeight = '54%';
        primaryVideo.style.top = '50%';
        primaryVideo.style.transform = 'translate(-50%, -50%)';
        primaryVideo.style.objectFit = 'contain';
      } else if (mode === 'fit') {
        primaryVideo.style.height = 'auto';
        primaryVideo.style.maxHeight = '100%';
        primaryVideo.style.top = '50%';
        primaryVideo.style.transform = 'translate(-50%, -50%)';
        primaryVideo.style.objectFit = 'contain';
      } else {
        // 'crop' - Full 9:16 Single Video
        primaryVideo.style.height = '100%';
        primaryVideo.style.maxHeight = '100%';
        primaryVideo.style.top = '0';
        primaryVideo.style.transform = 'none';
        primaryVideo.style.objectFit = 'cover';
      }
    }
  }

  // 10. Subtitle Style Switcher
  document.querySelectorAll('.sub-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStyle = btn.getAttribute('data-substyle');
      if (targetStyle !== 'none' && subscriptionState.tier === 'free') {
        showToast('🔒 Dynamic Captions require Pro Tier (₹10). Upgrade now to unlock!');
        window.openSubscriptionModal('pro');
        return;
      }
      document.querySelectorAll('.sub-style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedSubStyle = targetStyle;
      applySubtitleStyle(state.selectedSubStyle);
    });
  });

  function applySubtitleStyle(style) {
    if (!subtitleActiveText) return;
    subtitleActiveText.classList.remove('sub-style-hormozi', 'sub-style-mrbeast', 'sub-style-cyber', 'sub-style-classic', 'sub-style-none');
    subtitleActiveText.classList.add(`sub-style-${style}`);

    const toggleNoneText = document.getElementById('toggle-none-text');

    if (style === 'none') {
      subtitleActiveText.style.display = 'none';
      if (chunksStatusPill) {
        chunksStatusPill.textContent = '🚫 No Captions';
        chunksStatusPill.style.background = 'rgba(239, 68, 68, 0.15)';
        chunksStatusPill.style.color = '#f87171';
      }
      if (toggleNoneText) toggleNoneText.textContent = 'Enable Captions';
      highlightActiveChunkChip(-1);
    } else {
      if (toggleNoneText) toggleNoneText.textContent = 'Hide Captions';
      if (chunksStatusPill) {
        const count = (state.activeClip && state.activeClip.subtitles) ? state.activeClip.subtitles.length : 0;
        chunksStatusPill.textContent = count > 0 ? `${count} Chunks Synced` : 'Ready';
        chunksStatusPill.style.background = 'rgba(16, 185, 129, 0.15)';
        chunksStatusPill.style.color = '#34d399';
      }
      updateSubtitleForTime(primaryVideo ? primaryVideo.currentTime : 0);
    }
  }

  // Quick toggle between No Captions and Hormozi
  const btnToggleNone = document.getElementById('btn-toggle-none');
  if (btnToggleNone) {
    btnToggleNone.addEventListener('click', () => {
      const isNone = state.selectedSubStyle === 'none';
      if (isNone && subscriptionState.tier === 'free') {
        showToast('🔒 Dynamic Captions require Pro Tier (₹10). Upgrade now to unlock!');
        window.openSubscriptionModal('pro');
        return;
      }
      const targetStyle = isNone ? 'hormozi' : 'none';
      state.selectedSubStyle = targetStyle;

      document.querySelectorAll('.sub-style-btn').forEach(b => {
        if (b.getAttribute('data-substyle') === targetStyle) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      applySubtitleStyle(targetStyle);
      showToast(targetStyle === 'none' ? '🚫 Captions turned OFF' : '✨ Captions enabled (Hormozi style)!');
    });
  }

  // 11. Hook Banner Live Update
  if (hookBannerInput) {
    hookBannerInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (previewHookBanner) {
        previewHookBanner.querySelector('span').textContent = val || 'WAIT TILL THE END';
      }
    });
  }

  // 12. Timestamp Trim Adjusters
  if (trimStartInput && trimEndInput) {
    const handleTrimChange = () => {
      const start = parseFloat(trimStartInput.value) || 0;
      const end = parseFloat(trimEndInput.value) || 30;
      if (end > start) {
        const dur = end - start;
        if (trimDurationBadge) trimDurationBadge.textContent = `Duration: ${dur.toFixed(1)}s`;
        if (state.activeClip) {
          state.activeClip.start_time = start;
          state.activeClip.end_time = end;
          state.activeClip.duration = dur;
        }
      }
    };
    trimStartInput.addEventListener('change', handleTrimChange);
    trimEndInput.addEventListener('change', handleTrimChange);
  }

  // 13. Render & Export Short via FFmpeg
  if (renderBtn) {
    renderBtn.addEventListener('click', triggerRender);
  }

  async function triggerRender() {
    if (!state.activeClip) {
      alert('Please select a viral clip to render first.');
      return;
    }

    // Subscription & Tier Gating
    if (subscriptionState.tier === 'free') {
      if (subscriptionState.triesLeft <= 0) {
        showToast('⚠️ You have used your 10 free tries! Upgrade to continue.');
        window.openSubscriptionModal('pro');
        return;
      }
      if (state.selectedSubStyle && state.selectedSubStyle !== 'none') {
        showToast('🔒 Dynamic Captions require Pro Tier (₹10). Upgrade or select "No Captions" to render free!');
        window.openSubscriptionModal('pro');
        return;
      }
    }

    if (renderResultBox) {
      renderResultBox.style.display = 'flex';
      renderResultBox.scrollIntoView({ behavior: 'smooth' });
    }
    if (renderSpinner) renderSpinner.style.display = 'block';
    if (renderStatusTitle) renderStatusTitle.textContent = 'Rendering 9:16 Vertical Short with FFmpeg...';
    if (renderStatusSub) renderStatusSub.textContent = 'Compositing split-screen gameplay, burning Hormozi captions & encoding high-bitrate MP4';
    if (downloadShortLink) downloadShortLink.style.display = 'none';

    // If source file for this clip is not downloaded yet, ensure it is ready first
    if (!state.activeClip.source_file && state.currentVideoMeta && !state.currentVideoMeta.is_sample) {
      if (renderStatusTitle) renderStatusTitle.textContent = 'Fetching HD Video Segment from YouTube...';
      await ensureClipVideoReady(state.activeClip);
    }

    const payload = {
      clip_id: state.activeClip.clip_id,
      video_id: (state.currentVideoMeta && state.currentVideoMeta.video_id) || 'sample',
      start_time: parseFloat(trimStartInput.value) || state.activeClip.start_time || 0.0,
      end_time: parseFloat(trimEndInput.value) || state.activeClip.end_time || 30.0,
      layout_mode: state.selectedLayout || 'crop',
      subtitle_style: state.selectedSubStyle || 'hormozi',
      hook_banner: hookBannerInput ? hookBannerInput.value : state.activeClip.hook_banner,
      subtitles: state.selectedSubStyle === 'none' ? [] : (state.activeClip.subtitles || []),
      source_file: (state.activeClip && state.activeClip.source_file) || (state.currentVideoMeta && state.currentVideoMeta.source_file) || null
    };

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'FFmpeg render error');
      }

      const result = await res.json();

      // Render Complete
      if (renderSpinner) renderSpinner.style.display = 'none';
      if (renderStatusTitle) renderStatusTitle.textContent = '🎉 Short Rendered Successfully!';
      if (renderStatusSub) renderStatusSub.textContent = `1080x1920 (9:16) • File Size: ${result.file_size_mb} MB • Duration: ${result.duration.toFixed(1)}s`;

      const fullClipUrl = window.location.origin + result.download_url;
      const renderActionsRow = document.getElementById('render-actions-row');
      const copyClipUrlBtn = document.getElementById('copy-clip-url-btn');
      const openClipTabLink = document.getElementById('open-clip-tab-link');
      const clipLinkBox = document.getElementById('clip-link-box');
      const directClipUrlInput = document.getElementById('direct-clip-url-input');
      const btnCopyInline = document.getElementById('btn-copy-inline');

      if (downloadShortLink) {
        downloadShortLink.href = result.download_url;
        downloadShortLink.download = result.filename;
      }
      if (openClipTabLink) {
        openClipTabLink.href = result.download_url;
      }
      if (directClipUrlInput) {
        directClipUrlInput.value = fullClipUrl;
      }
      if (renderActionsRow) renderActionsRow.style.display = 'flex';
      if (clipLinkBox) clipLinkBox.style.display = 'flex';

      const copyHandler = () => {
        navigator.clipboard.writeText(fullClipUrl).then(() => {
          showToast('🔗 Clip download link copied to clipboard!');
        }).catch(() => {
          if (directClipUrlInput) {
            directClipUrlInput.select();
            document.execCommand('copy');
            showToast('🔗 Clip link copied!');
          }
        });
      };

      if (copyClipUrlBtn) copyClipUrlBtn.onclick = copyHandler;
      if (btnCopyInline) btnCopyInline.onclick = copyHandler;

      if (window.lucide) window.lucide.createIcons();

      // Decrement try count for free tier users
      if (subscriptionState.tier === 'free') {
        subscriptionState.triesLeft = Math.max(0, subscriptionState.triesLeft - 1);
        saveSubscription();
        showToast(`🎉 Render complete! (${subscriptionState.triesLeft} free tries remaining)`);
      } else {
        showToast('Render Complete! Link ready & ready to download');
      }
    } catch (err) {
      if (renderSpinner) renderSpinner.style.display = 'none';
      if (renderStatusTitle) renderStatusTitle.textContent = 'Render Failed';
      if (renderStatusSub) renderStatusSub.textContent = err.message;
    }
  }

  // 14. Interactive Faceless Income Calculator
  const viewsSlider = document.getElementById('views-slider');
  const rpmSlider = document.getElementById('rpm-slider');
  const affiliateSlider = document.getElementById('affiliate-slider');

  const viewsDisplay = document.getElementById('views-display');
  const rpmDisplay = document.getElementById('rpm-display');
  const affiliateDisplay = document.getElementById('affiliate-display');

  const totalEarningsDisplay = document.getElementById('total-earnings-display');
  const adsenseSubtotal = document.getElementById('adsense-subtotal');
  const tiktokSubtotal = document.getElementById('tiktok-subtotal');
  const affiliateSubtotal = document.getElementById('affiliate-subtotal');

  function calculateEarnings() {
    if (!viewsSlider || !rpmSlider || !affiliateSlider) return;

    const dailyViews = parseInt(viewsSlider.value, 10);
    const rpm = parseFloat(rpmSlider.value);
    const monthlyAffiliateSales = parseInt(affiliateSlider.value, 10);

    const monthlyViews = dailyViews * 30;

    // YouTube Shorts AdSense: (Monthly Views / 1000) * RPM
    const ytAdSense = Math.round((monthlyViews / 1000) * rpm);

    // TikTok Creator Rewards (assuming 60% of YouTube volume crossposted at $0.60 RPM)
    const tiktokEarnings = Math.round(((monthlyViews * 0.6) / 1000) * 0.07);

    // Pinned affiliate sales ($25 avg commission per sale)
    const affiliateEarnings = monthlyAffiliateSales * 25;

    const total = ytAdSense + tiktokEarnings + affiliateEarnings;

    // Update displays
    viewsDisplay.textContent = `${Number(dailyViews).toLocaleString()} views / day`;
    rpmDisplay.textContent = `$${rpm.toFixed(2)} RPM`;
    affiliateDisplay.textContent = `${monthlyAffiliateSales} sales / mo ($25 comm)`;

    totalEarningsDisplay.textContent = `$${Number(total).toLocaleString()}`;
    adsenseSubtotal.textContent = `$${Number(ytAdSense).toLocaleString()} / mo`;
    tiktokSubtotal.textContent = `$${Number(tiktokEarnings).toLocaleString()} / mo`;
    affiliateSubtotal.textContent = `$${Number(affiliateEarnings).toLocaleString()} / mo`;
  }

  if (viewsSlider) viewsSlider.addEventListener('input', calculateEarnings);
  if (rpmSlider) rpmSlider.addEventListener('input', calculateEarnings);
  if (affiliateSlider) affiliateSlider.addEventListener('input', calculateEarnings);
  calculateEarnings();

  // Helper: Format Seconds to M:SS
  function formatSeconds(secs) {
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  }

  // Toast Helper
  window.showToast = function(msg, duration = 3500) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, duration);
  };

  // Clipboard copy helper
  window.copyText = function(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const txt = el.textContent;
    navigator.clipboard.writeText(txt).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => {
      showToast('Copied text!');
    });
  };

  // Background Engine Heartbeat Monitor
  const statusPill = document.querySelector('.status-pill');
  async function checkServerHealth() {
    try {
      const resp = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        if (statusPill && statusPill.classList.contains('offline')) {
          statusPill.innerHTML = '<span class="status-dot"></span><span>FFmpeg 9.0 Active</span>';
          statusPill.classList.remove('offline');
        }
      } else {
        throw new Error('Offline');
      }
    } catch (e) {
      if (statusPill) {
        statusPill.innerHTML = '<span class="status-dot offline"></span><span>Engine Reconnecting...</span>';
        statusPill.classList.add('offline');
      }
    }
  }
  setInterval(checkServerHealth, 6000);

  // ==========================================================================
  // KineMaster Pro Studio: Multi-Track Timeline Video Editor Module
  // ==========================================================================
  const proState = {
    activeClip: null,
    isPlaying: false,
    isMuted: true,
    currentTime: 0,
    duration: 30.0,
    startTime: 0.0,
    endTime: 30.0,
    vfxFilter: 'normal',
    selectedMusic: null,
    voiceVolume: 1.0,
    musicVolume: 0.20,
    duckingEnabled: true,
    stickers: [], // [{ id, text, start, end, position, y }]
    sfxList: [],  // [{ id, sfx_id, name, time, url }]
    speed: 1.0,
    zoomLevel: 1.0,
    audioAssets: { music: [], sfx: [] }
  };

  // Pro Video & Audio Elements
  const proSection = document.getElementById('pro-editor-section');
  const proVideo = document.getElementById('pro-preview-video');
  const proFilterOverlay = document.getElementById('pro-filter-overlay');
  const proStickersOverlay = document.getElementById('pro-stickers-overlay');
  const proCaptionActive = document.getElementById('pro-caption-active');
  const proHookBanner = document.getElementById('pro-hook-banner');
  const proHookBannerText = document.getElementById('pro-hook-banner-text');
  const proPlayOverlay = document.getElementById('pro-play-overlay');
  const proTimecodeDisplay = document.getElementById('pro-timecode-display');
  const tlPlayheadTime = document.getElementById('tl-playhead-time');
  const tlPlayheadNeedle = document.getElementById('timeline-playhead-needle');
  const tlTracksViewport = document.getElementById('timeline-tracks-viewport');
  const tlRuler = document.getElementById('timeline-ruler');

  // Background Audio Preview Element
  const bgMusicAudio = new Audio();
  bgMusicAudio.loop = true;
  const sfxPreviewAudio = new Audio();

  // Load Audio Library
  fetchAudioAssets();

  async function fetchAudioAssets() {
    try {
      const res = await fetch('/api/audio/assets');
      if (res.ok) {
        const data = await res.json();
        proState.audioAssets = data;
        renderMusicLibrary();
        renderSfxLibrary();
      }
    } catch (e) {
      console.warn('Could not fetch audio assets:', e);
    }
  }

  function renderMusicLibrary() {
    const container = document.getElementById('pro-music-library');
    if (!container) return;
    container.innerHTML = '';

    // "None" option
    const noneCard = document.createElement('div');
    noneCard.className = `music-card ${!proState.selectedMusic ? 'active' : ''}`;
    noneCard.innerHTML = `
      <div class="music-info">
        <strong>🚫 No Music</strong>
        <span>Original Speech Only</span>
      </div>
    `;
    noneCard.addEventListener('click', () => {
      proState.selectedMusic = null;
      bgMusicAudio.pause();
      renderMusicLibrary();
      updateMusicTimelineBlock();
      showToast('Music disabled');
    });
    container.appendChild(noneCard);

    (proState.audioAssets.music || []).forEach(m => {
      const card = document.createElement('div');
      const isActive = proState.selectedMusic && proState.selectedMusic.id === m.id;
      card.className = `music-card ${isActive ? 'active' : ''}`;
      card.innerHTML = `
        <div class="music-info">
          <strong>${m.name}</strong>
          <span>${m.category}</span>
        </div>
        <button type="button" class="btn-music-preview" title="Preview track">
          <i data-lucide="${isActive && !bgMusicAudio.paused ? 'pause' : 'play'}"></i>
        </button>
      `;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-music-preview')) {
          e.stopPropagation();
          toggleMusicAudition(m);
        } else {
          proState.selectedMusic = m;
          bgMusicAudio.src = m.url;
          bgMusicAudio.volume = proState.musicVolume;
          if (proState.isPlaying) bgMusicAudio.play().catch(() => {});
          renderMusicLibrary();
          updateMusicTimelineBlock();
          showToast(`Selected music: ${m.name}`);
        }
      });
      container.appendChild(card);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  function toggleMusicAudition(m) {
    if (bgMusicAudio.src.endsWith(m.url) && !bgMusicAudio.paused) {
      bgMusicAudio.pause();
    } else {
      bgMusicAudio.src = m.url;
      bgMusicAudio.volume = 0.5;
      bgMusicAudio.play().catch(() => {});
    }
    renderMusicLibrary();
  }

  function renderSfxLibrary() {
    const container = document.getElementById('pro-sfx-grid');
    if (!container) return;
    container.innerHTML = '';
    (proState.audioAssets.sfx || []).forEach(s => {
      const card = document.createElement('div');
      card.className = 'sfx-card';
      card.innerHTML = `
        <strong>${s.emoji || '🔊'} ${s.name}</strong>
        <div class="sfx-btn-actions">
          <button type="button" class="btn-sfx-play" title="Audition sound"><i data-lucide="volume-2"></i> Play</button>
          <button type="button" class="btn-sfx-add" title="Place on timeline at cursor"><i data-lucide="plus"></i> Add</button>
        </div>
      `;
      card.querySelector('.btn-sfx-play').addEventListener('click', (e) => {
        e.stopPropagation();
        sfxPreviewAudio.src = s.url;
        sfxPreviewAudio.currentTime = 0;
        sfxPreviewAudio.play().catch(() => {});
      });
      card.querySelector('.btn-sfx-add').addEventListener('click', (e) => {
        e.stopPropagation();
        addSfxToTimeline(s);
      });
      container.appendChild(card);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  function addSfxToTimeline(sfx) {
    const curTime = proVideo ? proVideo.currentTime : 0;
    const item = {
      id: 'sfx_' + Date.now(),
      sfx_id: sfx.id,
      name: sfx.name,
      emoji: sfx.emoji || '💥',
      time: Math.round(curTime * 10) / 10,
      url: sfx.url
    };
    proState.sfxList.push(item);
    renderActiveSfxList();
    renderTimelineTracks();
    showToast(`Added SFX hit at ${item.time}s!`);
  }

  function renderActiveSfxList() {
    const list = document.getElementById('pro-active-sfx-list');
    const countBadge = document.getElementById('pro-sfx-count');
    if (!list) return;
    if (countBadge) countBadge.textContent = proState.sfxList.length;

    if (proState.sfxList.length === 0) {
      list.innerHTML = '<span class="empty-hint">Click any sound effect above to place it at the current second.</span>';
      return;
    }
    list.innerHTML = '';
    proState.sfxList.forEach(item => {
      const row = document.createElement('div');
      row.className = 'active-sticker-row';
      row.innerHTML = `
        <span class="stk-meta">${item.emoji} ${item.name}</span>
        <span class="stk-time">@ ${item.time.toFixed(1)}s</span>
        <button type="button" class="btn-remove-stk" title="Delete hit">✕</button>
      `;
      row.querySelector('.btn-remove-stk').addEventListener('click', () => {
        proState.sfxList = proState.sfxList.filter(x => x.id !== item.id);
        renderActiveSfxList();
        renderTimelineTracks();
      });
      list.appendChild(row);
    });
  }

  // --- Sticker & Emoji Management ---
  function addSticker(emojiOrText, position = 'center', duration = 3.0) {
    const curTime = proVideo ? proVideo.currentTime : 0;
    const durVal = duration === 'all' ? (proState.duration - curTime) : parseFloat(duration);
    const item = {
      id: 'stk_' + Date.now(),
      text: emojiOrText,
      start: Math.round(curTime * 10) / 10,
      end: Math.min(proState.duration, Math.round((curTime + durVal) * 10) / 10),
      position: position,
      y: position === 'top' ? '380' : (position === 'bottom' ? '1400' : '650')
    };
    proState.stickers.push(item);
    renderActiveStickersList();
    renderTimelineTracks();
    updateLiveStickersOverlay(curTime);
    showToast(`Added ${emojiOrText} (${item.start}s - ${item.end}s)`);
  }

  function renderActiveStickersList() {
    const list = document.getElementById('pro-active-stickers-list');
    const countBadge = document.getElementById('pro-stickers-count');
    if (!list) return;
    if (countBadge) countBadge.textContent = proState.stickers.length;

    if (proState.stickers.length === 0) {
      list.innerHTML = '<span class="empty-hint">No stickers added yet. Click an emoji above to add one at the current playhead.</span>';
      return;
    }
    list.innerHTML = '';
    proState.stickers.forEach(stk => {
      const row = document.createElement('div');
      row.className = 'active-sticker-row';
      row.innerHTML = `
        <span class="stk-meta">${stk.text}</span>
        <span class="stk-time">${stk.start.toFixed(1)}s - ${stk.end.toFixed(1)}s (${stk.position})</span>
        <button type="button" class="btn-remove-stk" title="Delete layer">✕</button>
      `;
      row.querySelector('.btn-remove-stk').addEventListener('click', () => {
        proState.stickers = proState.stickers.filter(s => s.id !== stk.id);
        renderActiveStickersList();
        renderTimelineTracks();
        updateLiveStickersOverlay(proVideo ? proVideo.currentTime : 0);
      });
      list.appendChild(row);
    });
  }

  function updateLiveStickersOverlay(sec) {
    if (!proStickersOverlay) return;
    proStickersOverlay.innerHTML = '';
    proState.stickers.forEach(stk => {
      if (sec >= stk.start && sec <= stk.end) {
        const el = document.createElement('div');
        el.className = `pro-live-sticker pos-${stk.position}`;
        el.innerHTML = `
          <div class="sticker-badge-box">
            <span>${stk.text}</span>
            <button type="button" class="sticker-del-btn" title="Delete">✕</button>
          </div>
        `;
        el.querySelector('.sticker-del-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          proState.stickers = proState.stickers.filter(s => s.id !== stk.id);
          renderActiveStickersList();
          renderTimelineTracks();
          updateLiveStickersOverlay(sec);
        });
        proStickersOverlay.appendChild(el);
      }
    });
  }

  // --- KineMaster Multi-Track Timeline Renderer ---
  function renderTimelineRuler() {
    if (!tlRuler) return;
    tlRuler.innerHTML = '';
    const dur = Math.max(10, Math.ceil(proState.duration));
    const step = dur > 40 ? 5 : 2;

    for (let t = 0; t <= dur; t += step) {
      const pct = (t / dur) * 100;
      const tick = document.createElement('div');
      tick.className = 'ruler-tick';
      tick.style.left = `${pct}%`;
      tick.textContent = `${t}s`;
      tlRuler.appendChild(tick);
    }
  }

  function renderTimelineTracks() {
    const dur = Math.max(1.0, proState.duration);

    // Track 1: Video
    const videoBlock = document.getElementById('tl-video-block');
    const videoDurTag = document.getElementById('tl-video-dur-tag');
    if (videoBlock) {
      videoBlock.style.left = '0%';
      videoBlock.style.width = '100%';
    }
    if (videoDurTag) videoDurTag.textContent = `${dur.toFixed(1)}s`;

    // Track 2: Subtitles
    const subLane = document.getElementById('track-lane-captions');
    if (subLane) {
      subLane.innerHTML = '';
      const subs = (proState.activeClip && proState.activeClip.subtitles) || [];
      subs.forEach(s => {
        const sStart = Math.max(0, s.start);
        const sEnd = Math.min(dur, s.end);
        const leftPct = (sStart / dur) * 100;
        const widthPct = Math.max(2, ((sEnd - sStart) / dur) * 100);

        const blk = document.createElement('div');
        blk.className = 'track-clip-block sub-block';
        blk.style.left = `${leftPct}%`;
        blk.style.width = `${widthPct}%`;
        blk.title = s.text;
        blk.textContent = s.text;
        blk.addEventListener('click', (e) => {
          e.stopPropagation();
          seekProVideo(sStart);
        });
        subLane.appendChild(blk);
      });
    }

    // Track 3: Music
    updateMusicTimelineBlock();

    // Track 4: Stickers
    const stkLane = document.getElementById('track-lane-stickers');
    if (stkLane) {
      stkLane.innerHTML = '';
      proState.stickers.forEach(stk => {
        const leftPct = (stk.start / dur) * 100;
        const widthPct = Math.max(3, ((stk.end - stk.start) / dur) * 100);

        const blk = document.createElement('div');
        blk.className = 'track-clip-block sticker-block';
        blk.style.left = `${leftPct}%`;
        blk.style.width = `${widthPct}%`;
        blk.textContent = stk.text;
        blk.addEventListener('click', (e) => {
          e.stopPropagation();
          seekProVideo(stk.start);
        });
        stkLane.appendChild(blk);
      });
    }

    // Track 5: SFX
    const sfxLane = document.getElementById('track-lane-sfx');
    if (sfxLane) {
      sfxLane.innerHTML = '';
      proState.sfxList.forEach(s => {
        const leftPct = (s.time / dur) * 100;
        const blk = document.createElement('div');
        blk.className = 'track-clip-block sfx-block';
        blk.style.left = `${leftPct}%`;
        blk.style.width = '35px';
        blk.textContent = s.emoji || '💥';
        blk.addEventListener('click', (e) => {
          e.stopPropagation();
          seekProVideo(s.time);
          sfxPreviewAudio.src = s.url;
          sfxPreviewAudio.currentTime = 0;
          sfxPreviewAudio.play().catch(() => {});
        });
        sfxLane.appendChild(blk);
      });
    }
  }

  function updateMusicTimelineBlock() {
    const musicBlock = document.getElementById('tl-music-block');
    const musicEmpty = document.getElementById('tl-music-empty');
    const musicTitle = document.getElementById('tl-music-title');
    const musicVolTag = document.getElementById('tl-music-vol-tag');

    if (proState.selectedMusic) {
      if (musicBlock) {
        musicBlock.style.display = 'flex';
        musicBlock.style.width = '100%';
      }
      if (musicEmpty) musicEmpty.style.display = 'none';
      if (musicTitle) musicTitle.innerHTML = `<i data-lucide="music"></i> ${proState.selectedMusic.name}`;
      if (musicVolTag) musicVolTag.textContent = `Vol: ${Math.round(proState.musicVolume * 100)}%`;
    } else {
      if (musicBlock) musicBlock.style.display = 'none';
      if (musicEmpty) musicEmpty.style.display = 'flex';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function seekProVideo(sec) {
    if (!proVideo) return;
    proVideo.currentTime = Math.max(0, Math.min(proState.duration, sec));
    updateProPlayhead(proVideo.currentTime);
  }

  function updateProPlayhead(sec) {
    const dur = Math.max(1.0, proState.duration);
    const pct = Math.min(100, Math.max(0, (sec / dur) * 100));

    // Move needle: 120px header offset + percentage of remaining width
    if (tlPlayheadNeedle && tlTracksViewport) {
      const availableW = tlTracksViewport.clientWidth - 120;
      const xPos = 120 + (availableW * (pct / 100));
      tlPlayheadNeedle.style.left = `${xPos}px`;
    }

    if (tlPlayheadTime) {
      const m = Math.floor(sec / 60);
      const s = (sec % 60).toFixed(2);
      tlPlayheadTime.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    if (proTimecodeDisplay) {
      proTimecodeDisplay.textContent = `${formatSeconds(sec)} / ${formatSeconds(dur)}`;
    }

    // Sync Captions
    if (proCaptionActive && proState.activeClip && proState.activeClip.subtitles) {
      const match = proState.activeClip.subtitles.find(s => sec >= s.start && sec <= s.end);
      if (match) {
        proCaptionActive.textContent = `${match.text.toUpperCase()} ${match.emoji || ''}`.trim();
        proCaptionActive.style.display = 'inline-block';
      } else {
        proCaptionActive.style.display = 'none';
      }
    }

    // Sync Live Stickers
    updateLiveStickersOverlay(sec);
  }

  // Timeline Click / Scrubbing Listener
  if (tlTracksViewport) {
    tlTracksViewport.addEventListener('click', (e) => {
      const rect = tlTracksViewport.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX >= 120) {
        const availableW = rect.width - 120;
        const clickPct = (clickX - 120) / availableW;
        const targetSec = clickPct * proState.duration;
        seekProVideo(targetSec);
      }
    });
  }

  // --- Transport Controls ---
  const btnStepBack = document.getElementById('pro-btn-step-back');
  const btnStepFwd = document.getElementById('pro-btn-step-forward');
  const btnPlayToggle = document.getElementById('pro-btn-play-toggle');
  const proBtnPlayIcon = document.getElementById('pro-btn-play-icon');
  const btnMuteToggle = document.getElementById('pro-btn-mute-toggle');
  const proBtnMuteIcon = document.getElementById('pro-btn-mute-icon');
  const proSpeedSelect = document.getElementById('pro-speed-select');
  const proScreenWrapper = document.getElementById('pro-screen-wrapper');

  if (proScreenWrapper) proScreenWrapper.addEventListener('click', toggleProPlayback);
  if (btnPlayToggle) btnPlayToggle.addEventListener('click', toggleProPlayback);

  function toggleProPlayback() {
    if (!proVideo) return;
    if (proVideo.paused) {
      proVideo.play().catch(() => {});
      if (proState.selectedMusic) {
        bgMusicAudio.volume = proState.musicVolume;
        bgMusicAudio.play().catch(() => {});
      }
      proState.isPlaying = true;
      if (proPlayOverlay) proPlayOverlay.style.opacity = '0';
      if (proBtnPlayIcon) {
        proBtnPlayIcon.setAttribute('data-lucide', 'pause');
        if (window.lucide) window.lucide.createIcons();
      }
    } else {
      proVideo.pause();
      bgMusicAudio.pause();
      proState.isPlaying = false;
      if (proPlayOverlay) proPlayOverlay.style.opacity = '1';
      if (proBtnPlayIcon) {
        proBtnPlayIcon.setAttribute('data-lucide', 'play');
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  if (btnStepBack) {
    btnStepBack.addEventListener('click', () => {
      if (proVideo) seekProVideo(proVideo.currentTime - 1.0);
    });
  }
  if (btnStepFwd) {
    btnStepFwd.addEventListener('click', () => {
      if (proVideo) seekProVideo(proVideo.currentTime + 1.0);
    });
  }
  if (btnMuteToggle) {
    btnMuteToggle.addEventListener('click', () => {
      if (!proVideo) return;
      proState.isMuted = !proState.isMuted;
      proVideo.muted = proState.isMuted;
      if (proBtnMuteIcon) {
        proBtnMuteIcon.setAttribute('data-lucide', proState.isMuted ? 'volume-x' : 'volume-2');
        if (window.lucide) window.lucide.createIcons();
      }
      showToast(proState.isMuted ? 'Voice Muted' : 'Voice Unmuted');
    });
  }

  if (proSpeedSelect) {
    proSpeedSelect.addEventListener('change', (e) => {
      const spd = parseFloat(e.target.value) || 1.0;
      proState.speed = spd;
      if (proVideo) proVideo.playbackRate = spd;
      if (bgMusicAudio) bgMusicAudio.playbackRate = spd;
      showToast(`Playback Speed: ${spd}x`);
    });
  }

  if (proVideo) {
    proVideo.addEventListener('timeupdate', () => {
      updateProPlayhead(proVideo.currentTime);
    });
    proVideo.addEventListener('ended', () => {
      proVideo.currentTime = 0;
      proVideo.play().catch(() => {});
    });
  }

  // --- Inspector Tool Tabs Switching ---
  document.querySelectorAll('.pro-tab-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pro-tab-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pro-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      const target = document.getElementById(`tab-content-${tabId}`);
      if (target) target.classList.add('active');
    });
  });

  // --- VFX & Color Filters Switching ---
  document.querySelectorAll('.filter-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const f = card.getAttribute('data-filter');
      proState.vfxFilter = f;
      if (proFilterOverlay) {
        proFilterOverlay.className = `pro-filter-overlay filter-${f}`;
      }
      showToast(`Visual Filter: ${card.querySelector('span').textContent}`);
    });
  });

  // --- Music Volume & Voice Volume Sliders ---
  const voiceSlider = document.getElementById('pro-voice-volume');
  const musicSlider = document.getElementById('pro-music-volume');
  const voiceVal = document.getElementById('voice-vol-val');
  const musicVal = document.getElementById('music-vol-val');

  if (voiceSlider) {
    voiceSlider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      proState.voiceVolume = v / 100;
      if (voiceVal) voiceVal.textContent = `${v}%`;
    });
  }
  if (musicSlider) {
    musicSlider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      proState.musicVolume = v / 100;
      if (musicVal) musicVal.textContent = `${v}%`;
      bgMusicAudio.volume = proState.musicVolume;
      updateMusicTimelineBlock();
    });
  }

  // --- Quick Emojis & Badges ---
  document.querySelectorAll('.quick-emoji-btn').forEach(b => {
    b.addEventListener('click', () => {
      const em = b.getAttribute('data-emoji');
      const pos = document.getElementById('pro-sticker-pos') ? document.getElementById('pro-sticker-pos').value : 'center';
      const dur = document.getElementById('pro-sticker-dur') ? document.getElementById('pro-sticker-dur').value : '3.0';
      addSticker(em, pos, dur);
    });
  });

  document.querySelectorAll('.btn-badge-preset').forEach(b => {
    b.addEventListener('click', () => {
      const txt = b.getAttribute('data-text');
      const pos = document.getElementById('pro-sticker-pos') ? document.getElementById('pro-sticker-pos').value : 'top';
      const dur = document.getElementById('pro-sticker-dur') ? document.getElementById('pro-sticker-dur').value : '3.0';
      addSticker(txt, pos, dur);
    });
  });

  const btnAddSticker = document.getElementById('pro-btn-add-sticker');
  const customStickerInput = document.getElementById('pro-sticker-custom-text');
  if (btnAddSticker && customStickerInput) {
    btnAddSticker.addEventListener('click', () => {
      const val = customStickerInput.value.trim();
      if (!val) return;
      const pos = document.getElementById('pro-sticker-pos') ? document.getElementById('pro-sticker-pos').value : 'center';
      const dur = document.getElementById('pro-sticker-dur') ? document.getElementById('pro-sticker-dur').value : '3.0';
      addSticker(val, pos, dur);
      customStickerInput.value = '';
    });
  }

  // --- Hook Banner live update ---
  const proBannerInput = document.getElementById('pro-banner-input');
  if (proBannerInput) {
    proBannerInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (proHookBanner) {
        proHookBanner.style.display = val ? 'block' : 'none';
      }
      if (proHookBannerText) {
        proHookBannerText.textContent = val;
      }
    });
  }

  document.querySelectorAll('.hook-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const h = pill.getAttribute('data-hook');
      if (proBannerInput) proBannerInput.value = h;
      if (proHookBanner) proHookBanner.style.display = 'block';
      if (proHookBannerText) proHookBannerText.textContent = h;
      showToast('Hook headline updated!');
    });
  });

  // --- Cut & Trim Actions ---
  const btnSplitPlayhead = document.getElementById('pro-btn-split-at-playhead');
  const btnTrimLeft = document.getElementById('pro-btn-trim-left');
  const btnTrimRight = document.getElementById('pro-btn-trim-right');
  const btnResetCuts = document.getElementById('pro-btn-reset-cuts');
  const trimStartIn = document.getElementById('pro-trim-start');
  const trimEndIn = document.getElementById('pro-trim-end');
  const durCalc = document.getElementById('pro-duration-calc');

  if (btnSplitPlayhead) {
    btnSplitPlayhead.addEventListener('click', () => {
      const cur = proVideo ? proVideo.currentTime : 0;
      showToast(`✂️ Split marker dropped at ${cur.toFixed(1)}s!`);
      renderTimelineTracks();
    });
  }

  if (btnTrimLeft) {
    btnTrimLeft.addEventListener('click', () => {
      const cur = proVideo ? proVideo.currentTime : 0;
      if (trimStartIn) trimStartIn.value = cur.toFixed(1);
      proState.startTime = cur;
      updateTrimDurationCalc();
      showToast(`Trimmed Start to ${cur.toFixed(1)}s`);
    });
  }

  if (btnTrimRight) {
    btnTrimRight.addEventListener('click', () => {
      const cur = proVideo ? proVideo.currentTime : 30;
      if (trimEndIn) trimEndIn.value = cur.toFixed(1);
      proState.endTime = cur;
      updateTrimDurationCalc();
      showToast(`Trimmed End to ${cur.toFixed(1)}s`);
    });
  }

  if (btnResetCuts) {
    btnResetCuts.addEventListener('click', () => {
      if (proState.activeClip) {
        proState.startTime = proState.activeClip.start_time || 0;
        proState.endTime = proState.activeClip.end_time || 30;
        proState.duration = proState.activeClip.duration || 30;
        if (trimStartIn) trimStartIn.value = proState.startTime.toFixed(1);
        if (trimEndIn) trimEndIn.value = proState.endTime.toFixed(1);
        updateTrimDurationCalc();
        renderTimelineTracks();
        renderTimelineRuler();
        showToast('Timeline cuts reset to original clip!');
      }
    });
  }

  function updateTrimDurationCalc() {
    const s = parseFloat(trimStartIn.value) || 0;
    const e = parseFloat(trimEndIn.value) || 30;
    const d = Math.max(1, e - s);
    proState.duration = d;
    if (durCalc) durCalc.textContent = `${d.toFixed(1)}s`;
    renderTimelineRuler();
    renderTimelineTracks();
  }

  // --- Open & Close Pro Editor ---
  window.openProEditor = function(clip = null) {
    if (subscriptionState.tier !== 'ultra' && subscriptionState.tier !== 'dev') {
      showToast('🔒 KineMaster Pro Editor requires Ultra Tier (₹50). Upgrade to unlock!');
      window.openSubscriptionModal('ultra');
      return;
    }

    const targetClip = clip || state.activeClip || (state.currentClips && state.currentClips[0]);
    if (!targetClip) {
      showToast('Please analyze a video and pick a clip first!');
      return;
    }
    proState.activeClip = targetClip;
    proState.startTime = targetClip.start_time || 0;
    proState.endTime = targetClip.end_time || 30;
    proState.duration = targetClip.duration || 30;

    const clipNameEl = document.getElementById('pro-active-clip-name');
    if (clipNameEl) clipNameEl.textContent = `Clip: ${targetClip.title}`;

    if (trimStartIn) trimStartIn.value = proState.startTime.toFixed(1);
    if (trimEndIn) trimEndIn.value = proState.endTime.toFixed(1);
    if (durCalc) durCalc.textContent = `${proState.duration.toFixed(1)}s`;

    // Hook banner
    if (proHookBanner && proHookBannerText) {
      const bannerVal = targetClip.hook_banner || 'WAIT TILL THE END 💀';
      proHookBanner.style.display = 'block';
      proHookBannerText.textContent = bannerVal;
      if (proBannerInput) proBannerInput.value = bannerVal;
    }

    // Set video source
    if (proVideo) {
      const srcUrl = targetClip.video_url || (state.currentVideoMeta && state.currentVideoMeta.video_url) || '/assets/sample_clip.mp4';
      if (!proVideo.src.endsWith(srcUrl)) {
        proVideo.src = srcUrl;
        proVideo.load();
      }
      proVideo.currentTime = 0;

      if (!targetClip.video_url && state.currentVideoMeta && !state.currentVideoMeta.is_sample) {
        ensureClipVideoReady(targetClip).then(url => {
          if (url && proVideo) {
            proVideo.src = url;
            proVideo.load();
          }
        });
      }
    }

    if (proSection) {
      proSection.style.display = 'block';
      proSection.scrollIntoView({ behavior: 'smooth' });
    }

    renderTimelineRuler();
    renderTimelineTracks();
    renderActiveStickersList();
    renderActiveSfxList();
    updateProPlayhead(0);

    if (window.lucide) window.lucide.createIcons();
    showToast('🎬 KineMaster Pro Editor activated!');
  };

  window.closeProEditor = function() {
    if (proVideo) proVideo.pause();
    if (bgMusicAudio) bgMusicAudio.pause();
    proState.isPlaying = false;
    if (proSection) proSection.style.display = 'none';
    if (studioSection) studioSection.scrollIntoView({ behavior: 'smooth' });
  };

  // Nav Bar and Header Triggers
  const navPro = document.getElementById('nav-link-pro');
  if (navPro) {
    navPro.addEventListener('click', (e) => {
      e.preventDefault();
      openProEditor();
    });
  }

  const btnOpenProTop = document.getElementById('btn-open-pro-top');
  if (btnOpenProTop) {
    btnOpenProTop.addEventListener('click', () => {
      openProEditor();
    });
  }

  const btnBackStudio = document.getElementById('pro-btn-back-studio');
  if (btnBackStudio) {
    btnBackStudio.addEventListener('click', closeProEditor);
  }

  // Timeline Toolbar Actions
  const tlBtnSplit = document.getElementById('tl-btn-split');
  if (tlBtnSplit) {
    tlBtnSplit.addEventListener('click', () => {
      const cur = proVideo ? proVideo.currentTime : 0;
      showToast(`✂️ Split at ${cur.toFixed(1)}s!`);
    });
  }
  const tlBtnAddMusic = document.getElementById('tl-btn-add-music');
  if (tlBtnAddMusic) {
    tlBtnAddMusic.addEventListener('click', () => {
      const musicTab = document.querySelector('.pro-tab-item[data-tab="music"]');
      if (musicTab) musicTab.click();
    });
  }
  const tlBtnAddSticker = document.getElementById('tl-btn-add-sticker');
  if (tlBtnAddSticker) {
    tlBtnAddSticker.addEventListener('click', () => {
      const stickerTab = document.querySelector('.pro-tab-item[data-tab="stickers"]');
      if (stickerTab) stickerTab.click();
    });
  }
  const tlBtnClear = document.getElementById('tl-btn-clear');
  if (tlBtnClear) {
    tlBtnClear.addEventListener('click', () => {
      proState.stickers = [];
      proState.sfxList = [];
      proState.selectedMusic = null;
      bgMusicAudio.pause();
      renderActiveStickersList();
      renderActiveSfxList();
      renderMusicLibrary();
      renderTimelineTracks();
      updateLiveStickersOverlay(proVideo ? proVideo.currentTime : 0);
      showToast('All overlay layers cleared!');
    });
  }

  // --- Render Short in Pro Editor ---
  const btnProRender = document.getElementById('pro-btn-render');
  if (btnProRender) {
    btnProRender.addEventListener('click', triggerProRender);
  }

  async function triggerProRender() {
    if (subscriptionState.tier !== 'ultra' && subscriptionState.tier !== 'dev') {
      showToast('🔒 Pro Rendering requires Ultra Tier (₹50). Upgrade to unlock!');
      window.openSubscriptionModal('ultra');
      return;
    }

    if (!proState.activeClip) {
      showToast('No active clip selected!');
      return;
    }

    if (btnProRender) {
      btnProRender.disabled = true;
      btnProRender.innerHTML = '<i data-lucide="loader"></i> <span>Rendering Short...</span>';
      if (window.lucide) window.lucide.createIcons();
    }

    if (studioSection) studioSection.style.display = 'block';
    if (renderResultBox) {
      renderResultBox.style.display = 'flex';
      renderResultBox.scrollIntoView({ behavior: 'smooth' });
    }
    if (renderSpinner) renderSpinner.style.display = 'block';
    if (renderStatusTitle) renderStatusTitle.textContent = 'Rendering Short with KineMaster Pro Effects...';
    if (renderStatusSub) renderStatusSub.textContent = 'Compositing background music, cinematic VFX filters, emojis & 60fps Hormozi subtitles';
    if (downloadShortLink) downloadShortLink.style.display = 'none';

    const payload = {
      clip_id: proState.activeClip.clip_id,
      video_id: (state.currentVideoMeta && state.currentVideoMeta.video_id) || 'clip',
      start_time: parseFloat(trimStartIn ? trimStartIn.value : proState.startTime) || 0.0,
      end_time: parseFloat(trimEndIn ? trimEndIn.value : proState.endTime) || 30.0,
      layout_mode: state.selectedLayout || 'crop',
      subtitle_style: state.selectedSubStyle || 'hormozi',
      hook_banner: proBannerInput ? proBannerInput.value.trim() : null,
      subtitles: proState.activeClip.subtitles || [],
      source_file: proState.activeClip.source_file || (state.currentVideoMeta && state.currentVideoMeta.source_file) || null,
      vfx_filter: proState.vfxFilter || 'normal',
      music_track: proState.selectedMusic ? proState.selectedMusic.id : null,
      music_volume: proState.musicVolume,
      speech_volume: proState.voiceVolume,
      stickers: proState.stickers.map(s => ({
        text: s.text,
        start: s.start,
        end: s.end,
        y: s.position === 'top' ? '380' : (s.position === 'bottom' ? '1400' : '650'),
        fontsize: 54
      })),
      speed: proState.speed || 1.0
    };

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Render failed' }));
        throw new Error(err.detail || 'FFmpeg error');
      }
      const data = await res.json();

      if (renderSpinner) renderSpinner.style.display = 'none';
      if (renderStatusTitle) renderStatusTitle.textContent = '🎉 Pro Video Rendered Successfully!';
      if (renderStatusSub) renderStatusSub.textContent = `1080x1920 60FPS • File size: ${data.file_size_mb} MB • Duration: ${data.duration}s`;

      const fullClipUrl = window.location.origin + data.download_url;
      const renderActionsRow = document.getElementById('render-actions-row');
      const openClipTabLink = document.getElementById('open-clip-tab-link');
      const clipLinkBox = document.getElementById('clip-link-box');
      const directClipUrlInput = document.getElementById('direct-clip-url-input');

      if (downloadShortLink) {
        downloadShortLink.href = data.download_url;
        downloadShortLink.download = data.filename || 'viral_short_pro.mp4';
        downloadShortLink.style.display = 'inline-flex';
      }
      if (openClipTabLink) openClipTabLink.href = data.download_url;
      if (directClipUrlInput) directClipUrlInput.value = fullClipUrl;
      if (renderActionsRow) renderActionsRow.style.display = 'flex';
      if (clipLinkBox) clipLinkBox.style.display = 'flex';

      showToast('✨ Pro Short Render Complete! Download ready.');
    } catch (err) {
      if (renderSpinner) renderSpinner.style.display = 'none';
      if (renderStatusTitle) renderStatusTitle.textContent = '❌ Rendering Failed';
      if (renderStatusSub) renderStatusSub.textContent = err.message;
      showToast('Rendering error: ' + err.message);
    } finally {
      if (btnProRender) {
        btnProRender.disabled = false;
        btnProRender.innerHTML = '<i data-lucide="download"></i> Render Short (Pro)';
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  // Scroll Helpers
  window.scrollToClipper = function() {
    const el = document.getElementById('clipper-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  window.toggleCustomPrompt = function() {
    const body = document.getElementById('custom-prompt-body');
    const chevron = document.getElementById('prompt-chevron');
    if (!body) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  };
});
