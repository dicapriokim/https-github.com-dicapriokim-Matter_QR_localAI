function toggleViewMode() { window.viewMode = window.viewMode === 'grid' ? 'list' : 'grid'; updateViewToggleButton(); renderDevices(); }
function updateViewToggleButton() { 
    const btn = document.getElementById('viewToggleBtn');
    if (btn) btn.innerHTML = window.viewMode === 'grid' ? getSvg('list', 20) : getSvg('layout-grid', 20); 
}

async function exportData() {
    const dataStr = JSON.stringify({ version: APP_VERSION, date: new Date().toISOString(), devices, settings: configs }, null, 2);
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' })); 
    link.download = "matter_backup.json"; 
    link.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            const impDevices = Array.isArray(imported) ? imported : (imported.devices || []);
            const impSettings = imported.settings || imported.configs || {};
            let added = 0; let updated = 0;

            // 1. 기기 데이터 복구
            if (impDevices.length > 0) {
                impDevices.forEach(item => {
                    const idx = devices.findIndex(d => String(d.id) === String(item.id));
                    if (idx > -1) { devices[idx] = item; updated++; }
                    else { devices.unshift(item); added++; }
                });
            }

            // 2. 설정(장소, 플랫폼, 기기 종류 등) 복구 및 병합
            if (impSettings) {
                if (impSettings.locations) {
                    const newLocs = impSettings.locations.filter(l => !configs.locations.includes(l));
                    configs.locations = [...configs.locations, ...newLocs];
                }
                if (impSettings.deviceTypes) {
                    const newTypes = impSettings.deviceTypes.filter(t => !configs.deviceTypes.includes(t));
                    configs.deviceTypes = [...configs.deviceTypes, ...newTypes];
                }
                if (impSettings.platforms) {
                    const newPlats = impSettings.platforms.filter(p => !configs.platforms.includes(p));
                    configs.platforms = [...configs.platforms, ...newPlats];
                }
                if (impSettings.manufacturers) {
                    const newMfts = impSettings.manufacturers.filter(m => !configs.manufacturers.includes(m));
                    configs.manufacturers = [...configs.manufacturers, ...newMfts];
                }
                if (impSettings.vidMappings) {
                    Object.assign(configs.vidMappings, impSettings.vidMappings);
                }
                if (impSettings.locationOrder) {
                    configs.locationOrder = impSettings.locationOrder;
                }
            }

            // 3. 저장 및 UI 갱신
            await saveData();

            renderLocationTags(); 
            renderManufacturerTags(); 
            renderPlatformTags(); 
            renderDeviceTypeTags(); 
            renderVidMappings();
            renderCategoryFilters();
            renderLocationReorderBar();
            renderDevices();
            
            showToast(`복구 완료 (기기: ${added}추가/${updated}수정)`);
        } catch (err) { 
            console.error("Import Error:", err);
            showToast("복구 실패: " + err.message); 
        }
    };
    reader.readAsText(file); 
    event.target.value = '';
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;
    if (window.scrollY > 300) {
        btn.classList.remove('opacity-0', 'pointer-events-none');
        btn.classList.add('opacity-100', 'pointer-events-auto');
    } else {
        btn.classList.add('opacity-0', 'pointer-events-none');
        btn.classList.remove('opacity-100', 'pointer-events-auto');
    }
});

// --- Lifecycle ---
export function init() {
    console.log("[UI] Initializing interface...");
    renderLocationTags();
    renderManufacturerTags();
    renderPlatformTags();
    renderDeviceTypeTags();
    renderVidMappings();
    renderCategoryFilters();
    updateViewToggleButton();
    renderDevices();
    renderLocationReorderBar();
    
    if (typeof updateVersionDisplay === 'function') updateVersionDisplay();
    console.log("[UI] Interface ready");
}

// Window Bindings for HTML Inline Events & Scope Sharing
if(typeof window !== 'undefined' && !window.app) window.app = {};
const bindings = {
    openGuideModal, closeGuideModal, closeSettingsModal, renderLocationTags, renderPlatformTags, renderManufacturerTags,
    renderDeviceTypeTags, addLocation, addPlatform, addManufacturer, addDeviceType, removeLocation, removePlatform,
    removeManufacturer, removeDeviceType, showToast, handleInput, toggleMtVisibility, openModal, closeModal,
    openSettingsModal, renderCategoryFilters, renderLocationReorderBar, scrollToLocation, handleDragStart, handleDragOver,
    handleDrop, setCategory, getIconForType, renderDevices, saveDevice, previewImage, closeImageViewer, confirmDelete,
    toggleViewMode, updateViewToggleButton, exportData, importData, scrollToTop
};
Object.keys(bindings).forEach(key => {
    window[key] = bindings[key];
    window.app[key] = bindings[key];
});
