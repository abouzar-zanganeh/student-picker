/* ==========================================================================
   backup.js introduction
   --------------------------------------------------------------------------
   This JS file manages the logic for creating (exporting) and restoring (importing) 
   application backup files.
   ========================================================================== */


import JSZip from "jszip";
import { classrooms, rehydrateData, saveData, setTrashBin, setUserSettings, trashBin, userSettings } from "./state";
import { addBackupSnapshot } from "./db";
import * as state from "./state";
import { showNotification, showCustomConfirm, renderClassManagementStats, triggerFileDownload } from "./ui";
import { closeSideNav } from "./main";
import * as ui from "./ui";

export async function prepareBackupData(classNames = []) {
    const dataToBackup = {};

    // If specific class names are provided, filter the main classrooms object.
    if (classNames.length > 0) {
        classNames.forEach(name => {
            if (classrooms[name]) {
                dataToBackup[name] = classrooms[name];
            }
        });
    } else {
        // Otherwise, back up all non-deleted classrooms.
        for (const name in classrooms) {
            if (!classrooms[name].isDeleted) {
                dataToBackup[name] = classrooms[name];
            }
        }
    }

    const appState = {
        metadata: {
            // New version to mark it as Base64. This is crucial for restoring.
            version: "2.0-b64",
            createdAt: new Date().toISOString()
        },
        data: {
            classrooms: dataToBackup,
            trashBin,
            userSettings
        }
    };

    const dataStr = JSON.stringify(appState);

    // --- FILENAME LOGIC START ---
    const now = new Date();
    const parts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(now).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    const shortYear = parts.year.slice(-2);
    const timeStamp = `${shortYear}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}`;

    let fileName;

    if (classNames.length === 0) {
        // Case A: Full Backup
        fileName = `SP_Full_${timeStamp}.txt`;
    } else if (classNames.length === 1) {
        // Case B: Single Class (Sanitized)
        // 1. Remove invalid filename chars (< > : " / \ | ? *)
        // 2. Replace spaces with underscores
        const rawName = classNames[0];
        const safeName = rawName.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_');
        fileName = `SP_${safeName}_${timeStamp}.txt`;
    } else {
        // Case C: Multiple Classes
        fileName = `SP_Selected-${classNames.length}_${timeStamp}.txt`;
    }
    // --- FILENAME LOGIC END ---
    try {
        const zip = new JSZip();
        zip.file("backup.json", dataStr); // Add the data as a file inside the zip


        // 1. Generate the binary compressed blob
        const compressedBlob = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: {
                level: 9 // Max compression
            }
        });

        // 2. Convert that binary blob to a Base64 string
        const base64String = await blobToBase64(compressedBlob);

        // 3. Create a new file from that *string*
        return new File([base64String], fileName, {
            type: "text/plain" // Share as a plain text file
        });

    } catch (error) {
        console.error("Error creating base64 backup file:", error);
        return null; // Return null on failure
    }
}
// Helper function to convert a Blob to a Base64 string

export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            // The result is a "data URL" (e.g., data:application/octet-stream;base64,U...).
            // We just want the Base64 part, so we split at the comma.
            resolve(reader.result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
    });

}

