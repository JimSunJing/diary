// ========== Three.js Flowing Background ==========
let scene, camera, renderer, clock;
let flowMesh, particles;
let mouseX = 0, mouseY = 0;

function initThree() {
    const canvas = document.getElementById('three-canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 5;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xe8e2db, 1);

    clock = new THREE.Clock();

    // Create flowing wave mesh
    const geometry = new THREE.PlaneGeometry(80, 80, 128, 128);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uColor1: { value: new THREE.Color('#d4c8b8') },
            uColor2: { value: new THREE.Color('#b8c8d4') },
            uColor3: { value: new THREE.Color('#d4b8c0') },
            uColor4: { value: new THREE.Color('#c8d4b8') },
        },
        vertexShader: `
            uniform float uTime;
            uniform vec2 uMouse;
            varying vec2 vUv;
            varying float vElevation;

            //	Simplex 3D Noise
            vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

            float snoise(vec3 v){
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                vec3 x1 = x0 - i1 + 1.0 * C.xxx;
                vec3 x2 = x0 - i2 + 2.0 * C.xxx;
                vec3 x3 = x0 - 1. + 3.0 * C.xxx;
                i = mod(i, 289.0);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                float n_ = 1.0/7.0;
                vec3 ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                vec4 x = x_ * ns.x + ns.yyyy;
                vec4 y = y_ * ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }

            void main() {
                vUv = uv;
                vec3 pos = position;

                float mouseInfluence = smoothstep(15.0, 0.0, length(pos.xy - uMouse * 20.0));

                float elevation = snoise(vec3(pos.x * 0.06, pos.y * 0.06, uTime * 0.15)) * 2.5;
                elevation += snoise(vec3(pos.x * 0.12 + 10.0, pos.y * 0.12, uTime * 0.2)) * 1.2;
                elevation += snoise(vec3(pos.x * 0.25, pos.y * 0.25, uTime * 0.25)) * 0.5;
                elevation += mouseInfluence * 2.0;

                pos.z = elevation;
                vElevation = elevation;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec3 uColor4;
            varying vec2 vUv;
            varying float vElevation;

            void main() {
                float mixStrength = (vElevation + 4.0) / 8.0;

                vec3 color = mix(uColor1, uColor2, vUv.x);
                color = mix(color, uColor3, vUv.y * 0.6);
                color = mix(color, uColor4, smoothstep(-0.5, 2.5, vElevation) * 0.4);

                float brightness = 0.92 + vElevation * 0.03;
                color *= brightness;

                float alpha = 0.6 + vElevation * 0.08;
                alpha = clamp(alpha, 0.35, 0.85);

                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        wireframe: false,
    });

    flowMesh = new THREE.Mesh(geometry, material);
    flowMesh.rotation.x = -Math.PI / 2.5;
    flowMesh.position.y = -8;
    scene.add(flowMesh);

    // Floating particles
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        sizes[i] = Math.random() * 2 + 0.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: `
            uniform float uTime;
            uniform float uPixelRatio;
            attribute float size;

            void main() {
                vec3 pos = position;
                pos.y += sin(uTime * 0.3 + position.x * 0.5) * 1.5;
                pos.x += cos(uTime * 0.2 + position.z * 0.3) * 1.0;

                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * uPixelRatio * (20.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;

                float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                alpha *= 0.15;
                gl_FragColor = vec4(vec3(0.72, 0.68, 0.64), alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Event listeners
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    if (flowMesh) {
        flowMesh.material.uniforms.uTime.value = elapsed;
        flowMesh.material.uniforms.uMouse.value.x += (mouseX - flowMesh.material.uniforms.uMouse.value.x) * 0.02;
        flowMesh.material.uniforms.uMouse.value.y += (mouseY - flowMesh.material.uniforms.uMouse.value.y) * 0.02;
    }

    if (particles) {
        particles.material.uniforms.uTime.value = elapsed;
        particles.rotation.y = elapsed * 0.02;
    }

    camera.position.x += (mouseX * 2 - camera.position.x) * 0.01;
    camera.position.y += (mouseY * 1.5 + 5 - camera.position.y) * 0.01;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

// ========== Templates ==========
const templates = {
    freestyle: {
        id: 'freestyle',
        name: '自由书写',
        icon: '📝',
        description: '没有任何限制，自由记录此刻的想法',
        title: '',
        content: ''
    },
    gratitude: {
        id: 'gratitude',
        name: '三件好事',
        icon: '✨',
        description: '记录今天让你感恩或开心的事情',
        title: '今日三件好事',
        content: '1. \n\n2. \n\n3. '
    },
    morning: {
        id: 'morning',
        name: '晨间记录',
        icon: '🌅',
        description: '开启新的一天，设定今日目标',
        title: '晨间记录',
        content: '【今日目标】\n\n\n【今日期待】\n\n\n【此刻心情】\n'
    },
    evening: {
        id: 'evening',
        name: '晚间反思',
        icon: '🌙',
        description: '回顾一天，总结收获与感悟',
        title: '晚间反思',
        content: '【今日高光】\n\n\n【学到的事】\n\n【明天改进】\n'
    },
    weekly: {
        id: 'weekly',
        name: '周记',
        icon: '📅',
        description: '回顾一周，规划未来',
        title: '本周回顾',
        content: '【本周成就】\n\n\n【本周挑战】\n\n【下周计划】\n\n【感恩时刻】\n'
    },
    random: {
        id: 'random',
        name: '深度思考',
        icon: '🤔',
        description: '随机深度问题，探索内心世界',
        getTitle: () => '深度思考',
        getContent: () => {
            const prompts = [
                '如果今天可以重来，我会...\n\n',
                '一个月后的我，希望今天的我做了什么？\n\n',
                '最近我一直在逃避的事情是...\n\n',
                '我想对一年后的自己说...\n\n',
                '如果没有任何限制，我最想做的事情是...\n\n',
                '最近让我焦虑的事情是...\n\n',
                '我最欣赏自己的三个特质是...\n\n',
                '如果可以给过去的自己一个建议，我会说...\n\n',
                '我理想中的生活是什么样子的？\n\n',
                '最近我最大的成长是...\n\n'
            ];
            return prompts[Math.floor(Math.random() * prompts.length)];
        }
    }
};

let selectedTemplate = 'freestyle';

// ========== Diary App Logic ==========
let diaries = [];
let currentDiaryId = null;
let autoSaveTimeout = null;
let searchTimeout = null;
let searchTerm = '';
let isElectron = false;

// Check if running in Electron
if (window.electronAPI) {
    isElectron = true;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function loadDiaries() {
    if (isElectron) {
        // Load from file via Electron
        const result = await window.electronAPI.loadDiaries();
        if (result.success) {
            diaries = result.data || [];
        } else {
            console.error('Failed to load diaries:', result.error);
            // Fallback to localStorage
            const stored = localStorage.getItem('flowDiaries');
            if (stored) {
                diaries = JSON.parse(stored);
            }
        }
    } else {
        // Load from localStorage (browser mode)
        const stored = localStorage.getItem('flowDiaries');
        if (stored) {
            diaries = JSON.parse(stored);
        }
    }
    updateSidebar();
    updateStats();
}

async function saveDiaries() {
    if (isElectron) {
        // Save to file via Electron
        const result = await window.electronAPI.saveDiaries(diaries);
        if (!result.success) {
            console.error('Failed to save diaries:', result.error);
            // Fallback to localStorage
            localStorage.setItem('flowDiaries', JSON.stringify(diaries));
        }
    } else {
        // Save to localStorage (browser mode)
        localStorage.setItem('flowDiaries', JSON.stringify(diaries));
    }
}

function createNewDiary() {
    // Show template selector
    openTemplateModal();
}

function createDiaryWithTemplate(templateId) {
    const template = templates[templateId];
    if (!template) return;
    
    const now = new Date();
    const content = template.getContent ? template.getContent() : template.content;
    
    const diary = {
        id: generateId(),
        title: template.getTitle ? template.getTitle() : template.title,
        content: content,
        mood: '',
        weather: '',
        tags: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };
    diaries.unshift(diary);
    saveDiaries();
    openDiary(diary.id);
    updateSidebar();
    updateStats();
    closeTemplateModal();
}

// Template Modal Functions
function openTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (modal) {
        modal.classList.add('active');
        renderTemplates();
    }
}

function closeTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderTemplates() {
    const container = document.getElementById('templateList');
    if (!container) return;
    
    container.innerHTML = Object.values(templates).map(template => `
        <div class="template-card" onclick="selectTemplate('${template.id}')">
            <div class="template-icon">${template.icon}</div>
            <div class="template-name">${template.name}</div>
            <div class="template-desc">${template.description}</div>
        </div>
    `).join('');
}

function selectTemplate(templateId) {
    createDiaryWithTemplate(templateId);
}

function openDiary(id) {
    currentDiaryId = id;
    const diary = diaries.find(d => d.id === id);
    if (!diary) return;

    document.getElementById('welcomeScreen').style.display = 'none';
    const panel = document.getElementById('editorPanel');
    panel.style.display = 'flex';

    const date = new Date(diary.createdAt);
    const dateStr = date.toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric',
        weekday: 'long'
    });
    const timeStr = date.toLocaleTimeString('zh-CN', {
        hour: '2-digit', minute: '2-digit'
    });
    document.getElementById('editorDate').textContent = `${dateStr} ${timeStr}`;

    document.getElementById('titleInput').value = diary.title;
    document.getElementById('contentEditor').value = diary.content;

    // Mood
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mood === diary.mood);
    });

    // Weather
    document.querySelectorAll('.weather-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.weather === diary.weather);
    });

    // Tags
    renderTags(diary.tags);

    // Word count
    updateWordCount();

    // Mark active in sidebar
    document.querySelectorAll('.diary-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === id);
    });

    // Save status
    updateSaveStatus('idle');
}

