// ============================================================
//  Feedback Translation Link — chat.js
//  Firebase 即時同步版 + Gemini AI 翻譯 (含自動模型容錯)
// ============================================================

// -----------------------------------------------------------
//  ★ Firebase 設定（請依照下方指引完成設定）
// -----------------------------------------------------------
//  ① 前往 https://console.firebase.google.com/
//  ② 點擊「新增專案」→ 輸入專案名稱 → 建立
//  ③ 左側選單 →「建構」→「Realtime Database」→「建立資料庫」
//  ④ 選擇位置（建議 asia-southeast1）→ 以「測試模式」開始
//  ⑤ 回到專案總覽 →「專案設定」(齒輪圖示) →「一般」
//  ⑥ 下方「您的應用程式」→ 點擊 </> (網頁) 圖示
//  ⑦ 輸入應用程式暱稱 → 註冊應用程式
//  ⑧ 複製 firebaseConfig 物件的內容貼到下方
// -----------------------------------------------------------
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDJuByNyf7-gCQr_RAkhnZ4sFeTs7eLIJ4",
  authDomain: "realtime-database-24996.firebaseapp.com",
  databaseURL: "https://realtime-database-24996-default-rtdb.firebaseio.com",
  projectId: "realtime-database-24996",
  storageBucket: "realtime-database-24996.firebasestorage.app",
  messagingSenderId: "525236311859",
  appId: "1:525236311859:web:1bc269adeec71d90be1046",
  measurementId: "G-W82WZHG0XB"
};

// -----------------------------------------------------------
//  常數定義
// -----------------------------------------------------------
const MODEL_FALLBACK_LIST = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
const API_KEY_STORAGE_KEY = "agent_arch_api_key";
const API_MODEL_STORAGE_KEY = "agent_arch_api_model";
const TRANSLATE_TIMEOUT_MS = 15000; // 翻譯 API 超時毫秒數

// 本地常用製造業字典 (當 API Key 未填寫時作為精準的 Fallback 翻譯)
const LOCAL_TRANSLATION_DICT = {
    // 中翻日
    "機台發生故障，請求支援。": "機械のエラーが発生しました。支援をお願いします。",
    "品質檢驗已完成，全部合格。": "製品の検査が完了しました。すべて合格です。",
    "正在進行線切割加工製程。": "ワイヤーカット加工プロセスが進行中です。",
    "設備清潔與放電加工準備完成。": "設備のクリーニングと放電加工の準備が完了しました。",
    "你好": "こんにちは",
    "謝謝": "ありがとうございます",
    "確認": "確認しました",
    "Feedback": "翔名科技股份有限公司",
    "Feedback Japan": "翔名科技日本工廠",
    "FeedbackJapan": "翔名科技日本工廠",
    // 日翻中
    "設備のエラーが発生しました。": "設備發生錯誤。",
    "製品の検査が完了しました。": "產品檢驗已完成。",
    "こんにちは": "你好",
    "ありがとうございます": "非常感謝",
    "了解しました": "已了解/收到",
    "確認しました": "確認完成"
};

// -----------------------------------------------------------
//  多語系字典 (i18n)
// -----------------------------------------------------------
const I18N_DICT = {
    "zh-TW": {
        "app_title": "Feedback Translation Link",
        "app_subtitle": "製造業現場中日雙向即時翻譯大廳",
        "tab_login": "帳號登入",
        "tab_register": "註冊新帳號",
        "label_id": "身分 ID",
        "placeholder_id": "請輸入已建立的 ID",
        "label_pwd": "密碼",
        "placeholder_pwd": "請輸入密碼 (一般用戶為 4 位數字)",
        "btn_login": "登入系統",
        "label_new_id": "新身分 ID",
        "placeholder_new_id": "例如：Sato、王工程師",
        "label_new_pwd": "請輸入 4 位數字密碼",
        "placeholder_new_pwd": "例如：1234",
        "btn_register": "建立帳號並登入",
        "default_admin_text": "預設管理員 ID: ",
        "api_unset": "API 未設定",
        "not_logged_in": "未登入",
        "operator": "操作員",
        "btn_logout": "登出",
        "channel_list": "聊天頻道",
        "public_lobby": "📢 公開大廳",
        "private_chat": "私人密聊",
        "online_users": "目前在線成員",
        "admin_accounts": "帳號管理 (管理員)",
        "public_desc": "本頻道的發言將會自動翻譯，所有人皆可看見。",
        "admin_functions": "管理功能：",
        "clear_history": "清空此對話歷史",
        "chat_start_notice": "對話開始，輸入的訊息將透過 Gemini 進行中日文即時雙向翻譯。",
        "quick_phrases_label": "現場常用語：",
        "btn_edit_phrases": "編輯常用語 (僅管理員)",
        "detecting_lang": "自動語言偵測中...",
        "input_placeholder": "輸入中文會自動翻成日文，輸入日文會翻成中文... 按 Enter 傳送",
        "btn_send": "發送訊息",
        "edit_phrases_title": "編輯現場常用語",
        "edit_phrases_desc": "新增、修改或刪除下方列表中的現場常用語。變更將即時同步給所有連線中的使用者。",
        "add_row": "新增一列",
        "cancel": "取消",
        "save_changes": "儲存變更",
        "err_wrong_pwd": "密碼錯誤！",
        "err_empty_login": "請輸入 ID 與密碼",
        "err_pwd_4digits": "密碼必須為 4 位數字",
        "err_id_taken": "該 ID 已被註冊，請換一個或直接登入。",
        "err_api_missing": "請確認已設定好 API...",
        "toast_login_success": "登入成功",
        "toast_welcome_back": "歡迎回來",
        "toast_phrase_updated": "常用語更新成功",
        "toast_phrase_failed": "更新常用語失敗",
        "toast_history_cleared": "對話紀錄已清空",
        "private_chat_with": "與 {name} 的私訊",
        "private_chat_desc": "此為雙向即時翻譯私密通道，僅你們雙方可看見對話。",
        "status_admin": "管理員",
        "status_operator": "操作員",
        "status_online": "線上",
        "status_offline": "離線",
        "placeholder_edit_phrase": "請輸入常用語...",
        "err_keep_one_phrase": "至少需要保留一組常用語。",
        "confirm_delete_account": "確定要刪除帳號「{id}」嗎？",
        "confirm_clear_chat": "確定要清空此頻道的對話紀錄嗎？此動作無法復原！",
        "new_message_alert": "💬 您有新訊息！",
        "err_no_account": "找不到此帳號，請確認 ID 是否輸入正確，或點擊「註冊新帳號」進行註冊。",
        "err_id_empty": "請輸入身分 ID！",
        "err_reserved_id": "不可註冊此保留 ID！",
        "toast_register_success": "帳號註冊成功！已自動登入。",
        "toast_account_deleted": "帳號「{id}」已被管理員註銷。",
        "err_translate_failed": "翻譯失敗：無法連接至翻譯伺服器",
        "err_copy_failed": "複製失敗",
        "confirm_logout": "確定要登出嗎？",
        "confirm_delete_msg": "確定要刪除這條訊息嗎？",
        "err_firebase_sdk_failed": "Firebase SDK 未載入，使用離線模式。",
        "err_firebase_connect_failed": "Firebase 連接失敗，使用離線模式。",
        "settings_title": "系統設定 (AI 翻譯引擎)",
        "label_translation_engine": "選擇翻譯引擎"
    },
    "ja-JP": {
        "app_title": "Feedback Translation Link",
        "app_subtitle": "製造現場中日双方向リアルタイム翻訳ロビー",
        "tab_login": "ログイン",
        "tab_register": "新規登録",
        "label_id": "ユーザー ID",
        "placeholder_id": "作成済みのIDを入力",
        "label_pwd": "パスワード",
        "placeholder_pwd": "パスワードを入力 (一般ユーザーは4桁)",
        "btn_login": "ログイン",
        "label_new_id": "新規ユーザー ID",
        "placeholder_new_id": "例：Sato、王エンジニア",
        "label_new_pwd": "4桁の数字パスワードを入力",
        "placeholder_new_pwd": "例：1234",
        "btn_register": "アカウントを作成してログイン",
        "default_admin_text": "デフォルト管理者ID: ",
        "api_unset": "API 未設定",
        "not_logged_in": "未ログイン",
        "operator": "オペレーター",
        "btn_logout": "ログアウト",
        "channel_list": "チャンネル",
        "public_lobby": "📢 公開ロビー",
        "private_chat": "プライベートチャット",
        "online_users": "オンラインメンバー",
        "admin_accounts": "アカウント管理 (管理者)",
        "public_desc": "このチャンネルのメッセージは自動翻訳され、全員が閲覧できます。",
        "admin_functions": "管理機能：",
        "clear_history": "この会話履歴をクリア",
        "chat_start_notice": "会話開始。入力されたメッセージは中日リアルタイム双方向翻訳されます。",
        "quick_phrases_label": "現場よく使うフレーズ：",
        "btn_edit_phrases": "フレーズを編集 (管理者のみ)",
        "detecting_lang": "自動言語検出中...",
        "input_placeholder": "中国語を入力すると日本語に、日本語を入力すると中国語に自動翻訳されます... Enterで送信",
        "btn_send": "送信",
        "edit_phrases_title": "現場フレーズを編集",
        "edit_phrases_desc": "以下のリストのフレーズを追加、変更、または削除します。変更はすべてのユーザーに同期されます。",
        "add_row": "行を追加",
        "cancel": "キャンセル",
        "save_changes": "変更を保存",
        "err_wrong_pwd": "パスワードが間違っています！",
        "err_empty_login": "IDとパスワードを入力してください",
        "err_pwd_4digits": "パスワードは4桁の数字である必要があります",
        "err_id_taken": "このIDは既に登録されています。",
        "err_api_missing": "API設定を確認してください...",
        "toast_login_success": "ログイン成功",
        "toast_welcome_back": "お帰りなさい",
        "toast_phrase_updated": "フレーズを更新しました",
        "toast_phrase_failed": "フレーズの更新に失敗しました",
        "toast_history_cleared": "チャット履歴をクリアしました",
        "private_chat_with": "{name} とのプライベートチャット",
        "private_chat_desc": "ここは双方向リアルタイム翻訳のプライベートチャンネルです。双方がメッセージを見ることができます。",
        "status_admin": "管理者",
        "status_operator": "オペレーター",
        "status_online": "オンライン",
        "status_offline": "オフライン",
        "placeholder_edit_phrase": "フレーズを入力してください...",
        "err_keep_one_phrase": "最低1つのフレーズを残す必要があります。",
        "confirm_delete_account": "アカウント「{id}」を削除してもよろしいですか？",
        "confirm_clear_chat": "このチャンネルの会話履歴をクリアしてもよろしいですか？この操作は元に戻せません！",
        "new_message_alert": "💬 新しいメッセージがあります！",
        "err_no_account": "アカウントが見つかりません。IDが正しいか確認するか、「新規アカウント登録」をクリックしてください。",
        "err_id_empty": "ユーザーIDを入力してください！",
        "err_reserved_id": "この予約IDは登録できません！",
        "toast_register_success": "アカウント登録成功！自動ログインしました。",
        "toast_account_deleted": "アカウント「{id}」は管理者により削除されました。",
        "err_translate_failed": "翻訳失敗：翻訳サーバーに接続できません",
        "err_copy_failed": "コピー失敗",
        "confirm_logout": "ログアウトしてもよろしいですか？",
        "confirm_delete_msg": "このメッセージを削除してもよろしいですか？",
        "err_firebase_sdk_failed": "Firebase SDK が読み込まれていません。オフラインモードを使用します。",
        "err_firebase_connect_failed": "Firebase の接続に失敗しました。オフラインモードを使用します。",
        "settings_title": "システム設定 (AI翻訳エンジン)",
        "label_translation_engine": "翻訳エンジンを選択"
    }
};

