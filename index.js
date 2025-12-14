const API_CONFIG = {
    key: "AIzaSyDIR2eQVBzW3VsYlyX0rQqG2kKqvgla1sE",
    channelId: "UCsM3kc7cmzJ92a3A3y2wunw",
    goal: 1000000,
    cacheKey: "cubic_hub_cache_v1",
    cacheDuration: 3600000
};

const ASSETS = {
    errorImage: "assests/images/HUB_news/API_ERROR.webp",
    milestoneImages: {
        discord: "assests/images/Milestone_Bar_Images/Unlock_Discord.webp",
        patreon: "assests/images/Milestone_Bar_Images/Unlock_Patreon.webp",
        newShow: "assests/images/Milestone_Bar_Images/Unlock_NewShow.webp",
        newSeries: "assests/images/Milestone_Bar_Images/Unlock_NewSeries.webp"
    }
};

window.addEventListener('load', async () => {

    setTimeout(() => {
        const cssLink = document.getElementById('main-css');
        if (cssLink) {
            cssLink.href = 'index.css';
        }
        initScrollAnimations();
    }, 3000);

    const data = await getYouTubeData();

    if (data) {
        renderLatestVideo(data.latestVideo);
        renderSwiper(data.swiperVideos);
        updateProgressBar(data.subscriberCount);
    } else {
        renderFallback();
    }
});

function initScrollAnimations() {
    const triggers = document.querySelectorAll('.scroll-trigger');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px"
    });

    triggers.forEach(trigger => {
        observer.observe(trigger);
    });
}

async function getYouTubeData() {
    const now = Date.now();
    const cached = localStorage.getItem(API_CONFIG.cacheKey);

    if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        const age = now - timestamp;
        if (age < API_CONFIG.cacheDuration) {
            console.log(`Using Cached Data (Expires in ${Math.round((API_CONFIG.cacheDuration - age) / 60000)}m)`);
            return data;
        }
    }

    console.log("Cache expired or missing. Fetching from API...");
    try {
        const [videos, subCount] = await Promise.all([
            fetchVideosFromAPI(),
            fetchSubscriberCountFromAPI()
        ]);

        if (!videos || !videos.length || subCount === null) throw new Error("Incomplete API data");

        const newData = {
            latestVideo: videos[0],
            swiperVideos: videos.slice(1, 9),
            subscriberCount: subCount
        };

        localStorage.setItem(API_CONFIG.cacheKey, JSON.stringify({
            timestamp: now,
            data: newData
        }));

        return newData;

    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
}

async function fetchVideosFromAPI() {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_CONFIG.key}&channelId=${API_CONFIG.channelId}&part=id&order=date&maxResults=15&type=video`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items?.length) return [];

    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_CONFIG.key}&part=snippet,contentDetails,liveStreamingDetails&id=${videoIds}`;
    const videoRes = await fetch(videoUrl);
    const videoData = await videoRes.json();

    return videoData.items
        .filter(video => !video.liveStreamingDetails)
        .map(video => {
            const thumbnails = video.snippet.thumbnails;
            return {
                id: video.id,
                title: video.snippet.title,
                duration: parseDuration(video.contentDetails.duration),
                thumbnail: thumbnails.maxres?.url || thumbnails.standard?.url || thumbnails.high?.url || thumbnails.medium?.url
            };
        });
}

async function fetchSubscriberCountFromAPI() {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${API_CONFIG.channelId}&key=${API_CONFIG.key}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.items ? parseInt(data.items[0].statistics.subscriberCount) : null;
}

function renderFallback() {
    const latestContainer = document.getElementById('latest-upload-container');
    const swiperContainer = document.getElementById('swiper-container');
    const statusElement = document.getElementById('progress-status');
    const subProgress = document.getElementById('sub-progress');

    latestContainer.innerHTML = `
        <div class="Latest-Upload">
            <a href="https://www.youtube.com/channel/${API_CONFIG.channelId}" target="_blank">
                <img src="${ASSETS.errorImage}" alt="API Error - Check Youtube" class="Latest Thumbnail">
                <div class="latest-title-overlay">
                    <h2 class="latest-title-text">More on Youtube</h2>
                </div>
            </a>
        </div>
    `;

    swiperContainer.innerHTML = `
        <div class="card-item swiper-slide">
             <a href="https://www.youtube.com/channel/${API_CONFIG.channelId}" target="_blank">
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: #222; aspect-ratio: 16/9; color: white;">
                    Visit Channel
                </div>
            </a>
        </div>
    `;
    initSwiper();

    statusElement.textContent = "Subscribe on Youtube!";
    subProgress.style.width = '0%';
    createMilestoneMarkers(0);
}

function renderLatestVideo(video) {
    const container = document.getElementById('latest-upload-container');
    const overlayImage = 'assests/images/HUB_news/newest_upload.webp';

    container.innerHTML = `
        <div class="Latest-Upload">
            <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank">
                <img src="${video.thumbnail}" alt="${video.title}" class="Latest Thumbnail">
                <img src="${overlayImage}" class="latest-overlay" alt="Overlay">
                <div class="latest-title-overlay">
                    <h2 class="latest-title-text">${video.title}</h2>
                </div>
            </a>
        </div>
    `;
}