function renderTags(tags) {
    const container = document.getElementById('tagsContainer');
    container.innerHTML = '';

    tags.forEach((tag, index) => {
        const tagEl = document.createElement('div');
        tagEl.className = 'tag';
        tagEl.innerHTML = `${tag} <span class="tag-remove" onclick="removeTag(${index})">×</span>`;
        container.appendChild(tagEl);
    });

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'tag-input-wrapper';
    inputWrapper.innerHTML = `<input type="text" class="tag-input" id="tagInput" placeholder="+ 标签" onkeydown="addTag(event)">`;
    container.appendChild(inputWrapper);
}

function addTag(event) {
    if (event.key !== 'Enter') return;
    const input = event.target;
    const value = input.value.trim();
    if (!value || !currentDiaryId) return;

    const diary = diaries.find(d => d.id === currentDiaryId);
    if (diary && !diary.tags.includes(value)) {
        diary.tags.push(value);
        saveDiaries();
        renderTags(diary.tags);
        updateSidebar();
    }
}

function removeTag(index) {
    const diary = diaries.find(d => d.id === currentDiaryId);
    if (diary) {
        diary.tags.splice(index, 1);
        saveDiaries();
        renderTags(diary.tags);
    }
}

function setMood(btn) {
    if (!currentDiaryId) return;
    const diary = diaries.find(d => d.id === currentDiaryId);
    if (!diary) return;

    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    diary.mood = btn.dataset.mood;
    saveDiaries();
    updateSidebar();
}

