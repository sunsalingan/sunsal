export const isInAppBrowser = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    // Detect KakaoTalk, Line, Facebook, Instagram, Naver, etc.
    return (
        ua.includes("kakaotalk") ||
        ua.includes("line") ||
        ua.includes("fban") ||
        ua.includes("fbav") ||
        ua.includes("instagram") ||
        ua.includes("naver") ||
        ua.includes("snapchat") ||
        ua.includes("crios") && !ua.includes("safari") || // Chrome on iOS might behave differently, but usually fine. Focus on WebViews.
        ua.includes("whale") // Whale?
        // Add more if needed.
        // However, purely "embedded" webviews often have just "; wv" or specific tokens.
        // For now, target the major messengers in Korea.
    );
};

export const isAndroid = () => /android/i.test(window.navigator.userAgent);
export const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export const redirectToExternalBrowser = () => {
    const currentUrl = window.location.href;

    if (isAndroid()) {
        // Android Chrome Intent Scheme
        // intent://<URL>#Intent;scheme=http;package=com.android.chrome;end
        // However, we want to open the *current* URL.
        // If scheme is https, usually: intent://<path>#Intent;scheme=https;package=com.android.chrome;end

        // Safer generic intent for "View" action in default browser:
        const scheme = currentUrl.startsWith("https") ? "https" : "http";
        const urlWithoutScheme = currentUrl.replace(/^https?:\/\//, "");

        // "intent:google.com#Intent;scheme=https;package=com.android.chrome;end"
        // Using `S.browser_fallback_url` is also good practice if the app isn't installed.
        const intentUrl = `intent://${urlWithoutScheme}#Intent;scheme=${scheme};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end`;

        window.location.href = intentUrl;
        return true;
    }

    return false; // Not handled (e.g. iOS or Desktop)
};