let appState = {
    currentUser: null,
    activeUserSim: null,
    activeChannel: "public",
    messages: [],
    users: [],
    accounts: [],
    quickPhrases: [],
    apiKey: "",
    apiModel: "gemini-2.0-flash",
    engine: localStorage.getItem("feedback_chat_engine") || "google",
    geminiKey: localStorage.getItem("feedback_gemini_key") || "",
    groqKey: localStorage.getItem("feedback_groq_key") || "",
    unreadCounts: {},
    lastRead: {},
    uiLanguage: localStorage.getItem("feedback_chat_ui_lang") || "zh-TW",
    hideSystemMessages: localStorage.getItem("hide_system_messages") === "1",
    replyingTo: null
};

function t(key, params = {}) {
    let text = I18N_DICT[appState.uiLanguage][key] || I18N_DICT["zh-TW"][key] || key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

window.changeUILanguage = function(lang) {
    if (I18N_DICT[lang]) {
        appState.uiLanguage = lang;
        localStorage.setItem("feedback_chat_ui_lang", lang);
        updateUIDOM();
    }
};

function updateUIDOM() {
    // 1. 更新帶有 data-i18n 的文字
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        // 保留原有的圖示 (如果有)
        const icon = el.querySelector("i");
        if (icon) {
            el.innerHTML = "";
            el.appendChild(icon);
            el.appendChild(document.createTextNode(" " + t(key)));
        } else {
            el.textContent = t(key);
        }
    });
    
    // 2. 更新帶有 data-i18n-placeholder 的文字
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.placeholder = t(key);
    });

    // 3. 強制刷新依賴動態語言的介面 (頻道標題、在線列表等)
    if (appState.currentUser) {
        switchChannel(appState.activeChannel);
        renderRegisteredAccountsForAdmin();
        renderOnlineUsers();
        if (typeof renderQuickPhrases === "function") {
            renderQuickPhrases();
        }
        
        // 更新使用者身分文字
        const roleSpan = document.getElementById("current-user-role");
        if (roleSpan && appState.currentUser) {
            roleSpan.textContent = appState.currentUser.role === "管理員" ? t("status_admin") : t("status_operator");
        }
    }
}


// -----------------------------------------------------------
//  視窗標題閃爍提醒與桌面通知 (背景通知)
// -----------------------------------------------------------
let originalTitle = document.title || "即時通訊與翻譯";
let titleFlashInterval = null;

function requestDesktopNotification() {
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }
}

function showDesktopNotification() {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(t("new_message_alert"), {
            body: t("app_subtitle")
        });
    }
}

function startTitleFlash() {
    if (titleFlashInterval) return;
    let showNew = true;
    titleFlashInterval = setInterval(() => {
        document.title = showNew ? t("new_message_alert") : originalTitle;
        showNew = !showNew;
    }, 1000);
}

function stopTitleFlash() {
    if (titleFlashInterval) {
        clearInterval(titleFlashInterval);
        titleFlashInterval = null;
    }
    document.title = originalTitle;
}

window.addEventListener("focus", stopTitleFlash);
window.addEventListener("mousemove", stopTitleFlash);
window.addEventListener("click", stopTitleFlash);

function playNotificationSound() {
    try { sound.playNotification(); } catch (e) {}
    if (!document.hasFocus()) {
        startTitleFlash();
        showDesktopNotification();
    }
}

requestDesktopNotification();

let firebaseReady = false;
let db = null; // Firebase database reference
let firebaseListenersAttached = false;

// -----------------------------------------------------------
//  系統設定 (AI 翻譯引擎)
// -----------------------------------------------------------
window.openSettingsModal = function() {
    document.getElementById("settings-modal").style.display = "flex";
    document.getElementById("engine-select").value = appState.engine;
    document.getElementById("gemini-api-key").value = appState.geminiKey;
    document.getElementById("groq-api-key").value = appState.groqKey;
    window.toggleEngineSettings();
};

window.closeSettingsModal = function() {
    document.getElementById("settings-modal").style.display = "none";
};

window.toggleEngineSettings = function() {
    const engine = document.getElementById("engine-select").value;
    const isAdmin = appState.currentUser && appState.currentUser.role === "管理員";
    
    // 只有管理員才看得到金鑰輸入框
    if (isAdmin) {
        document.getElementById("settings-gemini").style.display = (engine === "gemini") ? "block" : "none";
        document.getElementById("settings-groq").style.display = (engine === "groq") ? "block" : "none";
    } else {
        document.getElementById("settings-gemini").style.display = "none";
        document.getElementById("settings-groq").style.display = "none";
    }
};

window.saveSettings = function() {
    const isAdmin = appState.currentUser && appState.currentUser.role === "管理員";
    const newEngine = document.getElementById("engine-select").value;
    
    let updates = { engine: newEngine };
    
    // 如果是管理員，連同 API 金鑰一起上傳更新
    if (isAdmin) {
        updates.geminiKey = document.getElementById("gemini-api-key").value.trim();
        updates.groqKey = document.getElementById("groq-api-key").value.trim();
    }
    
    // 同步到 Firebase (所有連線者會因為 setupFirebaseListeners 而自動切換)
    if (firebaseReady && db) {
        db.ref("settings").update(updates)
            .then(() => {
                showToast("設定已同步更新至雲端", "success");
            })
            .catch(err => {
                showToast("設定更新失敗", "error");
            });
    } else {
        showToast("尚未連接至雲端", "error");
    }
    
    closeSettingsModal();
};

function updateApiBadge() {
    if (!chatDom.chatApiBadge) return;
    if (appState.engine === "gemini") {
        if (appState.geminiKey) {
            chatDom.chatApiBadge.className = "api-badge green";
            chatDom.chatApiBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Gemini`;
        } else {
            chatDom.chatApiBadge.className = "api-badge red";
            chatDom.chatApiBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Gemini (未設定金鑰)`;
        }
    } else if (appState.engine === "groq") {
        if (appState.groqKey) {
            chatDom.chatApiBadge.className = "api-badge green";
            chatDom.chatApiBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Groq`;
        } else {
            chatDom.chatApiBadge.className = "api-badge red";
            chatDom.chatApiBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Groq (未設定金鑰)`;
        }
    } else {
        chatDom.chatApiBadge.className = "api-badge green";
        chatDom.chatApiBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Google Translate`;
    }
}

// 初始化 API Badge
document.addEventListener("DOMContentLoaded", () => {
    // 延遲更新以確保 DOM 已載入
    setTimeout(updateApiBadge, 500);
});

// -----------------------------------------------------------
//  翻譯 API 實作
// -----------------------------------------------------------

async function translateWithGemini(text, from, to) {
    if (!appState.geminiKey) return "API Key未設定";
    const prompt = `Translate the following text from ${from} to ${to}. Only output the translated text, nothing else.\nText: ${text}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${appState.geminiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1 }
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        console.error("[Gemini API] Error:", e);
        return `⚠️ Gemini 翻譯錯誤: ${e.message || "未知錯誤"}`;
    }
}

async function translateWithGroq(text, from, to) {
    if (!appState.groqKey) return "API Key未設定";
    const url = "https://api.groq.com/openai/v1/chat/completions";
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appState.groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: `You are a professional manufacturing translator. Translate exactly from ${from} to ${to} without any explanations, notes, or markdown formatting.` },
                    { role: "user", content: text }
                ],
                temperature: 0.1,
                max_tokens: 1024
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content.trim();
    } catch (e) {
        console.error("Groq Error:", e);
        return "⚠️ Groq 翻譯錯誤";
    }
}

// -----------------------------------------------------------
//  Firebase 初始化
// -----------------------------------------------------------
function isFirebaseConfigured() {
    return FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL && FIREBASE_CONFIG.projectId;
}