function setWeather(btn) {
    if (!currentDiaryId) return;
    const diary = diaries.find(d => d.id === currentDiaryId);
    if (!diary) return;

    document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    diary.weather = btn.dataset.weather;
    saveDiaries();
}

function autoSave() {
    if (!currentDiaryId) return;

    updateSaveStatus('saving');
    updateWordCount();

    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        const diary = diaries.find(d => d.id === currentDiaryId);
        if (!diary) return;

        diary.title = document.getElementById('titleInput').value;
        diary.content = document.getElementById('contentEditor').value;
        diary.updatedAt = new Date().toISOString();

        saveDiaries();
        updateSidebar();
        updateStats();
        updateSaveStatus('saved');
    }, 600);
}

function updateSaveStatus(status) {
    const el = document.getElementById('saveStatus');
    el.className = 'save-status ' + status;
    const textMap = {
        idle: '等待编辑',
        saving: '正在保存...',
        saved: '已自动保存',
    };
    el.querySelector('span').textContent = textMap[status] || '';
}

function updateWordCount() {
    const content = document.getElementById('contentEditor').value;
    const count = content.replace(/\s/g, '').length;
    document.getElementById('wordCount').textContent = `${count} 字`;
}

function updateSidebar() {
    const list = document.getElementById('diaryList');
    
    // Sort by updatedAt (newest first)
    const sortedDiaries = [...diaries].sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    const filtered = sortedDiaries.filter(d => {
        if (!searchTerm) return true;
        return d.title.includes(searchTerm) ||
               d.content.includes(searchTerm) ||
               d.tags.some(t => t.includes(searchTerm));
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">${searchTerm ? '没有找到匹配的日记' : '还没有日记<br>点击"写日记"开始记录'}</div>
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map((diary, index) => {
        const date = new Date(diary.updatedAt);
        const dateStr = date.toLocaleDateString('zh-CN', {
            month: 'short', day: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('zh-CN', {
            hour: '2-digit', minute: '2-digit'
        });
        const title = diary.title || '无标题';
        const preview = diary.content.substring(0, 80) || '空白日记...';
        const isActive = diary.id === currentDiaryId;

        return `
            <div class="diary-item ${isActive ? 'active' : ''} slide-in"
                 data-id="${diary.id}"
                 onclick="openDiary('${diary.id}')"
                 style="animation-delay: ${index * 0.04}s">
                <div class="diary-item-header">
                    <div class="diary-item-date">${dateStr} ${timeStr}</div>
                    <button class="diary-item-delete" onclick="deleteDiaryFromList('${diary.id}')" title="删除">×</button>
                </div>
                <div class="diary-item-mood">${diary.mood || ''} ${diary.weather || ''}</div>
                <div class="diary-item-title">${escapeHtml(title)}</div>
                <div class="diary-item-preview">${escapeHtml(preview)}</div>
            </div>
        `;
    }).join('');
}

function updateStats() {
    document.getElementById('totalCount').textContent = diaries.length;

    const now = new Date();
    const monthCount = diaries.filter(d => {
        const date = new Date(d.createdAt);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('monthCount').textContent = monthCount;

    const totalWords = diaries.reduce((sum, d) => {
        return sum + d.content.replace(/\s/g, '').length;
    }, 0);
    document.getElementById('totalWords').textContent = totalWords;
}

// Debounced search
function searchDiaries(value) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchTerm = value.trim();
        updateSidebar();
    }, 300);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

// Zen Mode - Pure writing experience, no distractions
let isZenMode = false;

function toggleZenMode() {
    const appContainer = document.querySelector('.app-container');
    
    isZenMode = !isZenMode;
    
    if (isZenMode) {
        // Enter Zen Mode - pure writing interface
        appContainer.classList.add('zen-mode');
        // Save state
        localStorage.setItem('zenMode', 'true');
        console.log('Zen mode: ON - Pure writing');
    } else {
        // Exit Zen Mode
        appContainer.classList.remove('zen-mode');
        // Save state
        localStorage.setItem('zenMode', 'false');
        console.log('Zen mode: OFF');
    }
}

// Toggle search bar visibility
function toggleSearchBar() {
    const header = document.getElementById('sidebarHeader');
    const wrapper = document.getElementById('searchBoxWrapper');
    const btn = document.getElementById('searchToggleBtn');
    const searchBox = document.getElementById('searchBox');
    
    const isCollapsed = wrapper.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expand
        wrapper.classList.remove('collapsed');
        header.classList.remove('collapsed');
        btn.classList.add('active');
        btn.title = '隐藏搜索栏';
        // Save state
        localStorage.setItem('searchBarCollapsed', 'false');
        // Focus search box after transition
        setTimeout(() => {
            if (searchBox) searchBox.focus();
        }, 300);
    } else {
        // Collapse
        wrapper.classList.add('collapsed');
        header.classList.add('collapsed');
        btn.classList.remove('active');
        btn.title = '显示搜索栏';
        // Save state
        localStorage.setItem('searchBarCollapsed', 'true');
        // Clear search when hiding
        if (searchBox) {
            searchBox.value = '';
            searchDiaries('');
        }
    }
}

function confirmDelete() {
    if (!currentDiaryId) return;
    document.getElementById('deleteModal').classList.add('active');
}

function closeModal() {
    document.getElementById('deleteModal').classList.remove('active');
}

async function deleteDiary() {
    if (!currentDiaryId) return;
    diaries = diaries.filter(d => d.id !== currentDiaryId);
    currentDiaryId = null;
    await saveDiaries();

    document.getElementById('editorPanel').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'flex';

    updateSidebar();
    updateStats();
    closeModal();

    // Open next diary if exists
    if (diaries.length > 0) {
        const sorted = [...diaries].sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        openDiary(sorted[0].id);
    }
}

// Delete diary from list - no confirmation for quick operation
async function deleteDiaryFromList(id) {
    if (!confirm('确定要删除这篇日记吗？')) return;
    
    diaries = diaries.filter(d => d.id !== id);
    
    // If deleting the currently open diary
    if (id === currentDiaryId) {
        currentDiaryId = null;
        document.getElementById('editorPanel').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'flex';
        
        // Open next diary if exists
        if (diaries.length > 0) {
            const sorted = [...diaries].sort((a, b) => 
                new Date(b.updatedAt) - new Date(a.updatedAt)
            );
            openDiary(sorted[0].id);
        }
    }
    
    await saveDiaries();
    updateSidebar();
    updateStats();
}

// 导出日记函数
async function exportDiaries() {
    console.log('Export button clicked, diaries count:', diaries ? diaries.length : 0);
    
    if (!diaries || diaries.length === 0) {
        alert('暂无日记可导出');
        return;
    }

    // 简化的导出：直接导出全部日记为 Markdown
    await simpleExport();
}

// 简化的导出功能
async function simpleExport() {
    let markdown = '# 流光日记 · 导出\n\n';
    markdown += `导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    markdown += `共 ${diaries.length} 篇日记\n\n---\n\n`;

    const sortedDiaries = [...diaries].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
    );

    sortedDiaries.forEach(diary => {
        const date = new Date(diary.createdAt).toLocaleString('zh-CN');
        markdown += `## ${diary.title || '无标题'}\n\n`;
        markdown += `📅 ${date}`;
        if (diary.mood) markdown += ` | ${diary.mood}`;
        if (diary.weather) markdown += ` | ${diary.weather}`;
        markdown += '\n\n';
        if (diary.tags && diary.tags.length > 0) {
            markdown += `🏷️ ${diary.tags.join(', ')}\n\n`;
        }
        markdown += `${diary.content}\n\n---\n\n`;
    });

    if (isElectron && window.electronAPI && window.electronAPI.exportDiaries) {
        try {
            const result = await window.electronAPI.exportDiaries(markdown);
            if (result.success) {
                alert(`成功导出 ${diaries.length} 篇日记到：${result.filePath}`);
            } else if (!result.canceled) {
                alert(`导出失败：${result.error || '未知错误'}`);
            }
        } catch (err) {
            console.error('Export error:', err);
            fallbackExport(markdown);
        }
    } else {
        fallbackExport(markdown);
    }
}

// 浏览器回退导出方式
function fallbackExport(markdown) {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    a.download = `流光日记_${dateStr}_${timeStr}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`成功导出 ${diaries.length} 篇日记！`);
}

async function importDiaries() {
    if (!isElectron) {
        // 浏览器版本：使用文件选择器
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                await processImportedData(data);
            } catch (err) {
                alert(`导入失败：${err.message || '文件格式错误'}`);
            }
        };
        input.click();
        return;
    }

    // Electron 版本
    const result = await window.electronAPI.importDiaries();
    if (!result.success) {
        if (!result.canceled) {
            alert(`导入失败：${result.error || '未知错误'}`);
        }
        return;
    }

    await processImportedData(result.diaries);
}

async function processImportedData(data) {
    // 处理新的导出格式（包含元数据）和旧格式（纯数组）
    let importedDiaries;
    
    if (Array.isArray(data)) {
        // 旧格式：纯日记数组
        importedDiaries = data;
    } else if (data && typeof data === 'object') {
        // 新格式：包含元数据的对象
        if (data.diaries && Array.isArray(data.diaries)) {
            importedDiaries = data.diaries;
            console.log(`导入 Flow Diary 备份 (v${data.version || 'unknown'})`);
        } else {
            alert('导入的文件格式不正确');
            return;
        }
    } else {
        alert('导入的文件格式不正确');
        return;
    }
    
    if (importedDiaries.length === 0) {
        alert('没有找到可导入的日记');
        return;
    }

    // 分析重复情况
    const existingIds = new Set(diaries.map(d => d.id));
    const duplicates = importedDiaries.filter(d => existingIds.has(d.id));
    const newDiaries = importedDiaries.filter(d => !existingIds.has(d.id));

    if (duplicates.length === 0) {
        // 没有重复，直接导入
        diaries = [...newDiaries, ...diaries];
        await saveDiaries();
        updateSidebar();
        updateStats();
        alert(`成功导入 ${newDiaries.length} 篇日记！`);
        return;
    }

    // 有重复，显示导入选项对话框
    showImportOptions(newDiaries, duplicates);
}

function showImportOptions(newDiaries, duplicates) {
    const newCount = newDiaries.length;
    const dupCount = duplicates.length;
    
    // 显示导入结果模态框
    const modalHTML = `
        <div class="modal-overlay import-modal" id="importOptionsModal" style="display: flex; z-index: 2000;">
            <div class="modal import-modal-content" style="max-width: 450px;">
                <div class="modal-title">导入日记</div>
                <div class="import-summary" style="margin: 20px 0; padding: 16px; background: rgba(168, 155, 140, 0.1); border-radius: 8px; text-align: left;">
                    <div style="font-size: 14px; margin-bottom: 8px; color: var(--text-primary);">
                        <strong>✨ 新日记：</strong>${newCount} 篇
                    </div>
                    <div style="font-size: 14px; color: var(--text-primary);">
                        <strong>📝 重复日记：</strong>${dupCount} 篇
                    </div>
                </div>
                <div style="margin-bottom: 24px; text-align: left;">
                    <label style="display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                        选择处理方式：
                    </label>
                    <div class="import-option" style="margin-bottom: 12px; cursor: pointer;" onclick="selectImportOption('skip')">
                        <input type="radio" name="importOption" value="skip" id="optionSkip" checked style="margin-right: 8px; cursor: pointer;">
                        <label for="optionSkip" style="cursor: pointer; font-size: 14px; color: var(--text-primary);">
                            <strong>跳过重复</strong> - 只导入新日记，保留现有版本
                        </label>
                    </div>
                    <div class="import-option" style="margin-bottom: 12px; cursor: pointer;" onclick="selectImportOption('update')">
                        <input type="radio" name="importOption" value="update" id="optionUpdate" style="margin-right: 8px; cursor: pointer;">
                        <label for="optionUpdate" style="cursor: pointer; font-size: 14px; color: var(--text-primary);">
                            <strong>更新重复</strong> - 导入新日记，用导入版本覆盖重复项
                        </label>
                    </div>
                    <div class="import-option" style="cursor: pointer;" onclick="selectImportOption('keepBoth')">
                        <input type="radio" name="importOption" value="keepBoth" id="optionKeepBoth" style="margin-right: 8px; cursor: pointer;">
                        <label for="optionKeepBoth" style="cursor: pointer; font-size: 14px; color: var(--text-primary);">
                            <strong>保留两者</strong> - 导入所有日记，重复项添加"[导入]"标记
                        </label>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn" onclick="closeImportModal()">取消</button>
                    <button class="modal-btn primary" onclick="executeImport()" style="background: linear-gradient(135deg, rgba(196, 168, 130, 0.3), rgba(143, 163, 176, 0.3)); border-color: rgba(196, 168, 130, 0.3); color: var(--text-primary);">确认导入</button>
                </div>
            </div>
        </div>
    `;
    
    // 存储导入数据供后续使用
    window._pendingImport = { newDiaries, duplicates };
    
    // 添加模态框到页面
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
}

function selectImportOption(option) {
    document.querySelectorAll('input[name="importOption"]').forEach(radio => {
        radio.checked = radio.value === option;
    });
}

function closeImportModal() {
    const modal = document.getElementById('importOptionsModal');
    if (modal) {
        modal.remove();
    }
    window._pendingImport = null;
}

async function executeImport() {
    const selectedOption = document.querySelector('input[name="importOption"]:checked')?.value || 'skip';
    const { newDiaries, duplicates } = window._pendingImport;
    
    let importedCount = newDiaries.length;
    
    if (selectedOption === 'skip') {
        // 只添加新日记
        diaries = [...newDiaries, ...diaries];
    } else if (selectedOption === 'update') {
        // 用导入的版本覆盖重复项
        const duplicateIds = new Set(duplicates.map(d => d.id));
        diaries = diaries.filter(d => !duplicateIds.has(d.id));
        diaries = [...newDiaries, ...duplicates, ...diaries];
        importedCount += duplicates.length;
    } else if (selectedOption === 'keepBoth') {
        // 保留两者，给导入的重复项添加标记
        const markedDuplicates = duplicates.map(d => ({
            ...d,
            title: d.title ? `[导入] ${d.title}` : '[导入] 无标题',
            id: generateId() // 生成新ID避免冲突
        }));
        diaries = [...newDiaries, ...markedDuplicates, ...diaries];
        importedCount += duplicates.length;
    }
    
    await saveDiaries();
    updateSidebar();
    updateStats();
    closeImportModal();
    alert(`成功导入 ${importedCount} 篇日记！`);
}

// ========== Settings ==========
const SETTINGS_KEY = 'flowDiarySettings';
let settings = {
    theme: 'auto', // 'light', 'dark', 'auto'
    fontSize: 15,
    lineHeight: 2
};

function loadSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
        settings = { ...settings, ...JSON.parse(stored) };
    }
    applySettings();
}

function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applySettings() {
    // Apply theme
    applyTheme(settings.theme);
    
    // Apply font size using CSS variable
    document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
    
    // Apply line height using CSS variable
    document.documentElement.style.setProperty('--editor-line-height', settings.lineHeight);
}

function applyTheme(theme) {
    const body = document.body;
    
    if (theme === 'dark') {
        body.classList.add('dark-mode');
    } else if (theme === 'light') {
        body.classList.remove('dark-mode');
    } else {
        // Auto - follow system
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    }
    
    // Listen to system theme changes in auto mode
    if (theme === 'auto') {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (settings.theme === 'auto') {
                if (e.matches) {
                    body.classList.add('dark-mode');
                } else {
                    body.classList.remove('dark-mode');
                }
            }
        });
    }
}

function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('active');
        updateSettingsUI();
    }
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateSettingsUI() {
    // Update theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeThemeBtn = document.getElementById(`${settings.theme}ThemeBtn`);
    if (activeThemeBtn) {
        activeThemeBtn.classList.add('active');
    }
    
    // Update font size slider
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeSlider) {
        fontSizeSlider.value = settings.fontSize;
    }
    if (fontSizeValue) {
        fontSizeValue.textContent = `${settings.fontSize}px`;
    }
    
    // Update line height select
    const lineHeightSelect = document.getElementById('lineHeightSelect');
    if (lineHeightSelect) {
        lineHeightSelect.value = settings.lineHeight;
    }
}

function setTheme(theme) {
    settings.theme = theme;
    saveSettings();
    applyTheme(theme);
    updateSettingsUI();
}

function setFontSize(size) {
    settings.fontSize = parseInt(size);
    saveSettings();
    applySettings();
    updateSettingsUI();
}

function setLineHeight(height) {
    settings.lineHeight = parseFloat(height);
    saveSettings();
    applySettings();
    updateSettingsUI();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', async () => {
    initThree();
    await loadDiaries();
    loadSettings();

    // Restore search bar state
    const searchBarCollapsed = localStorage.getItem('searchBarCollapsed') === 'true';
    if (searchBarCollapsed) {
        const wrapper = document.getElementById('searchBoxWrapper');
        const header = document.getElementById('sidebarHeader');
        const btn = document.getElementById('searchToggleBtn');
        if (wrapper && header && btn) {
            wrapper.classList.add('collapsed');
            header.classList.add('collapsed');
            btn.classList.remove('active');
            btn.title = '显示搜索栏';
        }
    }

    // Restore Zen mode state
    const zenModeEnabled = localStorage.getItem('zenMode') === 'true';
    if (zenModeEnabled) {
        isZenMode = true;
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.add('zen-mode');
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            createNewDiary();
        }
        // Ctrl/Cmd + F to toggle search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            toggleSearchBar();
        }
        // Ctrl/Cmd + Shift + Z to toggle Zen Mode
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            toggleZenMode();
        }
        // Ctrl/Cmd + , to open Settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            openSettings();
        }
        // Escape to exit Zen mode, close settings/template, or close modal
        if (e.key === 'Escape') {
            const settingsModal = document.getElementById('settingsModal');
            const templateModal = document.getElementById('templateModal');
            const importOptionsModal = document.getElementById('importOptionsModal');
            
            if (isZenMode) {
                toggleZenMode();
            } else if (importOptionsModal) {
                closeImportModal();
            } else if (templateModal && templateModal.classList.contains('active')) {
                closeTemplateModal();
            } else if (settingsModal && settingsModal.classList.contains('active')) {
                closeSettings();
            } else {
                closeModal();
            }
        }
    });

    // Update footer and log app info
    if (isElectron) {
        const version = await window.electronAPI.getAppVersion();
        const footer = document.getElementById('appFooter');
        if (footer) {
            footer.innerHTML = `<span>Flow Diary v${version} • ${window.electronAPI.platform}</span>`;
        }
        console.log('Flow Diary v' + version);
        console.log('Platform:', window.electronAPI.platform);
        const dataPath = await window.electronAPI.getDataPath();
        console.log('Data path:', dataPath);
    }
});
