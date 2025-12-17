export const isInAppBrowser = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const targetBrowsers = [
        'kakao',
        'naver',
        'instagram',
        'fb', // Facebook
        'line',
        'daum',
    ];

    return targetBrowsers.some((browser) => userAgent.includes(browser));
};

export const getBreakoutUrl = () => {
    const url = window.location.href;
    // Android intent scheme to force open in Chrome
    return `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
};

export const isAndroid = () => {
    return /android/i.test(window.navigator.userAgent);
};

export const isIOS = () => {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};