function initFirebase() {
    if (!isFirebaseConfigured()) {
        console.warn("[Firebase] 設定未填寫，使用 LocalStorage 離線模式。");
        firebaseReady = false;
        return false;
    }
    try {
        // 檢查 firebase 是否已載入
        if (typeof firebase === "undefined") {
            console.error("[Firebase] SDK 未載入！請確認 chat.html 中的 Firebase script 標籤。");
            showToast(t("err_firebase_sdk_failed"), "error");
            firebaseReady = false;
            return false;
        }
        // 避免重複初始化
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        db = firebase.database();
        firebaseReady = true;
        console.log("[Firebase] 初始化成功！已連接至雲端資料庫。");
        return true;
    } catch (err) {
        console.error("[Firebase] 初始化失敗:", err);
        showToast(t("err_firebase_connect_failed"), "error");
        firebaseReady = false;
        return false;
    }
}

function sanitizeFirebaseKey(key) {
    return String(key).replace(/[.#$\[\]\/]/g, "_");
}

// -----------------------------------------------------------
//  Firebase 即時監聽器
// -----------------------------------------------------------
function setupFirebaseListeners() {
    if (!firebaseReady || !db || firebaseListenersAttached) return;
    firebaseListenersAttached = true;

    // ── 監聽訊息變動 ──
    let isFirstMessagesLoad = true;
    db.ref("messages").orderByChild("timestamp").on("value", (snapshot) => {
        const data = snapshot.val();
        let newMessagesArray = [];
        if (data) {
            newMessagesArray = Object.values(data).sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
        }
        
        // 處理未讀與通知
        if (isFirstMessagesLoad) {
            recalculateUnreadCounts();
        } else {
            const existingIds = new Set(appState.messages.map(m => m.id));
            const newlyAdded = newMessagesArray.filter(m => !existingIds.has(m.id));
            
            newlyAdded.forEach(msg => {
                if (msg.senderId !== appState.activeUserSim && !msg.isSystem) {
                    if (msg.channel === "public") {
                        if (appState.activeChannel !== "public") {
                            appState.unreadCounts["public"] = (appState.unreadCounts["public"] || 0) + 1;
                        }
                        playNotificationSound();
                    } else if (msg.channel === `private_${appState.activeUserSim}`) {
                        // 這是一條私訊「傳給我」的訊息
                        const sourceChannelForMe = `private_${msg.senderId}`;
                        if (appState.activeChannel !== sourceChannelForMe) {
                            appState.unreadCounts[sourceChannelForMe] = (appState.unreadCounts[sourceChannelForMe] || 0) + 1;
                        }
                        playNotificationSound();
                    }
                }
            });
        }
        
        appState.messages = newMessagesArray;
        isFirstMessagesLoad = false;
        
        // 若停留在當前頻道，順便更新該頻道的最後讀取時間
        if (appState.activeChannel && appState.currentUser) {
            appState.lastRead[appState.activeChannel] = new Date().toISOString();
            localStorage.setItem(`feedback_chat_last_read_${appState.currentUser.id}`, JSON.stringify(appState.lastRead));
        }
        
        renderMessages();
        renderPrivateChannels(); // 更新側邊欄，讓剛收到私聊的頻道顯示出來並顯示未讀
        
        // 更新大廳未讀標記
        const unreadPublicBadge = document.getElementById("unread-public");
        if (unreadPublicBadge) {
            const count = appState.unreadCounts["public"] || 0;
            unreadPublicBadge.style.display = count > 0 ? "" : "none";
            unreadPublicBadge.textContent = count;
        }
    });

    // ── 監聽帳號變動 ──
    db.ref("accounts").on("value", (snapshot) => {
        const data = snapshot.val();
        if (data) {
            appState.accounts = Object.values(data);
        } else {
            appState.accounts = [];
        }
        // 如果帳號庫為空，寫入預設帳號
        if (appState.accounts.length === 0) {
            writeDefaultAccounts();
        }
        renderRegisteredAccountsForAdmin();
    });

    // ── 監聽在線用戶變動 ──
    db.ref("online_users").on("value", (snapshot) => {
        const data = snapshot.val();
        if (data) {
            appState.users = Object.values(data);
        } else {
            appState.users = [];
        }
        renderOnlineUsers();
        renderPrivateChannels();
        fillSimulatorSelect();
    });

    // ── 監聽現場常用語變動 ──
    db.ref("quick_phrases").on("value", (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
            appState.quickPhrases = data;
        } else {
            // 寫入預設值
            appState.quickPhrases = [
                "機台發生故障，請求支援。",
                "品質檢驗已完成，全部合格。",
                "正在進行線切割加工製程。",
                "設備清潔與放電加工準備完成。",
                "設備のエラーが発生しました。",
                "製品の検査が完了しました。"
            ];
            db.ref("quick_phrases").set(appState.quickPhrases);
        }
        if (typeof renderQuickPhrases === "function") {
            renderQuickPhrases();
        }
    });

    // ── 監聽全域設定 (AI 引擎與金鑰) ──
    db.ref("settings").on("value", (snapshot) => {
        const data = snapshot.val();
        if (data) {
            appState.engine = data.engine || "google";
            appState.geminiKey = data.geminiKey || "";
            appState.groqKey = data.groqKey || "";
            
            // 同步更新設定面板 UI (如果有打開的話)
            const engineSelect = document.getElementById("engine-select");
            if (engineSelect) {
                engineSelect.value = appState.engine;
                document.getElementById("gemini-api-key").value = appState.geminiKey;
                document.getElementById("groq-api-key").value = appState.groqKey;
                
                // 只有打開面板的當下才需要切換 UI，但為了安全起見，如果不是管理員，不要填入金鑰
                const isAdmin = appState.currentUser && appState.currentUser.role === "管理員";
                if (!isAdmin) {
                    document.getElementById("gemini-api-key").value = "";
                    document.getElementById("groq-api-key").value = "";
                }
                
                if (typeof window.toggleEngineSettings === "function") {
                    window.toggleEngineSettings();
                }
            }
            updateApiBadge();
        }
    });
}

// -----------------------------------------------------------
//  資料操作：儲存與讀取（Firebase 優先，LocalStorage fallback）
// -----------------------------------------------------------

// ── 訊息 ──
function saveMessageToStore(msg) {
    if (firebaseReady && db) {
        db.ref("messages/" + sanitizeFirebaseKey(msg.id)).set(msg);
    } else {
        // LocalStorage fallback
        const idx = appState.messages.findIndex(m => m.id === msg.id);
        if (idx !== -1) {
            appState.messages[idx] = msg;
        } else {
            appState.messages.push(msg);
        }
        localStorage.setItem("feedback_chat_messages", JSON.stringify(appState.messages));
    }
}

function updateMessageInStore(msgId, updates) {
    if (firebaseReady && db) {
        db.ref("messages/" + sanitizeFirebaseKey(msgId)).update(updates);
    } else {
        const idx = appState.messages.findIndex(m => m.id === msgId);
        if (idx !== -1) {
            Object.assign(appState.messages[idx], updates);
            localStorage.setItem("feedback_chat_messages", JSON.stringify(appState.messages));
        }
    }
}

function deleteMessageFromStore(msgId) {
    if (firebaseReady && db) {
        db.ref("messages/" + sanitizeFirebaseKey(msgId)).remove();
    } else {
        appState.messages = appState.messages.filter(m => m.id !== msgId);
        localStorage.setItem("feedback_chat_messages", JSON.stringify(appState.messages));
    }
}

function clearChannelMessagesFromStore(channel, relatedUserId) {
    if (firebaseReady && db) {
        // 必須逐條刪除（Firebase 沒有條件刪除）
        const toDelete = appState.messages.filter(msg => {
            if (channel === "public") return msg.channel === "public";
            const isMatch = msg.channel === `private_${relatedUserId}` || msg.channel === `private_${appState.activeUserSim}`;
            const isRelated = (msg.senderId === appState.activeUserSim && msg.channel === `private_${relatedUserId}`) ||
                              (msg.senderId === relatedUserId && msg.channel === `private_${appState.activeUserSim}`);
            return isMatch && isRelated;
        });
        const updates = {};
        toDelete.forEach(msg => {
            updates["messages/" + sanitizeFirebaseKey(msg.id)] = null;
        });
        if (Object.keys(updates).length > 0) {
            db.ref().update(updates);
        }
    } else {
        if (channel === "public") {
            appState.messages = appState.messages.filter(m => m.channel !== "public");
        } else {
            const targetId = channel.replace("private_", "");
            appState.messages = appState.messages.filter(m => {
                const isMatch = m.channel === `private_${targetId}` || m.channel === `private_${appState.activeUserSim}`;
                const isRelated = (m.senderId === appState.activeUserSim && m.channel === `private_${targetId}`) ||
                                  (m.senderId === targetId && m.channel === `private_${appState.activeUserSim}`);
                return !(isMatch && isRelated);
            });
        }
        localStorage.setItem("feedback_chat_messages", JSON.stringify(appState.messages));
    }
}

// ── 帳號 ──
function saveAccountToStore(account) {
    if (firebaseReady && db) {
        db.ref("accounts/" + sanitizeFirebaseKey(account.id)).set(account);
    } else {
        const idx = appState.accounts.findIndex(a => a.id === account.id);
        if (idx !== -1) {
            appState.accounts[idx] = account;
        } else {
            appState.accounts.push(account);
        }
        localStorage.setItem("feedback_chat_accounts", JSON.stringify(appState.accounts));
    }
}

function deleteAccountFromStore(userId) {
    if (firebaseReady && db) {
        db.ref("accounts/" + sanitizeFirebaseKey(userId)).remove();
    } else {
        appState.accounts = appState.accounts.filter(a => a.id !== userId);
        localStorage.setItem("feedback_chat_accounts", JSON.stringify(appState.accounts));
    }
}

function writeDefaultAccounts() {
    const defaults = [
        { id: "Feedback", name: "Feedback (管理員)", role: "管理員", password: "Feedback" },
        { id: "Feedback管理員", name: "Feedback管理員", role: "管理員", password: "Feedback" },
        { id: "Sato", name: "佐藤 (Sato 專家)", role: "技術專家", password: "0000" },
        { id: "張主任", name: "張主任 (CNC現場主管)", role: "現場主管", password: "1111" },
        { id: "王小明", name: "王小明 (線切割操作員)", role: "操作員", password: "2222" }
    ];
    defaults.forEach(acc => saveAccountToStore(acc));
    appState.accounts = defaults;
}

// ── 在線用戶 ──
function goOnline(userObj) {
    if (firebaseReady && db) {
        const key = sanitizeFirebaseKey(userObj.id);
        const ref = db.ref("online_users/" + key);
        ref.set(userObj);
        // 當瀏覽器關閉或斷線時，自動移除在線狀態
        ref.onDisconnect().remove();
    } else {
        const idx = appState.users.findIndex(u => u.id === userObj.id);
        if (idx !== -1) {
            appState.users[idx] = userObj;
        } else {
            appState.users.push(userObj);
        }
        localStorage.setItem("feedback_chat_users", JSON.stringify(appState.users));
    }
}

function goOffline(userId) {
    if (firebaseReady && db) {
        db.ref("online_users/" + sanitizeFirebaseKey(userId)).remove();
    } else {
        appState.users = appState.users.filter(u => u.id !== userId);
        localStorage.setItem("feedback_chat_users", JSON.stringify(appState.users));
    }
}

function updateHeartbeat(userId) {
    if (firebaseReady && db) {
        db.ref("online_users/" + sanitizeFirebaseKey(userId) + "/lastSeen").set(new Date().toISOString());
    }
}

// -----------------------------------------------------------
//  LocalStorage 離線模式的資料載入
// -----------------------------------------------------------
function loadLocalMessages() {
    const raw = localStorage.getItem("feedback_chat_messages");
    if (raw) {
        try { appState.messages = JSON.parse(raw); } catch (e) { appState.messages = []; }
    }
}

function loadLocalUsers() {
    const rawAccounts = localStorage.getItem("feedback_chat_accounts");
    if (rawAccounts) {
        try { appState.accounts = JSON.parse(rawAccounts); } catch (e) { appState.accounts = []; }
    }
    if (appState.accounts.length === 0) {
        writeDefaultAccounts();
    }
    // 確保 Feedback 管理員帳號存在
    if (!appState.accounts.some(acc => acc.id === "Feedback")) {
        const fbAcc = { id: "Feedback", name: "Feedback (管理員)", role: "管理員", password: "Feedback" };
        appState.accounts.push(fbAcc);
        localStorage.setItem("feedback_chat_accounts", JSON.stringify(appState.accounts));
    }

    const rawUsers = localStorage.getItem("feedback_chat_users");
    if (rawUsers) {
        try { appState.users = JSON.parse(rawUsers); } catch (e) { appState.users = []; }
    }

    // 清除心跳過期的非模擬用戶
    const now = Date.now();
    appState.users = appState.users.filter(u => {
        if (u.isSimulated) return true;
        if (!u.lastSeen) return false;
        return (now - new Date(u.lastSeen).getTime()) < 15000;
    });

    // 加入預設模擬在線用戶
    const defaultSims = [
        { id: "Feedback管理員", name: "Feedback管理員", role: "管理員", isSimulated: true, lastSeen: new Date().toISOString() },
        { id: "Sato", name: "佐藤 (Sato 專家)", role: "技術專家", isSimulated: true, lastSeen: new Date().toISOString() },
        { id: "張主任", name: "張主任 (CNC現場主管)", role: "現場主管", isSimulated: true, lastSeen: new Date().toISOString() },
        { id: "王小明", name: "王小明 (線切割操作員)", role: "操作員", isSimulated: true, lastSeen: new Date().toISOString() }
    ];
    defaultSims.forEach(sim => {
        const accExists = appState.accounts.some(acc => acc.id === sim.id);
        const onlineExists = appState.users.some(u => u.id === sim.id);
        if (accExists && !onlineExists) {
            appState.users.push(sim);
        }
    });
    localStorage.setItem("feedback_chat_users", JSON.stringify(appState.users));
}

// -----------------------------------------------------------
//  DOM 元素引用
// -----------------------------------------------------------
const chatDom = {
    loginContainer: document.getElementById("login-container"),
    loginUserId: document.getElementById("login-user-id"),
    adminPasswordGroup: document.getElementById("admin-password-group"),
    loginPassword: document.getElementById("login-password"),
    btnLogin: document.getElementById("btn-login"),
    appContainer: document.getElementById("app-container"),
    chatApiBadge: document.getElementById("chat-api-badge"),
    currentUserAvatar: document.getElementById("current-user-avatar"),
    currentUsername: document.getElementById("current-username"),
    currentUserRole: document.getElementById("current-user-role"),
    btnLogout: document.getElementById("btn-logout"),
    onlineUsersList: document.getElementById("online-users-list"),
    privateChatsList: document.getElementById("private-chats-list"),
    activeChatTitle: document.getElementById("active-chat-title"),
    activeChatDesc: document.getElementById("active-chat-desc"),
    adminControls: document.getElementById("admin-controls"),
    btnClearChat: document.getElementById("btn-clear-chat"),
    messagesContainer: document.getElementById("messages-container"),
    quickPhraseBtns: document.querySelectorAll(".quick-phrase-btn"),
    detectorText: document.getElementById("detector-text"),
    chatMessageInput: document.getElementById("chat-message-input"),
    btnSendMessage: document.getElementById("btn-send-message")
};

// -----------------------------------------------------------
//  設定讀取 (API Key / Model — 始終存在 LocalStorage)
// -----------------------------------------------------------
// -----------------------------------------------------------
//  (已被移除: loadSettings 與 updateApiBadgeUI)
// -----------------------------------------------------------

// -----------------------------------------------------------
//  初始化入口
// -----------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    updateUIDOM();
    
    const langSelect = document.getElementById("ui-lang-select");
    if (langSelect) {
        langSelect.value = appState.uiLanguage;
    }

    // 初始化 Firebase
    const fbOk = initFirebase();

    if (fbOk) {
        // Firebase 模式：設置即時監聽器，資料會自動同步
        setupFirebaseListeners();
        // 等待帳號資料載入後再檢查登入狀態（使用一次性讀取）
        db.ref("accounts").once("value", (snapshot) => {
            const data = snapshot.val();
            if (data) {
                appState.accounts = Object.values(data);
            }
            if (appState.accounts.length === 0) {
                writeDefaultAccounts();
            }
            checkSavedLogin();
        });
    } else {
        // LocalStorage 離線模式
        loadLocalMessages();
        loadLocalUsers();
        pruneOldMessages();
        checkSavedLogin();
        setupLocalStorageSync();
    }

    setupChatEventListeners();
    applySystemMessageState();

    // Firebase 未設定時顯示提示（不阻止使用）
    if (!fbOk) {
        showFirebaseSetupBanner();
    }
});