function renderSwiper(videos) {
    const container = document.getElementById('swiper-container');
    const html = videos.map(video => `
        <div class="card-item swiper-slide">
            <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank">
                <img src="${video.thumbnail}" alt="${video.title}" class="video thumbnail">
                <div class="swiper-hover-overlay">
                    <span class="swiper-video-duration">${video.duration}</span>
                    <div class="swiper-video-title">${video.title}</div>
                </div>
            </a>
        </div>
    `).join('');

    container.innerHTML = html;
    initSwiper();
}

function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    let result = '';
    if (hours) {
        result += hours + ':' + (minutes ? minutes.padStart(2, '0') : '00') + ':';
    } else {
        result += (minutes || '0') + ':';
    }
    result += seconds ? seconds.padStart(2, '0') : '00';
    return result;
}

function initSwiper() {
    new Swiper('.slider-wrapper', {
        loop: false,
        spaceBetween: 20,
        pagination: { el: '.swiper-pagination', clickable: true },
        breakpoints: {
            0: { slidesPerView: 2 },
            480: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 4 }
        }
    });
}

function updateProgressBar(currentSubs) {
    const subProgress = document.getElementById('sub-progress');
    const statusElement = document.getElementById('progress-status');
    const milestoneWrapper = document.querySelector('.milestone-wrapper');

    const percentage = Math.min((currentSubs / API_CONFIG.goal) * 100, 100);

    createMilestoneMarkers(currentSubs);

    setTimeout(() => { subProgress.style.width = percentage + '%'; }, 500);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateValue(statusElement, 0, currentSubs, 2000);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(milestoneWrapper);
}

function createMilestoneMarkers(currentSubs) {
    const svgContainer = document.getElementById('milestone-lines');
    const contentContainer = document.getElementById('milestone-content');

    svgContainer.innerHTML = '';
    contentContainer.innerHTML = '';
    svgContainer.setAttribute('viewBox', '0 0 100 100');
    svgContainer.setAttribute('preserveAspectRatio', 'none');

    const MILESTONES = [
        { value: 1000, label: "1K: Opening Discord Server", images: [ASSETS.milestoneImages.discord] },
        { value: 100000, label: "100K: Opening Patreon + ???", images: [ASSETS.milestoneImages.patreon] },
        { value: 500000, label: "500K: Tour of the Studio + ???", images: [ASSETS.milestoneImages.newShow] },
        { value: 1000000, label: "1M: ???", images: [ASSETS.milestoneImages.newSeries] }
    ];

    const sortedMilestones = MILESTONES.sort((a, b) => a.value - b.value);
    const nextMilestone = sortedMilestones.find(m => m.value > currentSubs);
    const totalMilestones = sortedMilestones.length;

    sortedMilestones.forEach((milestone, index) => {
        const realPercentage = Math.min((milestone.value / API_CONFIG.goal) * 100, 100);
        const visualPercentage = 12 + ((index / (totalMilestones - 1)) * 76);

        const isCompleted = currentSubs >= milestone.value;
        const isNext = nextMilestone && nextMilestone.value === milestone.value;
        const isOneMillion = milestone.value === 1000000;
        const isAbove = index % 2 === 0;

        let styleClass = isCompleted ? 'completed' : 'upcoming';
        let extraText = '';

        if (isOneMillion) {
            styleClass += ' gold';
            if (isNext) extraText = 'COMING UP';
        } else if (isNext) {
            styleClass += ' shiny-blue';
            extraText = 'COMING NEXT';
        }

        const startX = realPercentage;
        const startY = 50;
        const endX = visualPercentage;
        const endY = isAbove ? 25 : 75;
        const midY = (startY + endY) / 2;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `M ${startX} ${startY} V ${midY} H ${endX} V ${endY}`;
        path.setAttribute("d", d);
        path.setAttribute("class", `connector-line ${isNext ? 'active' : ''}`);
        svgContainer.appendChild(path);

        const marker = document.createElement('div');
        marker.className = `milestone-marker-item ${styleClass} ${isAbove ? 'marker-above' : 'marker-below'}`;
        marker.style.left = `${visualPercentage}%`;

        let contentHTML = `
            <div class="marker-label">${milestone.label}</div>
            ${extraText ? `<div class="marker-extra">${extraText}</div>` : ''}
        `;

        if (milestone.images && milestone.images.length > 0) {
            contentHTML += `<div class="marker-images">${milestone.images.map(src => `<img src="${src}" alt="Milestone">`).join('')}</div>`;
        }

        marker.innerHTML = contentHTML;
        contentContainer.appendChild(marker);
    });
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        obj.textContent = `${currentValue.toLocaleString()} Subscribers`;
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.textContent = `${end.toLocaleString()} Subscribers`;
    };
    window.requestAnimationFrame(step);
}

/* Bubby Was Here */
