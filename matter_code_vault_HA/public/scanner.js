// Version: 3.3.3 (Full Integration & Voting Stable)

const VISION_MODEL = "moondream";
const REASONING_MODEL = "antigravity-model:3b";
const OLLAMA_PROXY_URL = "api/ai";

let currentVerifiedMt = null;

// --- UI UTILS ---
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = "fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs z-[100] shadow-lg animate-fade-in";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function handleInput(val) {
    if (!val) return;
    const code = val.replace(/-/g, '');
    if (code.length === 11) {
        const formatted = code.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
        const input = document.getElementById('devPayload');
        if (input) {
            input.value = formatted;
            input.dispatchEvent(new Event('input'));
        }
    }
}

// --- MATTER DECODER ---
function decodeMatterPayload(payload) {
    if (!payload || !payload.startsWith('MT:')) return null;
    try {
        const base38 = payload.substring(3);
        const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. ";
        let value = BigInt(0);
        for (let i = base38.length - 1; i >= 0; i--) {
            value = value * BigInt(38) + BigInt(alphabet.indexOf(base38[i]));
        }
        const bits = value.toString(2).padStart(38, '0');
        const reversedBits = bits.split('').reverse().join('');
        
        return {
            version: parseInt(reversedBits.substring(0, 3), 2),
            vid: parseInt(reversedBits.substring(3, 19), 2),
            pid: parseInt(reversedBits.substring(19, 35), 2),
            discriminator: parseInt(reversedBits.substring(35, 38) + "000000000", 2) // Simplified
        };
    } catch (e) { return null; }
}

function applyDecodedInfo(info) {
    if (!info) return;
    const vidInput = document.getElementById('devVid');
    if (vidInput) {
        vidInput.value = info.vid;
        vidInput.dispatchEvent(new Event('change'));
    }
}

// --- IMAGE PROCESSING ---
async function convertHeicIfNecessary(file) {
    if (file.name.toLowerCase().endsWith('.heic')) {
        showToast("HEIC 변환 중...");
        const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.7 });
        return new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: "image/jpeg" });
    }
    return file;
}

function resizeImage(file, maxDimension) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let w = img.width, h = img.height;
            if (w > h) { if (w > maxDimension) { h *= maxDimension / w; w = maxDimension; } }
            else { if (h > maxDimension) { w *= maxDimension / h; h = maxDimension; } }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject; 
        img.src = URL.createObjectURL(file);
    });
}

// --- STANDARD SCAN (Camera/OCR) ---
async function triggerOcrScan() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => processOcrImage(e.target.files[0]);
    input.click();
}

async function processOcrImage(file) {
    if (!file) return;
    showToast("이미지 분석 중...");
    const convertedFile = await convertHeicIfNecessary(file);
    
    try {
        const qrPromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width; canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    resolve(code ? code.data : null);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(convertedFile);
        });

        const ocrPromise = Tesseract.recognize(convertedFile, 'eng');
        const [qrCode, ocrResult] = await Promise.all([qrPromise, ocrPromise]);

        if (qrCode && qrCode.startsWith('MT:')) {
            document.getElementById('devMtPayload').value = qrCode;
            document.getElementById('displayMtPayload').value = qrCode;
            applyDecodedInfo(decodeMatterPayload(qrCode));
            showToast("QR 인식 성공");
        }

        const ocrText = ocrResult.data.text;
        const ocrCode = ocrText.match(/\d{4}-\d{3}-\d{4}/) || ocrText.match(/\d{11}/);
        if (ocrCode) {
            handleInput(ocrCode[0]);
            showToast("페어링 코드 인식 성공");
        }
    } catch (e) {
        console.error(e);
        showToast("인식 실패");
    }
}

// --- AI SCAN (Gallery/Ollama) ---
async function executeAiAnalysis(base64Data) {
    const modalContent = document.getElementById('modalContent');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = "aiLoadingOverlay";
    loadingOverlay.className = "absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-2xl soft-pulse";
    loadingOverlay.innerHTML = '<span class="text-orange-600 font-bold text-sm">🤖 AI 정밀 분석 중...</span>';

    if (modalContent) {
        modalContent.classList.add('ai-border');
        modalContent.appendChild(loadingOverlay);
    }
    
    try {
        // Step 1: Vision Pass
        const visionRes = await fetch(OLLAMA_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: VISION_MODEL,
                prompt: "Describe all visible Matter QR codes (starting with MT:) and 11-digit pairing codes. Be precise.",
                images: [base64Data],
                stream: false,
                options: { keep_alive: "5m" }
            })
        });
        const visionData = await visionRes.json();
        
        // Step 2: Reasoning Pass
        const reasoningRes = await fetch(OLLAMA_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: REASONING_MODEL,
                prompt: `Extract Matter QR and 11-digit code as JSON { "mt": "MT:...", "code": "xxxx-xxx-xxxx" }. Description: ${visionData.response}`,
                stream: false,
                format: "json",
                options: { temperature: 0.1, keep_alive: "5m" }
            })
        });
        const reasoningData = await reasoningRes.json();
        const info = JSON.parse(reasoningData.response);

        // --- Algorithmic Voting (v3.3.3) ---
        const existingInput = document.getElementById('devPayload');
        if (info.code && existingInput && existingInput.value) {
            const existingCode = existingInput.value.replace(/-/g, '');
            let aiCodeRaw = info.code.replace(/-/g, '');
            if (existingCode.length === 11 && aiCodeRaw.length === 11) {
                let mergedCode = "";
                for (let i = 0; i < 11; i++) {
                    if ((existingCode[i] === '0' && aiCodeRaw[i] === '8') || 
                        (existingCode[i] === '8' && aiCodeRaw[i] === '0')) {
                        mergedCode += '0';
                    } else {
                        mergedCode += aiCodeRaw[i];
                    }
                }
                info.code = mergedCode.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
            }
        }

        if (info.code) handleInput(info.code);
        if (info.mt) {
            document.getElementById('devMtPayload').value = info.mt;
            document.getElementById('displayMtPayload').value = info.mt;
            applyDecodedInfo(decodeMatterPayload(info.mt));
        }
        showToast("AI 분석 완료");
    } catch (e) {
        showToast("AI 분석 실패");
    } finally {
        if (modalContent) modalContent.classList.remove('ai-border');
        const overlay = document.getElementById('aiLoadingOverlay');
        if (overlay) overlay.remove();
    }
}

async function processAiImage(event) {
    const originalFile = event.target.files[0]; if (!originalFile) return;
    const file = await convertHeicIfNecessary(originalFile);
    try { 
        const url = await resizeImage(file, 1024);
        executeAiAnalysis(url.split(',')[1]); 
    } catch (e) { showToast("처리 실패"); }
    event.target.value = '';
}

// --- GLOBAL EXPORTS ---
window.triggerOcrScan = triggerOcrScan;
window.processAiImage = processAiImage;
window.executeAiAnalysis = executeAiAnalysis;
window.processOcrImage = processOcrImage;
window.decodeMatterPayload = decodeMatterPayload;