function checkSavedLogin() {
    const savedUser = sessionStorage.getItem("current_login_user");
    if (savedUser) {
        try {
            appState.currentUser = JSON.parse(savedUser);
            appState.activeUserSim = appState.currentUser.id;
            enterApp();
        } catch (e) {
            sessionStorage.removeItem("current_login_user");
        }
    }
}

// LocalStorage 離線模式的心跳與同步
function setupLocalStorageSync() {
    // 心跳更新（每 4 秒）
    setInterval(() => {
        if (appState.currentUser && !appState.currentUser.isSimulated) {
            const rawUsers = localStorage.getItem("feedback_chat_users");
            if (rawUsers) {
                try {
                    let onlineUsers = JSON.parse(rawUsers);
                    const idx = onlineUsers.findIndex(u => u.id === appState.currentUser.id);
                    if (idx !== -1) {
                        onlineUsers[idx].lastSeen = new Date().toISOString();
                        localStorage.setItem("feedback_chat_users", JSON.stringify(onlineUsers));
                    }
                } catch (e) {}
            }
        }
    }, 4000);

    // 離線清除（每 8 秒）
    setInterval(() => {
        const rawUsers = localStorage.getItem("feedback_chat_users");
        if (rawUsers) {
            try {
                let onlineUsers = JSON.parse(rawUsers);
                const now = Date.now();
                let hasChanges = false;
                const pruned = onlineUsers.filter(u => {
                    if (u.isSimulated) return true;
                    const lastSeenTime = new Date(u.lastSeen).getTime();
                    const isAlive = (now - lastSeenTime) < 15000;
                    if (!isAlive) hasChanges = true;
                    return isAlive;
                });
                if (hasChanges) {
                    localStorage.setItem("feedback_chat_users", JSON.stringify(pruned));
                    appState.users = pruned;
                    renderOnlineUsers();
                    renderPrivateChannels();
                    fillSimulatorSelect();
                }
            } catch (e) {}
        }
    }, 8000);

    // 監聽 LocalStorage 變更（同瀏覽器多分頁）
    window.addEventListener("storage", (e) => {
        if (e.key === "feedback_chat_messages") {
            loadLocalMessages();
            renderMessages();
        } else if (e.key === "feedback_chat_users") {
            loadLocalUsers();
            renderOnlineUsers();
            renderPrivateChannels();
            fillSimulatorSelect();
        } else if (e.key === "feedback_chat_accounts") {
            loadLocalUsers();
            renderRegisteredAccountsForAdmin();
        }
    });
}

// 視窗關閉時的清理
window.addEventListener("beforeunload", () => {
    if (appState.currentUser && !appState.currentUser.isSimulated) {
        if (firebaseReady && db) {
            // Firebase 的 onDisconnect() 會自動處理，但也手動清除以加速
            db.ref("online_users/" + sanitizeFirebaseKey(appState.currentUser.id)).remove();
        } else {
            const rawUsers = localStorage.getItem("feedback_chat_users");
            if (rawUsers) {
                try {
                    let onlineUsers = JSON.parse(rawUsers);
                    onlineUsers = onlineUsers.filter(u => u.id !== appState.currentUser.id);
                    localStorage.setItem("feedback_chat_users", JSON.stringify(onlineUsers));
                } catch (e) {}
            }
        }
    }
});