export function processRestore(plainData, isCleanRestore) {
    if (isCleanRestore) {
        // --- MODE B: Clean Restore ---
        // 1. Wipe everything and replace with backup data
        rehydrateData(plainData.data.classrooms);
        setTrashBin(plainData.data.trashBin || []);
    } else {
        // --- MODE A: Smart Sync (ID-Based) ---
        const backupClassrooms = plainData.data.classrooms;
        const backupTrash = plainData.data.trashBin || [];

        // 1. Map current classes by their Unique ID (scheduleCode) for fast lookup
        // Map Format: { "code_123": "Math 101", "code_456": "Science" }
        const currentIdMap = new Map();
        for (const name in classrooms) {
            const cls = classrooms[name];
            if (cls.info && cls.info.scheduleCode) {
                currentIdMap.set(cls.info.scheduleCode, name);
            }
        }

        // 2. Iterate through incoming backup classes
        for (const backupName in backupClassrooms) {
            const backupClassData = backupClassrooms[backupName];
            const backupId = backupClassData.info.scheduleCode;

            // Check if we already have this class ID locally
            if (currentIdMap.has(backupId)) {
                // MATCH FOUND: Replace the existing class
                const existingClassName = currentIdMap.get(backupId);

                // If the name changed in the backup, we must delete the old key
                if (existingClassName !== backupClassData.info.name) {
                    delete classrooms[existingClassName];
                }

                // Overwrite with new data (using the name from the backup)
                classrooms[backupClassData.info.name] = backupClassData;
            } else {
                // NO MATCH: It's a new class, add it
                // Handle potential name collision if ID is new but Name exists
                let finalName = backupClassData.info.name;
                while (classrooms[finalName]) {
                    finalName = `${finalName} (Imported)`;
                }
                // Update name inside info if we renamed it
                if (finalName !== backupClassData.info.name) {
                    backupClassData.info.name = finalName;
                }

                classrooms[finalName] = backupClassData;
            }
        }

        // 3. Smart Merge Trash Bin (Add missing items)
        const currentTrashIds = new Set(trashBin.map(t => t.id));
        backupTrash.forEach(item => {
            if (!currentTrashIds.has(item.id)) {
                trashBin.push(item);
            }
        });

        // Re-run rehydration to convert all plain objects to class instances
        rehydrateData(classrooms);
    }

    // Restore User Settings if they exist in the backup
    if (plainData.data.userSettings) {
        setUserSettings(plainData.data.userSettings);
    }

    // --- Final Steps ---
    setUserSettings({ lastRestoreTimestamp: new Date().toISOString() });
    saveData();
}
export async function initiateBackupProcess(classNamesToBackup = []) {
    // 1. Await the file creation.
    const fileToShare = await prepareBackupData(classNamesToBackup);

    // 1b. Check if file creation succeeded
    if (!fileToShare) {
        showNotification("❌ خطا در ایجاد فایل پشتیبان.");
        return;
    }

    // Generate Farsi Description
    let backupDescription = 'پشتیبان کامل سیستم';

    if (classNamesToBackup.length > 0) {
        // Join names with Persian comma
        const namesList = classNamesToBackup.join('، ');
        const label = classNamesToBackup.length === 1 ? 'پشتیبان کلاس:' : 'پشتیبان کلاس‌های:';
        backupDescription = `${label} ${namesList}`;
    }

    // Silently save a snapshot to the "Garage" (IndexedDB)
    addBackupSnapshot(fileToShare, {
        name: fileToShare.name,
        description: backupDescription,
        version: "2.0-b64"
    }).catch(err => console.error("Failed to save local snapshot:", err));

    // 2. Check for mobile/share capability.
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && navigator.share && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {

        // 3. Show a confirmation modal.
        showCustomConfirm(
            "فایل پشتیبان شما آماده است. آیا مایل به اشتراک‌گذاری آن هستید؟",
            () => {
                // 4. Run share logic
                try {
                    navigator.share({
                        title: fileToShare.name,
                        text: 'فایل پشتیبان داده‌های برنامه',
                        files: [fileToShare],
                    })
                        .then(() => {
                            showCustomConfirm(
                                "آیا فایل پشتیبان با موفقیت ارسال/ذخیره شد؟",
                                () => {
                                    state.setLastBackupTimestamp();
                                    renderClassManagementStats();
                                    showNotification("✅ تاریخ پشتیبان ثبت شد.");
                                },
                                { confirmText: 'بله', cancelText: 'خیر', confirmClass: 'btn-success' }
                            );
                        });
                } catch (error) {
                    console.error('Error during sharing process:', error);
                    triggerFileDownload(fileToShare);
                    showNotification("⚠️خطا در فرآیند اشتراک‌گذاری. فایل در حال دانلود است.");
                }
            },
            {
                confirmText: 'بله',
                cancelText: 'خیر',
                confirmClass: 'btn-success'
            }
        );
    } else {
        // 4b. On desktop, just trigger the download directly.
        triggerFileDownload(fileToShare);
        showNotification("✅پشتیبان‌گیری با موفقیت انجام شد.");
    }
}
export function prepareBackupBtn(backupDataBtn) {
    backupDataBtn.addEventListener('click', () => {

        if (state.isDemoMode) {
            ui.showNotification("⚠️ پشتیبان‌گیری در حالت نمایش (Demo) غیرفعال است.");
            closeSideNav();
            return;
        }

        closeSideNav();
        initiateBackupProcess();
    });
}
export function prepareRestoreBtn(restoreDataBtn, restoreFileInput) {
    restoreDataBtn.addEventListener('click', () => {

        if (state.isDemoMode) {
            ui.showNotification("⚠️ بازیابی اطلاعات در حالت نمایش (Demo) غیرفعال است.");
            closeSideNav();
            return;
        }

        restoreFileInput.click();
        closeSideNav();
    });
}
export function restoreButtonMainFunction(restoreFileInput) {
    restoreFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        // Make the onload function ASYNC to handle unzipping
        reader.onload = async (e) => {
            const fileContent = e.target.result;

            try {
                // --- TRY BLOCK: Assumes it's an OLD, plain-text JSON file ---
                const plainData = JSON.parse(fileContent);

                // Check if it's the NEW metadata format (but uncompressed)
                if (plainData.metadata && plainData.data) {
                    // This will handle v2.0 backups that were not Base64
                    ui.showRestoreConfirmModal(plainData);
                } else {
                    // This handles v1.0 backups (the raw classrooms object)
                    const classroomsDataToRestore = plainData.classrooms || plainData;
                    const trashDataToRestore = plainData.trashBin || [];

                    ui.showCustomConfirm(
                        "آیا از بازیابی اطلاعات مطمئن هستید؟ تمام داده‌های فعلی شما بازنویسی خواهد شد.",
                        () => {
                            state.rehydrateData(classroomsDataToRestore);
                            state.setTrashBin(trashDataToRestore);
                            state.setUserSettings({ lastRestoreTimestamp: new Date().toISOString() });
                            state.saveData();
                            ui.renderClassList();
                            ui.showPage('class-management-page');
                            ui.showNotification("✅اطلاعات با موفقیت بازیابی شد.");
                        },
                        { confirmText: 'بازیابی کن', confirmClass: 'btn-warning' }
                    );
                }

            } catch (jsonError) {
                // --- CATCH BLOCK: Assumes it's a NEW, Base64-compressed file ---
                // The JSON.parse failed, so it's not a plain JSON file.
                // Let's try to decompress it as a Base64 zip.
                try {
                    const zip = new JSZip();

                    // 1. Load the Base64 string (the fileContent)
                    const unzipped = await zip.loadAsync(fileContent, { base64: true });

                    // 2. Find the backup.json file inside
                    const backupFile = unzipped.file("backup.json");
                    if (!backupFile) {
                        throw new Error("فایل backup.json در فایل پشتیبان یافت نشد.");
                    }

                    // 3. Read the content of backup.json as text
                    const jsonString = await backupFile.async("string");

                    // 4. Parse that text into our data object
                    const plainData = JSON.parse(jsonString);

                    // 5. Check if it's our new "2.0-b64" format
                    if (plainData.metadata && plainData.metadata.version === "2.0-b64") {
                        // Success! Show the restore modal
                        ui.showRestoreConfirmModal(plainData);
                    } else {
                        throw new Error("فایل پشتیبان معتبر نیست (نسخه نامشخص).");
                    }

                } catch (zipError) {
                    // This catches errors from zipping or Base64 decoding
                    ui.showNotification("❌خطا در خواندن فایل. لطفاً فایل پشتیبان معتبر انتخاب کنید.");
                    console.error("Restore error (zip/base64):", zipError);
                }
            }
        };

        // We must read the file as text for BOTH old JSON and new Base64
        reader.readAsText(file);
        event.target.value = null;
    });
}