// -----------------------------------------------------------
//  Firebase Setup 提示橫幅
// -----------------------------------------------------------
function showFirebaseSetupBanner() {
    // 如果使用者已手動關閉過，不再顯示
    if (sessionStorage.getItem("firebase_banner_dismissed")) return;

    const banner = document.createElement("div");
    banner.id = "firebase-setup-banner";
    banner.className = "firebase-banner";
    banner.innerHTML = `
        <div class="firebase-banner-content">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <div class="firebase-banner-text">
                <strong>目前為離線模式</strong> — 不同瀏覽器之間的帳號與訊息無法同步。
                <a href="javascript:void(0)" onclick="showFirebaseSetupGuide()">點此設定 Firebase 以啟用跨瀏覽器同步 →</a>
            </div>
            <button class="firebase-banner-close" onclick="dismissFirebaseBanner()" title="關閉提示">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `;
    document.body.prepend(banner);
}

window.dismissFirebaseBanner = function() {
    const banner = document.getElementById("firebase-setup-banner");
    if (banner) {
        banner.classList.add("banner-exit");
        setTimeout(() => banner.remove(), 300);
    }
    sessionStorage.setItem("firebase_banner_dismissed", "1");
};

window.showFirebaseSetupGuide = function() {
    // 建立設定指南 Modal
    const existing = document.getElementById("firebase-guide-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "firebase-guide-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal-dialog firebase-guide-dialog">
            <div class="modal-header">
                <h3><i class="fa-solid fa-database"></i> Firebase Realtime Database 設定指南</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="guide-step">
                    <span class="step-number">1</span>
                    <div class="step-content">
                        <h4>建立 Firebase 專案</h4>
                        <p>前往 <a href="https://console.firebase.google.com/" target="_blank">console.firebase.google.com</a>，點擊「新增專案」，輸入任意名稱（例如 <code>feedback-chat</code>），點擊建立。</p>
                    </div>
                </div>
                <div class="guide-step">
                    <span class="step-number">2</span>
                    <div class="step-content">
                        <h4>建立 Realtime Database</h4>
                        <p>左側選單 →「建構」→「Realtime Database」→「建立資料庫」→ 選擇位置（建議 <code>asia-southeast1</code>）→ 選擇<strong>「以測試模式開始」</strong>。</p>
                    </div>
                </div>
                <div class="guide-step">
                    <span class="step-number">3</span>
                    <div class="step-content">
                        <h4>註冊網頁應用程式</h4>
                        <p>回到專案總覽 → 點擊齒輪「專案設定」→ 下方「您的應用程式」→ 點擊 <code>&lt;/&gt;</code> (網頁) 圖示 → 輸入暱稱 → 註冊。</p>
                    </div>
                </div>
                <div class="guide-step">
                    <span class="step-number">4</span>
                    <div class="step-content">
                        <h4>複製設定到 chat.js</h4>
                        <p>將 Firebase 顯示的 <code>firebaseConfig</code> 物件內容複製並貼到 <code>chat.js</code> 最上方的 <code>FIREBASE_CONFIG</code> 中，然後重新整理頁面即可。</p>
                        <pre class="code-example">const FIREBASE_CONFIG = {
    apiKey: "AIzaSy...",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};</pre>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fa-solid fa-check"></i> 我已了解
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// -----------------------------------------------------------
//  語言偵測
// -----------------------------------------------------------
function detectJapanese(text) {
    const jaRegex = /[\u3040-\u309F\u30A0-\u30FF\uFF66-\uFF9F]/;
    return jaRegex.test(text);
}

// -----------------------------------------------------------
//  清除超過 7 天的訊息
// -----------------------------------------------------------
function pruneOldMessages() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const initialCount = appState.messages.length;
    const toDelete = appState.messages.filter(msg => new Date(msg.timestamp).getTime() < sevenDaysAgo);

    if (toDelete.length > 0) {
        toDelete.forEach(msg => deleteMessageFromStore(msg.id));
        appState.messages = appState.messages.filter(msg => new Date(msg.timestamp).getTime() >= sevenDaysAgo);
        console.log(`已清理 ${toDelete.length} 條超過 7 天的歷史對話。`);
    }
}

// -----------------------------------------------------------
//  事件監聽器設定
// -----------------------------------------------------------
function setupChatEventListeners() {
    // 登入
    chatDom.btnLogin.addEventListener("click", handleLogin);
    chatDom.loginUserId.addEventListener("keydown", (e) => {
        if (e.key === "Enter") chatDom.loginPassword.focus();
    });
    chatDom.loginPassword.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleLogin();
    });

    // 註冊
    const btnRegister = document.getElementById("btn-register");
    if (btnRegister) btnRegister.addEventListener("click", handleRegister);
    const registerUserId = document.getElementById("register-user-id");
    const registerPassword = document.getElementById("register-password");
    if (registerUserId) {
        registerUserId.addEventListener("keydown", (e) => {
            if (e.key === "Enter") registerPassword.focus();
        });
    }
    if (registerPassword) {
        registerPassword.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleRegister();
        });
    }

    // 登出
    chatDom.btnLogout.addEventListener("click", handleLogout);

    // 公開大廳
    document.querySelector('[data-channel="public"]').addEventListener("click", () => {
        switchChannel("public");
    });

    // 傳送訊息
    chatDom.btnSendMessage.addEventListener("click", sendMessage);
    chatDom.chatMessageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 語言偵測
    chatDom.chatMessageInput.addEventListener("input", (e) => {
        const text = e.target.value;
        if (text.trim() === "") {
            chatDom.detectorText.textContent = "自動語言偵測中...";
        } else if (detectJapanese(text)) {
            chatDom.detectorText.textContent = "偵測到語言：日本語 ➔ 翻譯成中文";
        } else {
            chatDom.detectorText.textContent = "偵測到語言：繁體中文 ➔ 翻譯成日文";
        }
    });

    // 快速片語
    chatDom.quickPhraseBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            chatDom.chatMessageInput.value = btn.textContent;
            chatDom.chatMessageInput.focus();
            chatDom.chatMessageInput.dispatchEvent(new Event("input"));
        });
    });

    // 管理員清空歷史
    chatDom.btnClearChat.addEventListener("click", handleClearChannelHistory);
}

// -----------------------------------------------------------
//  登入 / 註冊 / 登出
// -----------------------------------------------------------
function handleLogin() {
    const loginId = chatDom.loginUserId.value.trim();
    const loginPwd = chatDom.loginPassword.value.trim();

    if (!loginId) {
        showToast(t("err_id_empty"), "warning");
        return;
    }

    const acc = appState.accounts.find(x => x.id === loginId);
    if (!acc) {
        showToast(t("err_no_account"), "error");
        return;
    }

    if (acc.password !== loginPwd) {
        showToast(t("err_wrong_pwd"), "error");
        return;
    }

    loginAsUser(acc);
}

function handleRegister() {
    const regId = document.getElementById("register-user-id").value.trim();
    const regPwd = document.getElementById("register-password").value.trim();

    if (!regId) {
        showToast(t("err_id_empty"), "warning");
        return;
    }

    if (regId.toLowerCase() === "feedback管理員" || regId.toLowerCase() === "feedback") {
        showToast(t("err_reserved_id"), "error");
        return;
    }

    if (!/^\d{4}$/.test(regPwd)) {
        showToast(t("err_pwd_4digits"), "warning");
        return;
    }

    const isExist = appState.accounts.some(acc => acc.id.toLowerCase() === regId.toLowerCase());
    if (isExist) {
        showToast(t("err_id_taken"), "warning");
        return;
    }

    let role = "操作員";
    if (regId.includes("主任") || regId.includes("主管")) {
        role = "現場主管";
    } else if (regId.toLowerCase().includes("sato") || regId.includes("佐藤")) {
        role = "技術專家";
    }

    const newAcc = { id: regId, name: regId, role: role, password: regPwd };
    saveAccountToStore(newAcc);
    // 也更新本地狀態（Firebase listener 會再次同步）
    if (!appState.accounts.some(a => a.id === newAcc.id)) {
        appState.accounts.push(newAcc);
    }

    loginAsUser(newAcc);
    showToast(t("toast_register_success"), "success");
}

function loginAsUser(acc) {
    const userObj = {
        id: acc.id,
        name: acc.name,
        role: acc.role,
        isSimulated: false,
        lastSeen: new Date().toISOString()
    };

    goOnline(userObj);

    appState.currentUser = userObj;
    appState.activeUserSim = acc.id;
    sessionStorage.setItem("current_login_user", JSON.stringify(userObj));

    enterApp();
}

function enterApp() {
    chatDom.loginContainer.style.display = "none";
    chatDom.appContainer.style.display = "flex";

    const savedLastRead = localStorage.getItem(`feedback_chat_last_read_${appState.currentUser.id}`);
    if (savedLastRead) {
        try { appState.lastRead = JSON.parse(savedLastRead); } catch(e) { appState.lastRead = {}; }
    } else {
        appState.lastRead = {};
    }

    chatDom.currentUserAvatar.textContent = appState.currentUser.name.charAt(0);
    chatDom.currentUsername.textContent = appState.currentUser.name;
    chatDom.currentUserRole.textContent = appState.currentUser.role;

    fillSimulatorSelect();
    updateApiBadge();
    updateAdminPanelUI();
    renderOnlineUsers();
    renderPrivateChannels();
    renderRegisteredAccountsForAdmin();
    switchChannel("public");

    recalculateUnreadCounts();

    sendSystemNotice(`成員 [${appState.currentUser.name}] 已進入聊天室。`);
}

function handleLogout() {
    if (confirm(t("confirm_logout"))) {
        if (appState.currentUser && !appState.currentUser.isSimulated) {
            goOffline(appState.currentUser.id);
        }
        sessionStorage.removeItem("current_login_user");
        appState.currentUser = null;
        appState.activeUserSim = null;

        chatDom.appContainer.style.display = "none";
        chatDom.loginContainer.style.display = "flex";
        chatDom.loginUserId.value = "";
        chatDom.loginPassword.value = "";
        const regInputId = document.getElementById("register-user-id");
        const regInputPwd = document.getElementById("register-password");
        if (regInputId) regInputId.value = "";
        if (regInputPwd) regInputPwd.value = "";
    }
}

// -----------------------------------------------------------
//  模擬切換選單
// -----------------------------------------------------------
function fillSimulatorSelect() {
    // 該功能已被移除，保留空函式避免其他呼叫報錯
}

function updateAdminPanelUI() {
    const adminControls = document.getElementById("admin-controls");
    const adminUserManagerSection = document.getElementById("admin-user-manager-section");
    const btnEditQuickPhrases = document.getElementById("btn-edit-quick-phrases");
    
    if (appState.currentUser && appState.currentUser.role === "管理員") {
        if (adminControls) adminControls.style.display = "flex";
        if (adminUserManagerSection) adminUserManagerSection.style.display = "block";
        if (btnEditQuickPhrases) btnEditQuickPhrases.style.display = "inline-block";
    } else {
        if (adminControls) adminControls.style.display = "none";
        if (adminUserManagerSection) adminUserManagerSection.style.display = "none";
        if (btnEditQuickPhrases) btnEditQuickPhrases.style.display = "none";
    }
}

function renderRegisteredAccountsForAdmin() {
    const listEl = document.getElementById("registered-users-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!appState.currentUser || appState.currentUser.role !== "管理員") return;

    appState.accounts.forEach(acc => {
        if (acc.id === "Feedback管理員") return;
        
        const li = document.createElement("li");
        li.className = "user-item";
        li.style.justifyContent = "space-between";
        
        // 判斷是否可以刪除（不能刪除自己，也不能刪除其他管理員）
        const isSelf = appState.currentUser && acc.id === appState.currentUser.id;
        const isAdminAccount = acc.role === "管理員";
        const canDelete = !isSelf && !isAdminAccount;
        
        const roleTrans = acc.role === "管理員" ? t("status_admin") : t("status_operator");
        
        let deleteBtnHTML = canDelete ? `
            <button class="user-item-btn-delete" title="刪除此帳號" onclick="deleteAccountByAdmin('${acc.id}')">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        ` : ``;

        li.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                <span class="user-status-dot offline"></span>
                <span class="user-item-name" title="${acc.name}">${acc.name}</span>
                <span class="user-item-role ${isAdminAccount ? 'admin' : ''}">${roleTrans}</span>
            </div>
            ${deleteBtnHTML}
        `;
        listEl.appendChild(li);
    });
}

window.deleteAccountByAdmin = function(userId) {
    if (!confirm(t("confirm_delete_account", {id: userId}))) return;

    deleteAccountFromStore(userId);
    goOffline(userId);

    // 更新本地狀態
    appState.accounts = appState.accounts.filter(a => a.id !== userId);
    appState.users = appState.users.filter(u => u.id !== userId);

    if (appState.activeUserSim === userId) {
        appState.activeUserSim = "Feedback管理員";
        const adminAcc = appState.accounts.find(x => x.id === "Feedback管理員");
        if (adminAcc) {
            appState.currentUser = { id: adminAcc.id, name: adminAcc.name, role: adminAcc.role, isSimulated: false };
            chatDom.currentUserAvatar.textContent = adminAcc.name.charAt(0);
            chatDom.currentUsername.textContent = adminAcc.name;
            chatDom.currentUserRole.textContent = adminAcc.role;
        }
    }

    fillSimulatorSelect();
    renderOnlineUsers();
    renderPrivateChannels();
    renderRegisteredAccountsForAdmin();
    renderMessages();
    showToast(t("toast_account_deleted", {id: userId}), "success");
};

window.switchLoginTab = function(tab) {
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const formLogin = document.getElementById("form-login-panel");
    const formRegister = document.getElementById("form-register-panel");
    if (tab === "login") {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        formLogin.style.display = "flex";
        formRegister.style.display = "none";
    } else {
        tabLogin.classList.remove("active");
        tabRegister.classList.add("active");
        formLogin.style.display = "none";
        formRegister.style.display = "flex";
    }
};

// -----------------------------------------------------------
//  頻道切換
// -----------------------------------------------------------
function switchChannel(channelId) {
    appState.activeChannel = channelId;
    
    if (appState.currentUser) {
        appState.lastRead[channelId] = new Date().toISOString();
        localStorage.setItem(`feedback_chat_last_read_${appState.currentUser.id}`, JSON.stringify(appState.lastRead));
    }
    
    clearUnread(channelId);

    document.querySelectorAll(".channel-item, .user-item").forEach(item => {
        const chan = item.getAttribute("data-channel");
        const priv = item.getAttribute("data-priv-id");
        if (chan === channelId || (priv && `private_${priv}` === channelId)) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    if (channelId === "public") {
        chatDom.activeChatTitle.innerHTML = t("public_lobby");
        chatDom.activeChatDesc.textContent = t("public_desc");
    } else {
        const targetUserId = channelId.replace("private_", "");
        const user = appState.users.find(u => u.id === targetUserId);
        chatDom.activeChatTitle.innerHTML = `<i class="fa-solid fa-user-shield"></i> ` + t("private_chat_with", {name: user ? user.name : targetUserId});
        chatDom.activeChatDesc.textContent = t("private_chat_desc");
    }

    renderMessages();
    
    // 手機版：切換頻道後自動收回側邊欄
    if (typeof window.toggleMobileSidebar === "function") {
        window.toggleMobileSidebar(false);
    }
}

// -----------------------------------------------------------
//  渲染：在線用戶
// -----------------------------------------------------------
function renderOnlineUsers() {
    chatDom.onlineUsersList.innerHTML = "";
    appState.users.forEach(user => {
        if (user.id === appState.activeUserSim) return;
        const li = document.createElement("li");
        li.className = "user-item";
        li.setAttribute("data-priv-id", user.id);
        const isAdmin = user.role === "管理員";
        const roleTrans = user.role === "管理員" ? t("status_admin") : t("status_operator");
        li.innerHTML = `
            <span class="user-status-dot"></span>
            <span class="user-item-name">${user.name}</span>
            <span class="user-item-role ${isAdmin ? 'admin' : ''}">${roleTrans}</span>
        `;
        li.addEventListener("click", () => switchChannel(`private_${user.id}`));
        chatDom.onlineUsersList.appendChild(li);
    });
}

// -----------------------------------------------------------
//  渲染：私聊清單
// -----------------------------------------------------------
function renderPrivateChannels() {
    chatDom.privateChatsList.innerHTML = "";
    const privateUsers = new Set();
    appState.messages.forEach(msg => {
        if (msg.channel && msg.channel.startsWith("private_")) {
            const from = msg.senderId;
            const target = msg.channel.split("_")[1];
            if (from === appState.activeUserSim) privateUsers.add(target);
            else if (target === appState.activeUserSim) privateUsers.add(from);
        }
    });

    if (privateUsers.size === 0) {
        chatDom.privateChatsList.innerHTML = `<li class="list-loading" style="padding: 10px; font-size: 0.75rem;">無歷史私聊 (點擊下方成員發起)</li>`;
        return;
    }

    privateUsers.forEach(userId => {
        const user = appState.users.find(u => u.id === userId);
        const name = user ? user.name : userId;
        const li = document.createElement("li");
        li.className = `channel-item ${appState.activeChannel === `private_${userId}` ? 'active' : ''}`;
        li.setAttribute("data-priv-id", userId);
        const unreadCount = appState.unreadCounts[`private_${userId}`] || 0;
        li.innerHTML = `
            <i class="fa-regular fa-comment"></i>
            <span>${name}</span>
            <span class="badge-unread" id="unread-priv-${userId}" style="${unreadCount > 0 ? '' : 'display: none;'}">${unreadCount}</span>
        `;
        li.addEventListener("click", () => switchChannel(`private_${userId}`));
        chatDom.privateChatsList.appendChild(li);
    });
}

// -----------------------------------------------------------
//  系統通知
// -----------------------------------------------------------
function sendSystemNotice(text) {
    const newMsg = {
        id: `sys-${Date.now()}`,
        channel: "public",
        senderId: "system",
        senderName: "系統廣播",
        senderRole: "系統",
        text: text,
        translation: "",
        timestamp: new Date().toISOString(),
        isSystem: true
    };
    saveMessageToStore(newMsg);
    if (!firebaseReady) {
        appState.messages.push(newMsg);
        renderMessages();
    }
}

// -----------------------------------------------------------
//  傳送訊息（含翻譯）
// -----------------------------------------------------------
async function sendMessage() {
    const text = chatDom.chatMessageInput.value.trim();
    if (!text) return;

    chatDom.chatMessageInput.value = "";
    chatDom.chatMessageInput.dispatchEvent(new Event("input"));

    const sender = appState.currentUser;
    const channel = appState.activeChannel;
    const tempId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const newMsg = {
        id: tempId,
        channel: channel,
        senderId: sender.id,
        senderName: sender.name,
        senderRole: sender.role,
        text: text,
        translation: "⏳ 正在翻譯中...",
        timestamp: new Date().toISOString(),
        isTranslating: true,
        hasError: false
    };

    if (appState.replyingTo) {
        newMsg.replyTo = {
            id: appState.replyingTo.id,
            text: appState.replyingTo.text,
            senderName: appState.replyingTo.senderName
        };
        cancelReply();
    }

    // 先儲存初始狀態
    saveMessageToStore(newMsg);
    if (!firebaseReady) {
        appState.messages.push(newMsg);
        renderMessages();
    }

    // 執行翻譯
    try {
        const isJa = detectJapanese(text);
        const sourceLang = isJa ? "ja" : "zh-TW";
        const targetLang = isJa ? "zh-TW" : "ja";
        
        let translatedText = "";

        // 優先檢查本地常用製造業字典
        if (LOCAL_TRANSLATION_DICT[text]) {
            translatedText = LOCAL_TRANSLATION_DICT[text];
        } else {
            if (appState.engine === "gemini" && appState.geminiKey) {
                translatedText = await translateWithGemini(text, sourceLang, targetLang);
            } else if (appState.engine === "groq" && appState.groqKey) {
                translatedText = await translateWithGroq(text, sourceLang, targetLang);
            } else {
                // 使用完全免費的 Google Translate 公開 API (免金鑰)
                translatedText = await translateWithGoogleFreeAPI(text, sourceLang, targetLang);
            }
        }

        translatedText = applyFeedbackRule(translatedText);

        // 更新翻譯結果
        const updates = { translation: translatedText, isTranslating: false, hasError: false };
        updateMessageInStore(tempId, updates);
        if (!firebaseReady) {
            const msgIdx = appState.messages.findIndex(m => m.id === tempId);
            if (msgIdx !== -1) {
                Object.assign(appState.messages[msgIdx], updates);
                renderMessages();
            }
        }

        // 私聊通知已交由 db.ref("messages").on("value") 負責跨端處理，不需在發送端增加未讀

    } catch (err) {
        console.error("翻譯失敗:", err);
        const errorText = `❌ 翻譯失敗: 請檢查網路連線`;
        const updates = { translation: errorText, isTranslating: false, hasError: true };
        updateMessageInStore(tempId, updates);
        if (!firebaseReady) {
            const msgIdx = appState.messages.findIndex(m => m.id === tempId);
            if (msgIdx !== -1) {
                Object.assign(appState.messages[msgIdx], updates);
                renderMessages();
            }
        }
        showToast(t("err_translate_failed"), "error", 4000);
    }
}

// -----------------------------------------------------------
//  Google Translate 免費公開 API (免 API 金鑰)
// -----------------------------------------------------------
async function translateWithGoogleFreeAPI(text, from, to) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    
    // 設定超時
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        // Google Translate 回傳的是巢狀陣列，第一層包含所有句子的翻譯片段
        let result = "";
        if (data && data[0]) {
            data[0].forEach(item => {
                if (item[0]) result += item[0];
            });
        }
        return result.trim() || text;

    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

// -----------------------------------------------------------
//  本地模擬翻譯
// -----------------------------------------------------------
function translateLocalFallback(text, isInputJapanese) {
    if (LOCAL_TRANSLATION_DICT[text]) return LOCAL_TRANSLATION_DICT[text];

    if (text.toLowerCase().includes("feedback")) {
        if (isInputJapanese) {
            let t = `請確認 Feedback 的相關文件。 (API金鑰未設定，此為模擬翻譯)`;
            if (text.toLowerCase().includes("japan")) t = `請確認 Feedback Japan 的相關文件。 (API金鑰未設定，此為模擬翻譯)`;
            return t;
        } else {
            let t = `Feedback の関連書類を確認してください。 (APIキー未設定、シミュレーション訳)`;
            if (text.toLowerCase().includes("japan")) t = `Feedback Japan の関連書類を確認してください。 (APIキー未設定、シミュレーション訳)`;
            return t;
        }
    }

    if (isInputJapanese) {
        return `[譯] ${text.split("").reverse().join("")} (請輸入 API 金鑰以啟用真實翻譯)`;
    } else {
        return `[シミュレーション訳] ${text} (APIキー未設定)`;
    }
}

// -----------------------------------------------------------
//  Feedback 翻譯規範
// -----------------------------------------------------------
function applyFeedbackRule(text) {
    let result = text;
    result = result.replace(/feedback\s*japan/gi, '<span class="replacement-highlight">翔名科技日本工廠</span>');
    result = result.replace(/feedback(?!(\s*japan))/gi, '<span class="replacement-highlight">翔名科技股份有限公司</span>');
    return result;
}

// -----------------------------------------------------------
//  渲染訊息
// -----------------------------------------------------------
function renderMessages() {
    chatDom.messagesContainer.innerHTML = "";

    const filtered = appState.messages.filter(msg => {
        if (appState.activeChannel === "public") return msg.channel === "public";
        const targetId = appState.activeChannel.replace("private_", "");
        const isMatchPrivate = msg.channel === `private_${targetId}` || msg.channel === `private_${appState.activeUserSim}`;
        const isRelatedUsers = (msg.senderId === appState.activeUserSim && msg.channel === `private_${targetId}`) ||
                               (msg.senderId === targetId && msg.channel === `private_${appState.activeUserSim}`);
        return isMatchPrivate && isRelatedUsers;
    });

    if (filtered.length === 0) {
        chatDom.messagesContainer.innerHTML = `
            <div class="chat-start-notice">
                <i class="fa-regular fa-comment-dots"></i>
                <p>對話開始，輸入的訊息將透過 Gemini 進行中日文即時雙向翻譯。</p>
            </div>
        `;
        return;
    }

    filtered.forEach(msg => {
        if (msg.isSystem) {
            const sysTimeStr = new Date(msg.timestamp).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const div = document.createElement("div");
            div.className = "system-msg-notice";
            div.innerHTML = `<i class="fa-solid fa-circle-info"></i> [${sysTimeStr}] ${msg.text}`;
            chatDom.messagesContainer.appendChild(div);
            return;
        }

        const isSelf = msg.senderId === appState.activeUserSim;
        const row = document.createElement("div");
        row.id = msg.id;
        row.className = `message-row ${isSelf ? 'self' : 'other'}`;

        const timeStr = new Date(msg.timestamp).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const isJa = detectJapanese(msg.text);

        // 管理員刪除按鈕
        const deleteBtnHtml = (appState.currentUser && appState.currentUser.role === "管理員") ?
            `<button class="btn-msg-action delete" title="刪除此訊息" onclick="deleteSingleMessage('${msg.id}')">
                <i class="fa-solid fa-trash-can"></i>
            </button>` : '';

        // 回覆按鈕
        const replyBtnHtml = `<button class="btn-msg-reply" title="回覆此訊息" onclick="setReplyTo('${msg.id}', '${msg.senderName}', '${msg.text.replace(/'/g, "\\'")}')"><i class="fa-solid fa-reply"></i></button>`;

        // 翻譯狀態樣式
        let translationClass = "";
        let translationContent = msg.translation || "";
        if (msg.isTranslating) {
            translationClass = "translating";
            translationContent = `<span class="translation-spinner"><i class="fa-solid fa-spinner fa-spin"></i> 正在翻譯中...</span>`;
        } else if (msg.hasError) {
            translationClass = "translation-error";
        }

        // 被引用的回覆區塊
        let replyQuoteHtml = "";
        if (msg.replyTo) {
            replyQuoteHtml = `<div class="reply-quote" onclick="scrollToMessage('${msg.replyTo.id}')" title="點擊跳至原始訊息">
                <i class="fa-solid fa-reply" style="font-size: 0.7em; margin-right: 4px;"></i> 
                <strong>${msg.replyTo.senderName}</strong>：${msg.replyTo.text}
            </div>`;
        }

        row.innerHTML = `
            <div class="message-meta">
                ${!isSelf ? `<span class="message-sender">${msg.senderName}</span>` : ''}
                <span class="message-tag">${msg.senderRole}</span>
                <span class="message-time">${timeStr}</span>
                ${replyBtnHtml}
            </div>
            <div class="message-bubble">
                ${replyQuoteHtml}
                <div class="text-original">
                    <span class="lang-flag">${isJa ? '日' : '中'}</span>
                    <span class="msg-text">${msg.text}</span>
                </div>
                <div class="text-translated ${translationClass}">
                    <span class="lang-flag">${isJa ? '中' : '日'}</span>
                    <span class="msg-text">${translationContent}</span>
                </div>
            </div>
            <div class="message-actions">
                <button class="btn-msg-action" title="複製譯文" onclick="copyTranslatedText(this)">
                    <i class="fa-solid fa-copy"></i> 複製譯文
                </button>
                ${deleteBtnHtml}
            </div>
        `;

        chatDom.messagesContainer.appendChild(row);
    });

    chatDom.messagesContainer.scrollTop = chatDom.messagesContainer.scrollHeight;
}

// -----------------------------------------------------------
//  複製翻譯文字
// -----------------------------------------------------------
window.copyTranslatedText = function(btnElement) {
    const bubble = btnElement.closest(".message-row").querySelector(".text-translated .msg-text");
    if (!bubble) return;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = bubble.innerHTML;
    const text = tempDiv.textContent || tempDiv.innerText || "";

    navigator.clipboard.writeText(text).then(() => {
        const origText = btnElement.innerHTML;
        btnElement.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-green)"></i> 已複製`;
        setTimeout(() => { btnElement.innerHTML = origText; }, 1500);
    }).catch(() => showToast(t("err_copy_failed"), "error"));
};

// -----------------------------------------------------------
//  管理員刪除訊息
// -----------------------------------------------------------
window.deleteSingleMessage = function(msgId) {
    if (!confirm(t("confirm_delete_msg"))) return;
    deleteMessageFromStore(msgId);
    appState.messages = appState.messages.filter(m => m.id !== msgId);
    renderMessages();
    renderPrivateChannels();
};

// -----------------------------------------------------------
//  管理員清空頻道歷史
// -----------------------------------------------------------
function handleClearChannelHistory() {
    if (!confirm(t("confirm_clear_chat"))) return;

    if (appState.activeChannel === "public") {
        clearChannelMessagesFromStore("public", null);
    } else {
        const targetId = appState.activeChannel.replace("private_", "");
        clearChannelMessagesFromStore(appState.activeChannel, targetId);
    }

    if (!firebaseReady) {
        renderMessages();
        renderPrivateChannels();
    }
}

// -----------------------------------------------------------
//  未讀與通知
// -----------------------------------------------------------
function clearUnread(channelId) {
    appState.unreadCounts[channelId] = 0;
    let badgeId = channelId === "public" ? "unread-public" : `unread-priv-${channelId.replace("private_", "")}`;
    const badge = document.getElementById(badgeId);
    if (badge) badge.style.display = "none";
}

function recalculateUnreadCounts() {
    if (!appState.currentUser || !appState.activeUserSim) return;
    
    appState.unreadCounts = {};
    appState.messages.forEach(msg => {
        if (msg.senderId !== appState.activeUserSim && !msg.isSystem) {
            let targetChan = "";
            if (msg.channel === "public") targetChan = "public";
            else if (msg.channel === `private_${appState.activeUserSim}`) targetChan = `private_${msg.senderId}`;
            
            if (targetChan && targetChan !== appState.activeChannel) {
                const lrTime = appState.lastRead[targetChan] || "1970-01-01T00:00:00.000Z";
                if (new Date(msg.timestamp) > new Date(lrTime)) {
                    appState.unreadCounts[targetChan] = (appState.unreadCounts[targetChan] || 0) + 1;
                }
            }
        }
    });
    
    // 更新公頻未讀標籤
    const unreadPublicBadge = document.getElementById("unread-public");
    if (unreadPublicBadge) {
        const count = appState.unreadCounts["public"] || 0;
        unreadPublicBadge.style.display = count > 0 ? "" : "none";
        unreadPublicBadge.textContent = count;
    }
}

// -----------------------------------------------------------
//  Toast 通知系統
// -----------------------------------------------------------
function showToast(message, type = "info", duration = 4000) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const iconMap = {
        info: "circle-info",
        success: "circle-check",
        warning: "triangle-exclamation",
        error: "circle-exclamation"
    };

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid fa-${iconMap[type] || 'circle-info'}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    // 進入動畫
    requestAnimationFrame(() => toast.classList.add("toast-visible"));

    // 自動消失
    setTimeout(() => {
        toast.classList.remove("toast-visible");
        toast.classList.add("toast-exit");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// -----------------------------------------------------------
//  模擬其他使用者隨機發話（僅限離線模式展示用）
// -----------------------------------------------------------
function simulateOtherUsersAction() {
    if (!appState.currentUser) return;
    const candidates = appState.users.filter(u => u.isSimulated && u.id !== appState.activeUserSim);
    if (candidates.length === 0) return;

    const randomUser = candidates[Math.floor(Math.random() * candidates.length)];
    const speeches = [
        { text: "CNC 五軸機台加工已經啟動，預計下午完成。", isJa: false },
        { text: "研磨工程の進捗はいかがでしょうか？", isJa: true },
        { text: "零件清洗完成，已送至品質保證部門進行量測檢驗。", isJa: false },
        { text: "線切割加工設備保養完了、問題ありません。", isJa: true },
        { text: "關於 Feedback Japan 的工廠圖紙，有最新的修改嗎？", isJa: false },
        { text: "Feedbackの仕様書を確認してください。", isJa: true }
    ];

    const speech = speeches[Math.floor(Math.random() * speeches.length)];
    let translation = translateLocalFallback(speech.text, speech.isJa);
    translation = applyFeedbackRule(translation);

    const newMsg = {
        id: `sim-${Date.now()}`,
        channel: "public",
        senderId: randomUser.id,
        senderName: randomUser.name,
        senderRole: randomUser.role,
        text: speech.text,
        translation: translation,
        timestamp: new Date().toISOString(),
        isTranslating: false,
        hasError: false
    };

    saveMessageToStore(newMsg);
    if (!firebaseReady) {
        appState.messages.push(newMsg);
        if (appState.activeChannel === "public") {
            try { sound.playNotification(); } catch (e) {}
            renderMessages();
        } else {
            try { sound.playNotification(); } catch (e) {}
        }
    }
}

// -----------------------------------------------------------
//  現場常用語管理 (Quick Phrases)
// -----------------------------------------------------------
window.renderQuickPhrases = function() {
    const container = document.getElementById("quick-phrases-container");
    if (!container) return;
    
    container.innerHTML = "";
    appState.quickPhrases.forEach(phrase => {
        if (!phrase.trim()) return;
        const btn = document.createElement("button");
        btn.className = "quick-phrase-btn";
        btn.textContent = phrase;
        btn.onclick = () => {
            const input = document.getElementById("chat-message-input");
            if (input) {
                if (input.value && !input.value.endsWith(" ")) {
                    input.value += " " + phrase;
                } else {
                    input.value += phrase;
                }
                input.focus();
            }
        };
        container.appendChild(btn);
    });
};

window.openEditQuickPhrasesModal = function() {
    const modal = document.getElementById("edit-quick-phrases-modal");
    if (!modal) return;
    
    const listEl = document.getElementById("quick-phrases-edit-list");
    listEl.innerHTML = "";
    
    appState.quickPhrases.forEach(phrase => {
        if (phrase.trim()) {
            listEl.appendChild(createQuickPhraseEditRow(phrase));
        }
    });
    
    modal.style.display = "flex";
};

window.closeEditQuickPhrasesModal = function() {
    const modal = document.getElementById("edit-quick-phrases-modal");
    if (modal) modal.style.display = "none";
};

window.createQuickPhraseEditRow = function(value = "") {
    const row = document.createElement("div");
    row.className = "quick-phrase-edit-row";
    
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.placeholder = "請輸入常用語...";
    
    const delBtn = document.createElement("button");
    delBtn.className = "btn-remove";
    delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    delBtn.onclick = () => {
        row.remove();
    };
    
    row.appendChild(input);
    row.appendChild(delBtn);
    return row;
};

window.addQuickPhraseInput = function() {
    const listEl = document.getElementById("quick-phrases-edit-list");
    if (listEl) {
        listEl.appendChild(createQuickPhraseEditRow(""));
    }
};

window.saveQuickPhrases = function() {
    const listEl = document.getElementById("quick-phrases-edit-list");
    if (!listEl) return;
    
    const inputs = listEl.querySelectorAll("input[type='text']");
    const newPhrases = [];
    inputs.forEach(input => {
        const val = input.value.trim();
        if (val) {
            newPhrases.push(val);
        }
    });
    
    if (newPhrases.length === 0) {
        alert(t("err_keep_one_phrase"));
        return;
    }
    
    if (db) {
        db.ref("quick_phrases").set(newPhrases)
            .then(() => {
                showToast(t("toast_phrase_updated"), "success");
                closeEditQuickPhrasesModal();
            })
            .catch(err => {
                console.error("更新常用語失敗", err);
                showToast(t("toast_phrase_failed"), "error");
            });
    }
};

// -----------------------------------------------------------
//  手機版側邊欄控制
// -----------------------------------------------------------
window.toggleMobileSidebar = function(forceState) {
    const sidebar = document.getElementById("chat-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;
    
    const isActive = sidebar.classList.contains("sidebar-active");
    const nextState = forceState !== undefined ? forceState : !isActive;
    
    if (nextState) {
        sidebar.classList.add("sidebar-active");
        overlay.classList.add("active");
    } else {
        sidebar.classList.remove("sidebar-active");
        overlay.classList.remove("active");
    }
};

// -----------------------------------------------------------
//  隱藏/顯示系統登入訊息
// -----------------------------------------------------------
window.toggleSystemMessages = function() {
    appState.hideSystemMessages = !appState.hideSystemMessages;
    localStorage.setItem("hide_system_messages", appState.hideSystemMessages ? "1" : "0");
    applySystemMessageState();
};

window.applySystemMessageState = function() {
    const icon = document.getElementById("sysmsg-icon");
    const text = document.getElementById("sysmsg-text");
    if (!icon || !text) return;
    
    if (appState.hideSystemMessages) {
        icon.className = "fa-solid fa-eye";
        text.textContent = "顯示登入訊息";
        document.body.classList.add("hide-system-messages");
    } else {
        icon.className = "fa-solid fa-eye-slash";
        text.textContent = "隱藏登入訊息";
        document.body.classList.remove("hide-system-messages");
    }
};

window.clearAllSystemMessages = function() {
    if (firebaseReady && db) {
        const toDelete = appState.messages.filter(msg => msg.isSystem);
        if (toDelete.length === 0) {
            showToast("目前沒有任何登入紀錄", "info");
            return;
        }
        const updates = {};
        toDelete.forEach(msg => {
            updates["messages/" + sanitizeFirebaseKey(msg.id)] = null;
        });
        db.ref().update(updates).then(() => {
            showToast("已清除所有登入紀錄", "success");
        }).catch(e => {
            showToast("清除失敗: " + e.message, "error");
        });
    } else {
        const hasSystemMsg = appState.messages.some(msg => msg.isSystem);
        if (!hasSystemMsg) {
            showToast("目前沒有任何登入紀錄", "info");
            return;
        }
        appState.messages = appState.messages.filter(msg => !msg.isSystem);
        localStorage.setItem("feedback_chat_messages", JSON.stringify(appState.messages));
        renderMessages();
        showToast("已清除所有登入紀錄", "success");
    }
};

// -----------------------------------------------------------
//  回覆訊息功能
// -----------------------------------------------------------
window.setReplyTo = function(msgId, senderName, text) {
    appState.replyingTo = { id: msgId, senderName: senderName, text: text };
    
    const previewBar = document.getElementById("reply-preview-bar");
    const previewText = document.getElementById("reply-preview-text");
    if (previewBar && previewText) {
        previewText.textContent = `回覆 ${senderName}：${text}`;
        previewBar.style.display = "flex";
    }
    chatDom.chatMessageInput.focus();
};

window.cancelReply = function() {
    appState.replyingTo = null;
    const previewBar = document.getElementById("reply-preview-bar");
    if (previewBar) {
        previewBar.style.display = "none";
    }
};

window.scrollToMessage = function(msgId) {
    // 尋找 DOM 中的訊息 (由於我們沒有把 ID 放在外層，所以要透過某種方式尋找。
    // 在 renderMessages() 中，我們會需要把 msg.id 綁在 element 上)
    const el = document.getElementById(msgId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add("msg-highlight");
        setTimeout(() => {
            el.classList.remove("msg-highlight");
        }, 2000);
    } else {
        showToast("找不到該則原始訊息 (可能已被刪除或捲動過多)", "warning");
    }
};
